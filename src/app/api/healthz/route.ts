import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness probe.
 *
 * Answers a single question: "is the function process alive and able to
 * respond to HTTP?" — deliberately does NOT touch any dependency. A
 * succeeding `/healthz` plus a failing `/readyz` is the standard signal
 * for "the process is up but a downstream is broken; don't take it out
 * of rotation yet, just stop sending it traffic."
 *
 * Pair this with Vercel Cron monitors or an uptime check (e.g. Better
 * Stack) that pings every 60 s.
 */
export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      ts: new Date().toISOString(),
      service: "logos-website",
      release: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
      region: process.env.VERCEL_REGION ?? "local",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        // The healthz endpoint should never be indexed.
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
