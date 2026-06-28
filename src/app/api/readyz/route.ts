import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { checkRateLimitStore } from "@/lib/security/rate-limit";
import { checkBlobStore } from "@/lib/storage/blob-health";
import { log } from "@/lib/observability/logger";
import { ServerTiming } from "@/lib/observability/timing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Readiness probe.
 *
 * Reports the health of the downstreams the request path depends on. Checks are
 * split by severity:
 *
 *   - CRITICAL — needed by (nearly) every request. A failure flips the probe to
 *     503 so the platform pulls the instance.
 *       • Postgres: a `SELECT 1` round-trip via the shared IAM-auth pool.
 *
 *   - NON-CRITICAL — used by specific routes and/or designed to fail open. A
 *     failure is surfaced as `degraded` but keeps the probe at 200, so a Redis
 *     or Blob blip doesn't take the whole site out of rotation.
 *       • Upstash Redis (rate limiting; falls back to in-memory).
 *       • Vercel Blob (uploads/downloads).
 *
 * Returns a structured payload so an alerting agent (or a human running `curl`)
 * can immediately see which dependency is sad.
 */
interface CheckResult {
  ok: boolean;
  latencyMs: number;
  critical: boolean;
  configured?: boolean;
  error?: string;
}

async function checkDb(): Promise<CheckResult> {
  const start = performance.now();
  try {
    await db.execute(sql`select 1 as up`);
    return { ok: true, latencyMs: Math.round(performance.now() - start), critical: true };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      critical: true,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const start = performance.now();
  const res = await checkRateLimitStore();
  return {
    ok: res.ok,
    latencyMs: Math.round(performance.now() - start),
    critical: false,
    configured: res.configured,
    error: res.error,
  };
}

async function checkBlob(): Promise<CheckResult> {
  const start = performance.now();
  const res = await checkBlobStore();
  return {
    ok: res.ok,
    latencyMs: Math.round(performance.now() - start),
    critical: false,
    configured: res.configured,
    error: res.error,
  };
}

export async function GET() {
  const timing = new ServerTiming();

  // Run the probes concurrently — they hit independent backends.
  const [dbCheck, redisCheck, blobCheck] = await Promise.all([
    timing.measure("db", checkDb, "select 1"),
    timing.measure("redis", checkRedis, "ping"),
    timing.measure("blob", checkBlob, "list 1"),
  ]);

  const checks = { db: dbCheck, redis: redisCheck, blob: blobCheck };
  const checkList = Object.values(checks);

  // Readiness is governed by CRITICAL checks only; a non-critical failure is
  // reported as degraded but never pulls the instance from rotation.
  const ready = checkList.filter((c) => c.critical).every((c) => c.ok);
  const degraded = checkList.some((c) => !c.ok);

  const body = {
    status: ready ? (degraded ? "degraded" : "ready") : "not_ready",
    degraded,
    ts: new Date().toISOString(),
    checks,
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
    region: process.env.VERCEL_REGION ?? "local",
  };

  if (!ready) {
    log.error("readyz not ready", { checks });
  } else if (degraded) {
    log.warn("readyz degraded", { checks });
  }

  return NextResponse.json(body, {
    status: ready ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
      "Server-Timing": timing.toHeader(),
    },
  });
}
