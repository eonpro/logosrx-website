import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import * as Sentry from "@sentry/nextjs";
import { log } from "@/lib/observability/logger";

/**
 * Rate limiting for public POST endpoints.
 *
 * Uses Upstash Redis when configured via either:
 *   - `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Vercel KV / Upstash integration)
 *   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (direct Upstash)
 *
 * Falls back to a per-process in-memory limiter in dev/test so forms still
 * work without external infra. In-memory state is intentionally NOT used in
 * production; we fail-open with a single warning log to avoid taking the
 * site down when Upstash is unreachable.
 */

const restUrl =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const restToken =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  restUrl && restToken ? new Redis({ url: restUrl, token: restToken }) : null;

if (!redis && process.env.NODE_ENV === "production") {
  // Visible once at module-load time so ops can spot misconfiguration.
  console.warn(
    "[rate-limit] Upstash credentials not configured; using in-memory fallback. " +
      "Set KV_REST_API_URL/TOKEN or UPSTASH_REDIS_REST_URL/TOKEN.",
  );
}

interface BucketState {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, BucketState>();

interface MemoryLimitResult {
  success: boolean;
  reset: number;
  remaining: number;
}

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): MemoryLimitResult {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, reset: now + windowMs, remaining: limit - 1 };
  }
  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return {
    success: existing.count <= limit,
    reset: existing.resetAt,
    remaining,
  };
}

function makeLimiter(prefix: string, requests: number, windowSeconds: number) {
  if (redis) {
    return new Ratelimit({
      redis,
      prefix: `logos:${prefix}`,
      limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
      analytics: true,
    });
  }
  return null;
}

const limiters = {
  form: makeLimiter("form", 5, 60), // 5 form submits / minute / key
  email: makeLimiter("email", 3, 60), // 3 newsletter signups / minute / key
  resume: makeLimiter("resume", 2, 60 * 5), // 2 resume uploads / 5 minutes / key
  download: makeLimiter("download", 10, 60), // 10 token attempts / minute / key
  report: makeLimiter("report", 30, 60), // 30 CSP reports / minute / key
} as const;

const memoryConfig = {
  form: { limit: 5, windowMs: 60_000 },
  email: { limit: 3, windowMs: 60_000 },
  resume: { limit: 2, windowMs: 5 * 60_000 },
  download: { limit: 10, windowMs: 60_000 },
  report: { limit: 30, windowMs: 60_000 },
} as const;

export type LimiterKey = keyof typeof limiters;

export interface RateLimitResult {
  success: boolean;
  reset: number;
  remaining: number;
}

/**
 * Best-effort caller identity. Prefers the real client IP forwarded by Vercel,
 * then falls back to the request's host so we still impose *some* limit when
 * the IP header is absent (e.g. during local testing).
 */
export function getClientKey(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return req.headers.get("host") ?? "unknown";
}

export async function rateLimit(
  bucket: LimiterKey,
  req: NextRequest,
): Promise<RateLimitResult> {
  return rateLimitKey(bucket, getClientKey(req));
}

/**
 * Limits against a caller-supplied identity key. Useful from contexts without a
 * `NextRequest` (e.g. server actions, where the key is derived from `headers()`).
 */
export async function rateLimitKey(
  bucket: LimiterKey,
  key: string,
): Promise<RateLimitResult> {
  const limiter = limiters[bucket];

  if (limiter) {
    try {
      const result = await limiter.limit(key);
      return {
        success: result.success,
        reset: result.reset,
        remaining: result.remaining,
      };
    } catch (err) {
      // Degrade, don't fail open: an Upstash/Redis outage must never turn
      // legitimate requests into 500s, but unconditionally allowing every
      // request would drop all throttling for the duration of the outage.
      // Fall back to the per-instance in-memory limiter (weaker — not shared
      // across instances — but still a real cap) and report the degradation.
      log.warn("rate-limit limiter error; falling back to in-memory limit", {
        bucket,
        error: err instanceof Error ? err.message : "unknown",
      });
      Sentry.captureException(err, {
        tags: { surface: "rate-limit", bucket },
        level: "warning",
      });
      const cfg = memoryConfig[bucket];
      return memoryLimit(`${bucket}:${key}`, cfg.limit, cfg.windowMs);
    }
  }

  const cfg = memoryConfig[bucket];
  return memoryLimit(`${bucket}:${key}`, cfg.limit, cfg.windowMs);
}

export interface DependencyCheck {
  /** Whether the dependency is wired up in this environment. */
  configured: boolean;
  /** True when reachable (or not configured — nothing to be unhealthy about). */
  ok: boolean;
  error?: string;
}

/**
 * Readiness probe for the rate-limit backing store. Returns `configured:false`
 * (and `ok:true`) when Upstash isn't wired up — the app intentionally falls
 * back to an in-memory limiter, so an unconfigured store is not a failure.
 */
export async function checkRateLimitStore(): Promise<DependencyCheck> {
  if (!redis) return { configured: false, ok: true };
  try {
    await redis.ping();
    return { configured: true, ok: true };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

/** Derives a best-effort client identity from a `Headers`-like object. */
export function clientKeyFromHeaders(h: {
  get(name: string): string | null;
}): string {
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();
  return h.get("host") ?? "unknown";
}

/**
 * Honeypot: a hidden form field that humans never fill but bots tend to.
 * If the value is non-empty, we treat it as spam and silently succeed so the
 * attacker doesn't learn that the submission was rejected.
 */
export const HONEYPOT_FIELD = "company_website";

export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(result.reset),
  };
}
