export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerApiKeys, partnerWebhooks } from "@/lib/db/schema";
import { getPartnerContext } from "@/lib/auth/partner";
import { roleAtLeast } from "@/lib/auth/partner-roles";
import { listWebhookDeliveries } from "@/lib/partners/webhooks";
import { SITE_URL } from "@/lib/constants";
import PartnerNoAccess from "../PartnerNoAccess";
import ApiKeysManager from "./ApiKeysManager";
import WebhooksManager from "./WebhooksManager";

export default async function PartnerApiPage() {
  const ctx = await getPartnerContext();
  if (!ctx || ctx.kind !== "org" || !roleAtLeast(ctx.role, "admin")) {
    return <PartnerNoAccess />;
  }

  const [keys, webhooks, deliveries] = await Promise.all([
    db
      .select({
        id: partnerApiKeys.id,
        name: partnerApiKeys.name,
        keyPrefix: partnerApiKeys.keyPrefix,
        lastUsedAt: partnerApiKeys.lastUsedAt,
        revokedAt: partnerApiKeys.revokedAt,
        createdAt: partnerApiKeys.createdAt,
      })
      .from(partnerApiKeys)
      .where(eq(partnerApiKeys.orgId, ctx.org.id))
      .orderBy(desc(partnerApiKeys.createdAt)),
    db
      .select({
        id: partnerWebhooks.id,
        url: partnerWebhooks.url,
        events: partnerWebhooks.events,
        active: partnerWebhooks.active,
        secret: partnerWebhooks.secret,
        lastDeliveryAt: partnerWebhooks.lastDeliveryAt,
        lastStatus: partnerWebhooks.lastStatus,
      })
      .from(partnerWebhooks)
      .where(eq(partnerWebhooks.orgId, ctx.org.id))
      .orderBy(desc(partnerWebhooks.createdAt)),
    listWebhookDeliveries(ctx.org.id, { limit: 200 }),
  ]);

  // Group the last few deliveries under each webhook for the history view.
  const PER_HOOK = 8;
  const deliveriesByWebhook = new Map<
    number,
    {
      id: number;
      event: string;
      delivered: boolean;
      attempts: number;
      lastStatus: number | null;
      lastError: string | null;
      at: string;
    }[]
  >();
  for (const d of deliveries) {
    const list = deliveriesByWebhook.get(d.webhookId) ?? [];
    if (list.length < PER_HOOK) {
      list.push({
        id: d.id,
        event: d.event,
        delivered: d.delivered,
        attempts: d.attempts,
        lastStatus: d.lastStatus,
        lastError: d.lastError,
        at: d.updatedAt.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      });
      deliveriesByWebhook.set(d.webhookId, list);
    }
  }
  const failedByWebhook = new Map<number, number>();
  for (const d of deliveries) {
    if (!d.delivered) {
      failedByWebhook.set(d.webhookId, (failedByWebhook.get(d.webhookId) ?? 0) + 1);
    }
  }

  const apiBase = `${SITE_URL}/api/partner/v1`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">API &amp; Webhooks</h1>
        <p className="text-navy/70 text-sm mt-1">
          Pull your partner data programmatically and receive real-time event
          notifications.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-beige bg-white p-6">
        <h2 className="text-sm font-semibold text-navy">Read-only API</h2>
        <p className="mt-1 text-xs text-navy/60">
          Authenticate with{" "}
          <code className="rounded bg-cream px-1 py-0.5">
            Authorization: Bearer &lt;key&gt;
          </code>
          . Base URL:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-navy px-4 py-3 text-xs text-white">
{`${apiBase}/summary?range=month
${apiBase}/clinics
${apiBase}/transactions?range=year
${apiBase}/reps`}
        </pre>
      </div>

      <ApiKeysManager
        keys={keys.map((k) => ({
          id: k.id,
          name: k.name,
          keyPrefix: k.keyPrefix,
          lastUsed: k.lastUsedAt
            ? k.lastUsedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : null,
          revoked: k.revokedAt != null,
        }))}
      />

      <div className="mt-8">
        <WebhooksManager
          webhooks={webhooks.map((w) => ({
            id: w.id,
            url: w.url,
            events: w.events,
            active: w.active,
            secret: w.secret,
            lastStatus: w.lastStatus,
            lastDelivery: w.lastDeliveryAt
              ? w.lastDeliveryAt.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : null,
            failedCount: failedByWebhook.get(w.id) ?? 0,
            deliveries: deliveriesByWebhook.get(w.id) ?? [],
          }))}
        />
      </div>
    </div>
  );
}
