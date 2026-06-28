import { createHmac, randomBytes } from "node:crypto";

/**
 * Pure webhook crypto + constants (no DB), so they're unit-testable. The
 * dispatcher in `webhooks.ts` uses these.
 */

export const WEBHOOK_EVENTS = [
  "clinic.attributed",
  "transaction.recorded",
  "payout.recorded",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function isWebhookEvent(value: string): value is WebhookEvent {
  return (WEBHOOK_EVENTS as readonly string[]).includes(value);
}

/** Signing secret shared with the partner (shown once in the UI). */
export function generateWebhookSecret(): string {
  return "whsec_" + randomBytes(24).toString("base64url");
}

/**
 * HMAC-SHA256 over `"{timestamp}.{body}"`, matching the `X-Logos-Signature:
 * t=<ts>,v1=<hex>` header. Partners recompute this to verify authenticity.
 */
export function signWebhookBody(
  secret: string,
  body: string,
  timestamp: number,
): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

export function signatureHeader(secret: string, body: string, timestamp: number): string {
  return `t=${timestamp},v1=${signWebhookBody(secret, body, timestamp)}`;
}

/** Total delivery attempts (initial + retries) before a delivery is dead-lettered. */
export const WEBHOOK_MAX_ATTEMPTS = 4;

/**
 * Whether a delivery outcome is worth retrying. `status === 0` is our sentinel
 * for a network error / timeout. 429 (rate limited) and 5xx are transient;
 * other 4xx are permanent client errors (bad URL, auth) — retrying just wastes
 * attempts, so we dead-letter immediately.
 */
export function isRetryableStatus(status: number): boolean {
  return status === 0 || status === 429 || (status >= 500 && status <= 599);
}

/**
 * Exponential backoff (1-based attempt): 0.5s, 2s, 8s, … capped at 30s. Jitter
 * is intentionally omitted — deliveries fan out per-subscription, not in a
 * thundering herd, so deterministic backoff keeps the logic testable.
 */
export function backoffMs(attempt: number): number {
  return Math.min(30_000, 500 * 4 ** (attempt - 1));
}
