"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerApiKeys, partnerWebhooks } from "@/lib/db/schema";
import { requirePartner } from "@/lib/auth/partner";
import { mintApiKey } from "@/lib/partners/api-auth";
import {
  generateWebhookSecret,
  isWebhookEvent,
  WEBHOOK_EVENTS,
} from "@/lib/partners/webhook-crypto";
import { recordPartnerAudit } from "@/lib/audit/log";

export interface ApiActionResult {
  ok: boolean;
  error?: string;
}

export interface CreateKeyResult extends ApiActionResult {
  /** Plaintext key — returned ONCE; never retrievable again. */
  key?: string;
}

/** Mints a new API key. Org owner/admin only. Returns the plaintext once. */
export async function createApiKey(name: string): Promise<CreateKeyResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });
  const label = name.trim().slice(0, 120) || "API key";

  const minted = mintApiKey();
  await db.insert(partnerApiKeys).values({
    orgId: ctx.org.id,
    name: label,
    keyPrefix: minted.keyPrefix,
    keyHash: minted.keyHash,
    createdBy: ctx.userId,
  });
  await recordPartnerAudit(ctx, "partner.api_key_create", {
    type: "partner_org",
    id: ctx.org.id,
  });

  revalidatePath("/partners/api");
  return { ok: true, key: minted.plaintext };
}

/** Revokes an API key (immediately stops authenticating). */
export async function revokeApiKey(keyId: number): Promise<ApiActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });
  const updated = await db
    .update(partnerApiKeys)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(partnerApiKeys.id, keyId), eq(partnerApiKeys.orgId, ctx.org.id)),
    )
    .returning({ id: partnerApiKeys.id });
  if (updated.length === 0) return { ok: false, error: "Key not found." };

  await recordPartnerAudit(ctx, "partner.api_key_revoke", {
    type: "partner_org",
    id: ctx.org.id,
  });
  revalidatePath("/partners/api");
  return { ok: true };
}

/** Creates a webhook subscription. Org owner/admin only. */
export async function createWebhook(input: {
  url: string;
  events: string[];
}): Promise<ApiActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });

  const url = input.url.trim();
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "Enter a valid URL." };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Webhook URLs must use HTTPS." };
  }
  const events = input.events.filter(isWebhookEvent);
  if (events.length === 0) {
    return { ok: false, error: "Select at least one event." };
  }

  await db.insert(partnerWebhooks).values({
    orgId: ctx.org.id,
    url,
    secret: generateWebhookSecret(),
    events,
    createdBy: ctx.userId,
  });
  await recordPartnerAudit(
    ctx,
    "partner.webhook_create",
    { type: "partner_org", id: ctx.org.id },
    { events },
  );

  revalidatePath("/partners/api");
  return { ok: true };
}

/** Activates/deactivates a webhook. */
export async function setWebhookActive(
  webhookId: number,
  active: boolean,
): Promise<ApiActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });
  const updated = await db
    .update(partnerWebhooks)
    .set({ active })
    .where(
      and(eq(partnerWebhooks.id, webhookId), eq(partnerWebhooks.orgId, ctx.org.id)),
    )
    .returning({ id: partnerWebhooks.id });
  if (updated.length === 0) return { ok: false, error: "Webhook not found." };
  revalidatePath("/partners/api");
  return { ok: true };
}

/** Deletes a webhook subscription. */
export async function deleteWebhook(webhookId: number): Promise<ApiActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });
  const deleted = await db
    .delete(partnerWebhooks)
    .where(
      and(eq(partnerWebhooks.id, webhookId), eq(partnerWebhooks.orgId, ctx.org.id)),
    )
    .returning({ id: partnerWebhooks.id });
  if (deleted.length === 0) return { ok: false, error: "Webhook not found." };

  await recordPartnerAudit(ctx, "partner.webhook_delete", {
    type: "partner_org",
    id: ctx.org.id,
  });
  revalidatePath("/partners/api");
  return { ok: true };
}

export const AVAILABLE_WEBHOOK_EVENTS = WEBHOOK_EVENTS;
