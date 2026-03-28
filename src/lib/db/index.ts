import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { attachDatabasePool } from "@vercel/functions";
import { Signer } from "@aws-sdk/rds-signer";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

let _pool: Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;

function getPool() {
  if (!_pool) {
    const signer = new Signer({
      hostname: process.env.PGHOST!,
      port: Number(process.env.PGPORT),
      username: process.env.PGUSER!,
      region: process.env.AWS_REGION!,
      credentials: awsCredentialsProvider({
        roleArn: process.env.AWS_ROLE_ARN!,
        clientConfig: { region: process.env.AWS_REGION! },
      }),
    });

    _pool = new Pool({
      host: process.env.PGHOST!,
      user: process.env.PGUSER!,
      database: process.env.PGDATABASE || "postgres",
      password: () => signer.getAuthToken(),
      port: Number(process.env.PGPORT),
      ssl: { rejectUnauthorized: false },
      max: 20,
    });

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
