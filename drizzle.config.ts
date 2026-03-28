import { config } from "dotenv";
config({ path: ".env.local" });

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST!,
        port: Number(process.env.PGPORT),
        user: process.env.PGUSER!,
        database: process.env.PGDATABASE || "postgres",
        ssl: "require",
      },
});
