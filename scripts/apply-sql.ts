import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { Signer } from "@aws-sdk/rds-signer";
import { Pool } from "pg";

/**
 * Generic SQL runner for ad-hoc migrations against the live database.
 *
 *   npx tsx scripts/apply-sql.ts scripts/sql/0002_clinic_signatures.sql
 *
 * Connects with the same RDS IAM auth the app uses (no static password) and
 * runs each `;`-delimited statement on its own (no surrounding transaction, so
 * `CONCURRENTLY` works). Statements should be written idempotently
 * (IF NOT EXISTS / ON CONFLICT) so a re-run is safe.
 */

function parseStatements(sql: string): string[] {
  const withoutComments = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  return withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: tsx scripts/apply-sql.ts <path-to-sql-file>");
    process.exit(1);
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

  console.log("Generating IAM auth token…");
  const token = await signer.getAuthToken();

  const pool = new Pool({
    host: process.env.PGHOST!,
    user: process.env.PGUSER!,
    database: process.env.PGDATABASE || "postgres",
    password: token,
    port: Number(process.env.PGPORT),
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  const meta = await pool.query(
    "select current_database() as db, current_user as usr",
  );
  console.log(`Connected to ${meta.rows[0].db} as ${meta.rows[0].usr}\n`);

  const statements = parseStatements(readFileSync(file, "utf8"));
  console.log(`Applying ${statements.length} statement(s) from ${file}…`);
  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, " ").slice(0, 70);
    process.stdout.write(`  • ${preview}… `);
    const start = Date.now();
    try {
      const res = await pool.query(stmt);
      const n = typeof res.rowCount === "number" ? ` (${res.rowCount} rows)` : "";
      console.log(`ok${n} ${Date.now() - start}ms`);
    } catch (err) {
      console.log("FAILED");
      console.error(`    ${err instanceof Error ? err.message : err}`);
      await pool.end();
      process.exit(1);
    }
  }

  await pool.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nFailed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
