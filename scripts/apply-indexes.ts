import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { Signer } from "@aws-sdk/rds-signer";
import { Pool } from "pg";

/**
 * Applies scripts/sql/0001_performance_indexes.sql against the live database.
 *
 * Each statement is run on its own (no BEGIN/COMMIT wrapper) because
 * `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block. The SQL
 * uses `IF NOT EXISTS`, so re-running is safe and idempotent.
 *
 * Connects with the same RDS IAM auth the app uses (no static password).
 */

const SQL_PATH = join("scripts", "sql", "0001_performance_indexes.sql");

/** Strips `--` comments and splits the file into individual SQL statements. */
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
    // One connection is enough; CONCURRENTLY builds are serialized here.
    max: 1,
  });

  const meta = await pool.query(
    "select current_database() as db, current_user as usr",
  );
  console.log(
    `Connected to ${meta.rows[0].db} as ${meta.rows[0].usr}\n`,
  );

  const statements = parseStatements(readFileSync(SQL_PATH, "utf8"));
  console.log(`Applying ${statements.length} index statement(s)…`);
  for (const stmt of statements) {
    const name = /INDEX (?:CONCURRENTLY )?(?:IF NOT EXISTS )?(\S+)/i.exec(
      stmt,
    )?.[1];
    process.stdout.write(`  • ${name ?? stmt.slice(0, 60)} … `);
    const start = Date.now();
    try {
      await pool.query(stmt);
      console.log(`ok (${Date.now() - start}ms)`);
    } catch (err) {
      console.log(`FAILED`);
      console.error(`    ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log("\nIndexes now present on the read-path tables:");
  const tables = [
    "clinics",
    "employment_applications",
    "clinic_signups",
    "clinic_notes",
    "promotions",
    "featured_products",
  ];
  const res = await pool.query(
    `select tablename, indexname
       from pg_indexes
      where tablename = any($1::text[])
      order by tablename, indexname`,
    [tables],
  );
  let current = "";
  for (const row of res.rows as { tablename: string; indexname: string }[]) {
    if (row.tablename !== current) {
      current = row.tablename;
      console.log(`\n  ${current}`);
    }
    console.log(`    - ${row.indexname}`);
  }

  await pool.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nFailed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
