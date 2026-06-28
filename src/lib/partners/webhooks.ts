import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerWebhooks, partnerWebhookDeliveries } from "@/lib/db/schema";
import { type WebhookEvent } from "@/lib/partners/webhook-crypto";
import {
  deliverSignedWebhook,
  type DeliveryResult,
} from "@/lib/partners/webhook-delivery";
import { log } from "@/lib/observability/logger";

type Hook = typeof partnerWebhooks.$inferSelect;

/**
 * Best-effort webhook delivery. Finds the org's active subscriptions for an
 * event and delivers a signed JSON payload to each with retries + an
 * idempotency key, recording every attempt's outcome. Never throws — callers
 * fire this via `runAfterResponse`.
 */
export async function dispatchPartnerEvent(
  orgId: number,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const hooks = await db
      .select()
      .from(partnerWebhooks)
      .where(
        and(eq(partnerWebhooks.orgId, orgId), eq(partnerWebhooks.active, true)),
      );
    const targets = hooks.filter(
      (h) => h.events.includes(event) || h.events.includes("*"),
    );
    if (targets.length === 0) return;

    const payload = {
      event,
      createdAt: new Date().toISOString(),
      data,
    };

    await Promise.all(
      targets.map((h) => deliverAndRecord(h, orgId, event, payload)),
    );
  } catch (err) {
    log.error("partner webhook dispatch failed", { error: err });
  }
}

/**
 * Deliver one event to one subscription and persist the outcome. The delivery
 * row is written up-front (status pending) so a crash mid-retry still leaves a
 * dead-letter trace, then finalized once the attempts complete.
 */
async function deliverAndRecord(
  hook: Hook,
  orgId: number,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const deliveryId = randomUUID();
  const body = JSON.stringify(payload);

  // Best-effort: if the deliveries table isn't migrated yet, delivery still
  // proceeds — we just lose the persisted trace for this attempt.
  let deliveryRowId: number | null = null;
  try {
    const [row] = await db
      .insert(partnerWebhookDeliveries)
      .values({ webhookId: hook.id, orgId, event, deliveryId, payload })
      .returning({ id: partnerWebhookDeliveries.id });
    deliveryRowId = row?.id ?? null;
  } catch (err) {
    log.warn("partner webhook delivery log insert failed", {
      error: err,
      webhookId: hook.id,
    });
  }

  const result = await deliverSignedWebhook(
    { url: hook.url, secret: hook.secret },
    event,
    body,
    deliveryId,
  );

  await finalizeDelivery(hook.id, deliveryRowId, result);

  if (!result.delivered) {
    log.error("partner webhook delivery failed (dead-lettered)", {
      webhookId: hook.id,
      orgId,
      event,
      deliveryId,
      attempts: result.attempts,
      lastStatus: result.lastStatus,
      lastError: result.lastError,
    });
  }
}

/** Persist the final outcome onto both the subscription and the delivery row. */
async function finalizeDelivery(
  webhookId: number,
  deliveryRowId: number | null,
  result: DeliveryResult,
): Promise<void> {
  await db
    .update(partnerWebhooks)
    .set({ lastDeliveryAt: new Date(), lastStatus: result.lastStatus })
    .where(eq(partnerWebhooks.id, webhookId))
    .catch(() => {});

  if (deliveryRowId != null) {
    await db
      .update(partnerWebhookDeliveries)
      .set({
        attempts: result.attempts,
        delivered: result.delivered,
        lastStatus: result.lastStatus,
        lastError: result.lastError ?? null,
        updatedAt: new Date(),
      })
      .where(eq(partnerWebhookDeliveries.id, deliveryRowId))
      .catch(() => {});
  }
}

export interface WebhookDeliverySummary {
  id: number;
  webhookId: number;
  event: string;
  delivered: boolean;
  attempts: number;
  lastStatus: number | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Recent delivery log rows for an org's webhooks, newest first. Powers the
 * delivery history + dead-letter view in the partner dashboard.
 */
export async function listWebhookDeliveries(
  orgId: number,
  opts: { limit?: number } = {},
): Promise<WebhookDeliverySummary[]> {
  return db
    .select({
      id: partnerWebhookDeliveries.id,
      webhookId: partnerWebhookDeliveries.webhookId,
      event: partnerWebhookDeliveries.event,
      delivered: partnerWebhookDeliveries.delivered,
      attempts: partnerWebhookDeliveries.attempts,
      lastStatus: partnerWebhookDeliveries.lastStatus,
      lastError: partnerWebhookDeliveries.lastError,
      createdAt: partnerWebhookDeliveries.createdAt,
      updatedAt: partnerWebhookDeliveries.updatedAt,
    })
    .from(partnerWebhookDeliveries)
    .where(eq(partnerWebhookDeliveries.orgId, orgId))
    .orderBy(desc(partnerWebhookDeliveries.createdAt))
    .limit(opts.limit ?? 100);
}

/**
 * Replay a previously dead-lettered (or any) delivery by its log row id. Reuses
 * the original `deliveryId` so receivers dedupe, re-signs with a fresh
 * timestamp, and accumulates the attempt count. Returns `null` if the row or
 * its subscription no longer exists.
 */
export async function replayWebhookDelivery(
  deliveryRowId: number,
): Promise<DeliveryResult | null> {
  const [row] = await db
    .select()
    .from(partnerWebhookDeliveries)
    .where(eq(partnerWebhookDeliveries.id, deliveryRowId))
    .limit(1);
  if (!row) return null;

  const [hook] = await db
    .select()
    .from(partnerWebhooks)
    .where(eq(partnerWebhooks.id, row.webhookId))
    .limit(1);
  if (!hook) return null;

  const body = JSON.stringify(row.payload);
  const result = await deliverSignedWebhook(
    { url: hook.url, secret: hook.secret },
    row.event,
    body,
    row.deliveryId,
  );

  await db
    .update(partnerWebhookDeliveries)
    .set({
      attempts: row.attempts + result.attempts,
      delivered: result.delivered,
      lastStatus: result.lastStatus,
      lastError: result.lastError ?? null,
      updatedAt: new Date(),
    })
    .where(eq(partnerWebhookDeliveries.id, row.id))
    .catch(() => {});

  await db
    .update(partnerWebhooks)
    .set({ lastDeliveryAt: new Date(), lastStatus: result.lastStatus })
    .where(eq(partnerWebhooks.id, hook.id))
    .catch(() => {});

  if (!result.delivered) {
    log.error("partner webhook replay failed (still dead-lettered)", {
      webhookId: hook.id,
      deliveryRowId: row.id,
      deliveryId: row.deliveryId,
      attempts: result.attempts,
      lastStatus: result.lastStatus,
      lastError: result.lastError,
    });
  }

  return result;
}
