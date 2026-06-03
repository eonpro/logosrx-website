import "server-only";
import { waitUntil } from "@vercel/functions";

/**
 * Run best-effort, non-critical work (Slack pings, transactional emails)
 * WITHOUT blocking the user-facing response.
 *
 * On Vercel, `waitUntil` keeps the serverless invocation alive until the
 * promise settles, so the work still completes after the response is flushed.
 * Outside that runtime (local dev, tests) `waitUntil` may throw because there's
 * no request context — we fall back to a detached promise so callers behave the
 * same everywhere.
 *
 * The passed promise MUST handle its own errors (these helpers already swallow
 * failures); we attach a catch as a final safety net so a rejection can never
 * surface as an unhandled rejection.
 */
export function runAfterResponse(work: Promise<unknown>): void {
  const safe = Promise.resolve(work).catch(() => {});
  try {
    waitUntil(safe);
  } catch {
    void safe;
  }
}
