import { log } from "@/lib/observability/logger";

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
  // pg-pool when connectionTimeoutMillis fires during client.connect()
  "connection terminated due to connection timeout",
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

const RETRY_BACKOFF_MS = [150, 400] as const;

function errorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function matchesTransient(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = errorCode(err);
  if (code && TRANSIENT_PG_CODES.has(code)) return true;
  const msg = err.message.toLowerCase();
  return TRANSIENT_MESSAGE_FRAGMENTS.some((frag) => msg.includes(frag));
}

/**
 * True when an error reflects a severed/stale connection rather than a real
 * application/query fault. Walks `error.cause` because drizzle wraps driver
 * failures as `Failed query: …` with the pg/pool error nested — without the
 * walk, retries never fire and admin views surface "Couldn't load this view".
 * Safe to retry: the offending client has already been evicted from the pool.
 */
export function isTransientConnectionError(err: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = err;
  while (current != null && !seen.has(current)) {
    seen.add(current);
    if (matchesTransient(current)) return true;
    current =
      current instanceof Error
        ? (current as Error & { cause?: unknown }).cause
        : undefined;
  }
  return false;
}

/**
 * Runs a DB operation with transparent retries when it fails due to a
 * stale/severed pooled connection. Under serverless + Aurora, the pool can
 * hand out a connection whose socket the server already closed, or a new
 * IAM connect can time out; retries grab a fresh connection and usually
 * succeed, turning a user-facing 500 into an invisible blip.
 *
 * Read statements are already wrapped automatically (see `installReadRetry` in
 * `./index`), so call this explicitly only when you want retry around a unit of
 * work that the pool-level shim can't safely cover on its own — e.g. an
 * idempotent write (an UPSERT, a `delete … where id = $1`) or a sequence of
 * statements you know is safe to replay. Only connection-level errors are
 * retried; query/constraint errors propagate immediately so we never
 * double-execute on a real failure. Do NOT wrap multi-statement transactions
 * that aren't safe to replay.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; label?: string },
): Promise<T> {
  // 2 retries = 3 attempts total. Connect timeouts often need a second fresh
  // TCP+IAM attempt after the first socket dies mid-handshake.
  const retries = opts?.retries ?? 2;
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
        const delay =
          RETRY_BACKOFF_MS[Math.min(attempt, RETRY_BACKOFF_MS.length - 1)] ??
          400;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
