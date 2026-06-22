import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerWebhooks } from "@/lib/db/schema";
import {
  signatureHeader,
  type WebhookEvent,
} from "@/lib/partners/webhook-crypto";

/**
 * Best-effort webhook delivery. Finds the org's active subscriptions for an
 * event, POSTs a signed JSON payload to each, and records the last delivery
 * status. Never throws — callers fire this via `runAfterResponse`.
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

    const body = JSON.stringify({
      event,
      createdAt: new Date().toISOString(),
      data,
    });

    await Promise.all(
      targets.map(async (h) => {
        const ts = Math.floor(Date.now() / 1000);
        let status = 0;
        try {
          const res = await fetch(h.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Logos-Event": event,
              "X-Logos-Signature": signatureHeader(h.secret, body, ts),
            },
            body,
            signal: AbortSignal.timeout(5000),
          });
          status = res.status;
        } catch {
          status = 0; // network error / timeout
        }
        await db
          .update(partnerWebhooks)
          .set({ lastDeliveryAt: new Date(), lastStatus: status })
          .where(eq(partnerWebhooks.id, h.id))
          .catch(() => {});
      }),
    );
  } catch {
    console.error("[webhooks] dispatch failed");
  }
}
