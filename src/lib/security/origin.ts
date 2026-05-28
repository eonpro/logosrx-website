import type { NextRequest } from "next/server";

/**
 * Same-origin check for state-changing requests (POST / PUT / DELETE).
 *
 * Browsers attach the `Origin` header on all cross-origin requests (and on
 * same-origin POSTs in modern browsers). Older clients fall back to `Referer`.
 * Vercel sets `x-forwarded-host` based on the incoming request so the canonical
 * production origin can be validated even when running behind their proxy.
 *
 * Allow-list:
 *   - `https://www.logosrx.com` (canonical production)
 *   - `https://logosrx.com` (apex)
 *   - any `*.vercel.app` preview deploy (gated to https)
 *   - localhost dev (http and https) when NODE_ENV !== "production"
 */
const ALLOWED_PRODUCTION_ORIGINS = [
  "https://www.logosrx.com",
  "https://logosrx.com",
];

const VERCEL_PREVIEW_HOST = /^[a-z0-9-]+\.vercel\.app$/i;
const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i;

function isAllowedOrigin(originUrl: URL, currentHost: string | null): boolean {
  if (ALLOWED_PRODUCTION_ORIGINS.includes(originUrl.origin)) return true;

  if (originUrl.protocol === "https:" && VERCEL_PREVIEW_HOST.test(originUrl.host)) {
    return true;
  }

  if (
    process.env.NODE_ENV !== "production" &&
    LOCAL_HOSTS.test(originUrl.host)
  ) {
    return true;
  }

  // Fallback: trust the request's own host when proxied through Vercel.
  // This handles custom preview domains and prevents lockouts on staging.
  if (currentHost && originUrl.host === currentHost) return true;

  return false;
}

export interface OriginCheckResult {
  ok: boolean;
  reason?: "missing" | "invalid" | "mismatch";
}

export function checkSameOrigin(req: NextRequest): OriginCheckResult {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");

  const raw = origin ?? referer;
  if (!raw) return { ok: false, reason: "missing" };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  return isAllowedOrigin(url, host)
    ? { ok: true }
    : { ok: false, reason: "mismatch" };
}
