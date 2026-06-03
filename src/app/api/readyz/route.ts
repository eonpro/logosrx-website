import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { log } from "@/lib/observability/logger";
import { ServerTiming } from "@/lib/observability/timing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Readiness probe.
 *
 * Returns 200 only when every critical downstream the request path needs
 * is reachable:
 *
 *   - Postgres: a 1 ms `SELECT 1` round-trip. Uses the existing pooled
 *     `db` client so we exercise the same IAM auth + SSL path the rest of
 *     the app uses.
 *
 * Future additions when introduced:
 *   - Upstash Redis  → `redis.ping()` against the rate-limit bucket.
 *   - Vercel Blob    → `head()` on a known small object.
 *   - Clerk          → `await clerkClient.organizations.getOrganizationList({ limit: 1 })`.
 *
 * Returns a structured payload so an alerting agent (or a human running
 * `curl`) can immediately see which dependency is sad. Always 503 on
 * partial failure — fail loud, fail fast.
 */
interface CheckResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

async function checkDb(): Promise<CheckResult> {
  const start = performance.now();
  try {
    await db.execute(sql`select 1 as up`);
    return { ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function GET() {
  const timing = new ServerTiming();
  const dbCheck = await timing.measure("db", checkDb, "select 1");

  const overall = dbCheck.ok;
  const body = {
    status: overall ? "ready" : "not_ready",
    ts: new Date().toISOString(),
    checks: { db: dbCheck },
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
    region: process.env.VERCEL_REGION ?? "local",
  };

  if (!overall) {
    log.warn("readyz failed", { checks: body.checks });
  }

  return NextResponse.json(body, {
    status: overall ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
      "Server-Timing": timing.toHeader(),
    },
  });
}
