import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
} as const;

const memoryConfig = {
  form: { limit: 5, windowMs: 60_000 },
  email: { limit: 3, windowMs: 60_000 },
  resume: { limit: 2, windowMs: 5 * 60_000 },
  download: { limit: 10, windowMs: 60_000 },
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
    const result = await limiter.limit(key);
    return {
      success: result.success,
      reset: result.reset,
      remaining: result.remaining,
    };
  }

  const cfg = memoryConfig[bucket];
  return memoryLimit(`${bucket}:${key}`, cfg.limit, cfg.windowMs);
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
