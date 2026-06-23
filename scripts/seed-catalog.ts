import { config } from "dotenv";
config({ path: ".env.local" });

import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { Signer } from "@aws-sdk/rds-signer";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import { catalogProducts as catalogSeed } from "../src/data/catalog";
import { catalogProductToInsert } from "../src/lib/catalog/mapping";

/**
 * Backfills the `catalog_products` table from the static `catalogProducts`
 * array in `src/data/catalog.ts`:
 *
 *   npm run db:seed-catalog
 *
 * Idempotent: each SKU is inserted ON CONFLICT (id) DO NOTHING, so existing
 * rows (including admin edits) are never overwritten. `sort_order` is the
 * product's index in the source array, preserving the current display order.
 *
 * Connects with DATABASE_URL when set (local/CI) or RDS IAM auth otherwise,
 * matching `src/lib/db/index.ts`.
 */

function buildPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (url) {
    const needsSsl = /sslmode=require/i.test(url);
    return new Pool({
      connectionString: url,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: 2,
    });
  }
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
  return new Pool({
    host: process.env.PGHOST!,
    user: process.env.PGUSER!,
    database: process.env.PGDATABASE || "postgres",
    password: () => signer.getAuthToken(),
    port: Number(process.env.PGPORT),
    ssl: { rejectUnauthorized: false },
    max: 2,
  });
}

async function main() {
  const pool = buildPool();
  const db = drizzle(pool, { schema });

  const meta = await pool.query(
    "select current_database() as db, current_user as usr",
  );
  console.log(`Connected to ${meta.rows[0].db} as ${meta.rows[0].usr}`);

  const rows = catalogSeed.map((p, i) => catalogProductToInsert(p, i));
  console.log(`Seeding ${rows.length} catalog product(s)…`);

  let inserted = 0;
  for (const row of rows) {
    const res = await db
      .insert(schema.catalogProducts)
      .values(row)
      .onConflictDoNothing({ target: schema.catalogProducts.id });
    inserted += res.rowCount ?? 0;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.catalogProducts);

  console.log(
    `Done. Inserted ${inserted} new row(s); table now holds ${count} product(s).`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error("\nFailed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
