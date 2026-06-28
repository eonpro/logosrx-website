import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { attachDatabasePool } from "@vercel/functions";
import { Signer } from "@aws-sdk/rds-signer";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as Sentry from "@sentry/nextjs";
import { log } from "@/lib/observability/logger";
import * as schema from "./schema";

let _pool: Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;
let _signer: Signer | null = null;

// RDS IAM auth tokens are valid for 15 minutes. Minting one runs a SigV4
// signing operation, which is pure CPU but non-trivial when paid on *every*
// new connection (the original behavior). Cache the token and refresh a couple
// of minutes before expiry so the common path is a cheap in-memory read.
const TOKEN_TTL_MS = 13 * 60 * 1000;
let _cachedToken: { value: string; expiresAt: number } | null = null;

function getSigner(): Signer {
  if (!_signer) {
    _signer = new Signer({
      hostname: process.env.PGHOST!,
      port: Number(process.env.PGPORT),
      username: process.env.PGUSER!,
      region: process.env.AWS_REGION!,
      credentials: awsCredentialsProvider({
        roleArn: process.env.AWS_ROLE_ARN!,
        clientConfig: { region: process.env.AWS_REGION! },
      }),
    });
  }
  return _signer;
}

/**
 * Mints a fresh RDS IAM auth token with a bounded retry. This sits on the
 * critical path of *every* new pooled connection — both ordinary reads and the
 * `pool.connect()` that drizzle uses to open a transaction — because `pg`
 * invokes the `password` callback while establishing the socket. If it throws,
 * the connection is aborted *before* any statement runs, so `withDbRetry`'s
 * query-level recovery can't help and the request surfaces as a 500.
 *
 * Minting is side-effect-free (assume the Vercel OIDC role via STS, then sign a
 * SigV4 token locally), so retrying on *any* failure is always safe. A wedged
 * signer (e.g. cached credentials whose underlying OIDC token expired) is
 * dropped between attempts so the next try rebuilds with a fresh assume-role.
 */
async function mintAuthToken(): Promise<string> {
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await getSigner().getAuthToken();
    } catch (err) {
      lastErr = err;
      log.warn("db.iam_token.mint_failed", { attempt, error: err });
      if (attempt < MAX_ATTEMPTS) {
        // Rebuild the signer (and its OIDC credentials provider) before retry.
        _signer = null;
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }
    }
  }
  Sentry.captureException(lastErr, {
    tags: { surface: "db", kind: "iam-token-mint" },
  });
  throw lastErr;
}

async function getCachedAuthToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && _cachedToken.expiresAt > now) {
    return _cachedToken.value;
  }
  const value = await mintAuthToken();
  _cachedToken = { value, expiresAt: now + TOKEN_TTL_MS };
  return value;
}

// Tuning shared by both connection strategies. Pool size is PER serverless
// instance: under Vercel fluid compute many instances run concurrently, so a
// large per-instance pool multiplies into Aurora's global connection limit
// (max_connections). Keep it small; a handful of connections comfortably serves
// the in-instance concurrency. Idle connections are recycled so a long-lived
// instance doesn't hold connections open indefinitely, and we fail fast instead
// of hanging when the DB is unreachable.
const POOL_TUNING = {
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
} as const;

/**
 * Plain connection-string pool for environments that don't use RDS IAM auth —
 * local development and CI (e.g. a throwaway Postgres service container). When
 * `DATABASE_URL` is set we skip the IAM signer entirely. SSL is inferred from
 * the URL (`?sslmode=require`); a local/CI Postgres runs without TLS.
 *
 * Production never sets `DATABASE_URL` (it uses PGHOST/PGUSER + AWS_ROLE_ARN),
 * so this branch is dev/CI-only and cannot weaken the production auth path.
 */
function createUrlPool(connectionString: string): Pool {
  const needsSsl = /sslmode=require/i.test(connectionString);
  return new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    ...POOL_TUNING,
  });
}

/** RDS IAM-authenticated pool (production / preview). */
function createIamPool(): Pool {
  return new Pool({
    host: process.env.PGHOST!,
    user: process.env.PGUSER!,
    database: process.env.PGDATABASE || "postgres",
    password: getCachedAuthToken,
    port: Number(process.env.PGPORT),
    ssl: { rejectUnauthorized: false },
    ...POOL_TUNING,
  });
}

function getPool() {
  if (!_pool) {
    const url = process.env.DATABASE_URL;
    _pool = url ? createUrlPool(url) : createIamPool();

    // CRITICAL: `pg`'s Pool is an EventEmitter. When an *idle* pooled
    // connection is severed by the backend (Aurora recycling idle
    // connections, failover, NAT/network idle timeouts, an admin
    // `pg_terminate_backend`), the pool emits an `error` event on behalf of
    // that client. With no listener, Node treats it as an unhandled
    // exception and tears down the whole serverless instance — poisoning it
    // so subsequent requests fail with a generic 500. Every admin view is
    // `force-dynamic` + DB-backed, so this previously surfaced as frequent
    // "Couldn't load this view" errors. Swallow + report instead of crashing;
    // the dead client has already been removed from the pool, and the
    // user-facing query path is protected by `withDbRetry`.
    _pool.on("error", (err) => {
      log.warn("db.pool.idle_client_error", { error: err });
      Sentry.captureException(err, {
        tags: { surface: "db-pool", kind: "idle-client-error" },
        level: "warning",
      });
    });

    installReadRetry(_pool);
    attachDatabasePool(_pool);
  }
  return _pool;
}

/**
 * Wraps `pool.query` so every *read* statement transparently retries on a
 * severed/stale connection. drizzle routes all non-transactional queries
 * through `pool.query` (see drizzle-orm/node-postgres/session), so this single
 * shim extends retry coverage across the entire data layer without touching
 * call sites. Transactions run on a dedicated client obtained via
 * `pool.connect()`, so multi-statement transactions are intentionally NOT
 * auto-retried (replaying them is unsafe). Writes are also excluded — see
 * `isRetryableReadStatement` — so we never double-apply a mutation; wrap
 * idempotent writes explicitly with `withDbRetry` when desired.
 */
function installReadRetry(pool: Pool): void {
  const original = pool.query.bind(pool) as (
    ...args: unknown[]
  ) => unknown;
  const patched = (...args: unknown[]) => {
    const last = args[args.length - 1];
    // Callback form returns void (not a promise) — pass straight through so we
    // don't change its contract. drizzle never uses this form.
    if (typeof last === "function") return original(...args);
    if (!isRetryableReadStatement(args[0])) return original(...args);
    return withDbRetry(() => original(...args) as Promise<unknown>, {
      label: "pool.query",
    });
  };
  (pool as unknown as { query: typeof patched }).query = patched;
}

/**
 * Conservatively identifies statements that are safe to replay: pure reads
 * with no mutating keywords. A false negative (skipping a retry on an unusual
 * SELECT) is harmless; a false positive (retrying a write) is not, so anything
 * that could mutate state is excluded, including write-CTEs
 * (`WITH x AS (INSERT …)`) and sequence advances.
 */
function isRetryableReadStatement(first: unknown): boolean {
  const text = (
    typeof first === "string"
      ? first
      : first && typeof first === "object" && "text" in first
        ? String((first as { text: unknown }).text)
        : ""
  ).trim();
  if (!/^(?:select|with|show|explain)\b/i.test(text)) return false;
  if (/\b(?:insert|update|delete|merge|nextval|setval)\b/i.test(text)) {
    return false;
  }
  return true;
}

/** Postgres error codes that indicate a transient/recoverable connection loss. */
const TRANSIENT_PG_CODES = new Set([
  "57P01", // admin_shutdown — terminating connection due to administrator command
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now — the database system is starting up
  "08000", // connection_exception
  "08003", // connection_does_not_exist
  "08006", // connection_failure
  "ECONNRESET",
  "EPIPE",
  "ETIMEDOUT",
  "ECONNREFUSED",
]);

const TRANSIENT_MESSAGE_FRAGMENTS = [
  "connection terminated",
  "connection terminated unexpectedly",
  "connection ended unexpectedly",
  "client has encountered a connection error",
  "server closed the connection unexpectedly",
  "timeout exceeded when trying to connect",
  "socket hang up",
  "read econnreset",
  "the database system is",
  // RDS IAM token-mint path: a transient STS/OIDC hiccup surfaces here when the
  // `password` callback throws during connect. `mintAuthToken` already retries
  // internally; this is a conservative secondary net for the read path.
  "could not load credentials",
  "timeout error from oidc",
];

/**
 * True when an error reflects a severed/stale connection rather than a real
 * application/query fault. These are safe to retry because the offending
 * client has already been evicted from the pool, so the next attempt gets a
 * fresh connection.
 */
function isTransientConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as { code?: string }).code;
  if (code && TRANSIENT_PG_CODES.has(code)) return true;
  const msg = err.message.toLowerCase();
  return TRANSIENT_MESSAGE_FRAGMENTS.some((frag) => msg.includes(frag));
}

/**
 * Runs a DB operation with a single transparent retry when it fails due to a
 * stale/severed pooled connection. Under serverless + Aurora, the pool can
 * hand out a connection whose socket the server already closed; the first
 * query then rejects immediately. A retry grabs a fresh connection and
 * succeeds, turning a user-facing 500 into an invisible blip.
 *
 * Read statements are already wrapped automatically (see `installReadRetry`),
 * so call this explicitly only when you want retry around a unit of work that
 * the pool-level shim can't safely cover on its own — e.g. an idempotent write
 * (an UPSERT, a `delete … where id = $1`) or a sequence of statements you know
 * is safe to replay. Only connection-level errors are retried; query/constraint
 * errors propagate immediately so we never double-execute on a real failure. Do
 * NOT wrap multi-statement transactions that aren't safe to replay.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; label?: string },
): Promise<T> {
  const retries = opts?.retries ?? 1;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries && isTransientConnectionError(err)) {
        log.warn("db.retry", {
          attempt: attempt + 1,
          label: opts?.label,
          error: err,
        });
        // Brief backoff so a replacement connection can be established before
        // we try again (avoids hammering a DB that's mid-failover).
        await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/** The top-level database handle type. */
export type Database = NodePgDatabase<typeof schema>;

/**
 * The transaction-scoped executor passed to `db.transaction(async (tx) => …)`.
 * Helpers that must run inside a caller's transaction should accept this so a
 * multi-table write commits (or rolls back) atomically on one connection.
 */
export type DbTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];
