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

/**
 * Splits a SQL script into individual statements on top-level semicolons,
 * while ignoring semicolons that appear inside line comments (`-- …`), block
 * comments (`/* … *\/`), single-quoted strings (`'…'`), and dollar-quoted
 * blocks (`$$ … $$` or `$tag$ … $tag$`). The dollar-quote handling is what lets
 * `DO $$ BEGIN … END $$;` guard blocks (used for idempotent enum creation)
 * survive intact — a naive `split(";")` shreds them.
 */
function parseStatements(sql: string): string[] {
  const out: string[] = [];
  let buf = "";
  let i = 0;
  let inSingle = false; // inside '...'
  let inLineComment = false; // inside -- ...
  let inBlockComment = false; // inside /* ... */
  let dollarTag: string | null = null; // active $tag$ delimiter

  while (i < sql.length) {
    const c = sql[i];

    if (inLineComment) {
      buf += c;
      if (c === "\n") inLineComment = false;
      i++;
      continue;
    }
    if (inBlockComment) {
      if (sql.startsWith("*/", i)) {
        buf += "*/";
        i += 2;
        inBlockComment = false;
        continue;
      }
      buf += c;
      i++;
      continue;
    }
    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        buf += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      buf += c;
      i++;
      continue;
    }
    if (inSingle) {
      buf += c;
      if (c === "'") {
        if (sql[i + 1] === "'") {
          buf += "'"; // escaped quote inside the string
          i += 2;
          continue;
        }
        inSingle = false;
      }
      i++;
      continue;
    }

    // Not currently inside any quoted/comment region.
    if (sql.startsWith("--", i)) {
      inLineComment = true;
      buf += "--";
      i += 2;
      continue;
    }
    if (sql.startsWith("/*", i)) {
      inBlockComment = true;
      buf += "/*";
      i += 2;
      continue;
    }
    if (c === "'") {
      inSingle = true;
      buf += c;
      i++;
      continue;
    }
    if (c === "$") {
      const match = /^\$[A-Za-z0-9_]*\$/.exec(sql.slice(i));
      if (match) {
        dollarTag = match[0];
        buf += match[0];
        i += match[0].length;
        continue;
      }
    }
    if (c === ";") {
      const trimmed = buf.trim();
      if (trimmed) out.push(trimmed);
      buf = "";
      i++;
      continue;
    }

    buf += c;
    i++;
  }

  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
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
