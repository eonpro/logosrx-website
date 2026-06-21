import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { attachDatabasePool } from "@vercel/functions";
import { Signer } from "@aws-sdk/rds-signer";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
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

async function getCachedAuthToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && _cachedToken.expiresAt > now) {
    return _cachedToken.value;
  }
  const value = await getSigner().getAuthToken();
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
    attachDatabasePool(_pool);
  }
  return _pool;
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
