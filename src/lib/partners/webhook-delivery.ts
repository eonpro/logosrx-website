import {
  WEBHOOK_MAX_ATTEMPTS,
  backoffMs,
  isRetryableStatus,
  signatureHeader,
} from "@/lib/partners/webhook-crypto";

/**
 * Network transport for outbound webhooks: signs each attempt, retries
 * transient failures with exponential backoff, and carries a stable
 * idempotency key. Deliberately DB-free (no `server-only`, no Drizzle) so the
 * retry/idempotency logic is unit-testable; `webhooks.ts` owns persistence.
 */

export interface WebhookTarget {
  url: string;
  secret: string;
}

export interface DeliveryResult {
  delivered: boolean;
  /** Attempts actually made (1-based count). */
  attempts: number;
  /** HTTP status of the last attempt; 0 means network error / timeout. */
  lastStatus: number;
  lastError?: string;
}

export interface DeliverOptions {
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
  /** Injectable for tests (no real delays). */
  sleep?: (ms: number) => Promise<void>;
  maxAttempts?: number;
  timeoutMs?: number;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Deliver a signed webhook with retries. The same `deliveryId` is sent on every
 * attempt (as `X-Logos-Delivery-Id`) so receivers can dedupe; only the
 * signature timestamp changes per attempt. Resolves with the final outcome and
 * never throws.
 */
export async function deliverSignedWebhook(
  target: WebhookTarget,
  event: string,
  body: string,
  deliveryId: string,
  opts: DeliverOptions = {},
): Promise<DeliveryResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const sleep = opts.sleep ?? defaultSleep;
  const maxAttempts = opts.maxAttempts ?? WEBHOOK_MAX_ATTEMPTS;
  const timeoutMs = opts.timeoutMs ?? 5_000;

  let attempts = 0;
  let lastStatus = 0;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attempts = attempt;
    const ts = Math.floor(Date.now() / 1000);
    try {
      const res = await fetchImpl(target.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Logos-Event": event,
          "X-Logos-Delivery-Id": deliveryId,
          "X-Logos-Signature": signatureHeader(target.secret, body, ts),
        },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      lastStatus = res.status;
      if (res.ok) {
        return { delivered: true, attempts, lastStatus };
      }
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastStatus = 0;
      lastError = err instanceof Error ? err.message : "network error";
    }

    // Stop early on permanent failures or when attempts are exhausted.
    if (attempt >= maxAttempts || !isRetryableStatus(lastStatus)) break;
    await sleep(backoffMs(attempt));
  }

  return { delivered: false, attempts, lastStatus, lastError };
}
