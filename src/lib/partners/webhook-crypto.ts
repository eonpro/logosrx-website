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
