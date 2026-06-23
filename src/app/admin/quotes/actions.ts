"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pricingQuotes } from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { recordAdminAudit } from "@/lib/audit/log";
import {
  createQuoteRecord,
  type CreateQuoteRecordResult,
  type PricingTier,
} from "@/lib/quotes/create";
import { generateQuotePassword, hashQuotePassword } from "@/lib/quotes/crypto";

export interface QuoteItemInput {
  productId: string | null;
  productName: string;
  priceDollars: number;
  unit: string | null;
}

export interface CreateQuoteInput {
  clinicName: string;
  contactName: string;
  email: string;
  intro: string;
  tier: PricingTier;
  discountPct: number;
  expiresInDays: number;
  items: QuoteItemInput[];
}

export type CreateQuoteResult = CreateQuoteRecordResult;

function assertId(id: number, label = "id") {
  if (!Number.isFinite(id) || id <= 0) throw new Error(`invalid ${label}`);
}

/**
 * Creates a password-gated pricing quote and its line items. Returns the public
 * link and the generated password — shown to the admin exactly once, since only
 * its hash is persisted. Admin quotes are unconstrained (full catalog, ad-hoc
 * items, catalog-wide discount) and carry no partner attribution.
 */
export async function createQuote(
  input: CreateQuoteInput,
): Promise<CreateQuoteResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });

  const result = await createQuoteRecord({
    clinicName: input.clinicName,
    contactName: input.contactName,
    email: input.email,
    intro: input.intro,
    tier: input.tier,
    discountPct: input.discountPct,
    expiresInDays: input.expiresInDays,
    items: (Array.isArray(input.items) ? input.items : []).map((it) => ({
      productId: it.productId?.trim() || null,
      productName: it.productName ?? "",
      priceCents: Math.round((Number(it.priceDollars) || 0) * 100),
      unit: it.unit ?? null,
    })),
    createdBy: ctx.userId,
    createdByEmail: ctx.email,
  });

  if (result.ok) {
    await recordAdminAudit(ctx, "quote.create", {
      type: "quote",
      id: result.quote?.id ?? null,
    }, { email: input.email, discountPct: input.discountPct });
    revalidatePath("/admin/quotes");
    revalidatePath("/admin");
  }
  return result;
}

export interface UpdateQuoteRecipientInput {
  clinicName: string;
  contactName: string;
  email: string;
}

export interface UpdateQuoteRecipientResult {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Updates the recipient details (clinic name, contact name, email) on a quote.
 * These prefill onboarding and label the quote; they aren't used for auth, so a
 * claimed quote can still be corrected. Email is normalized and validated.
 */
export async function updateQuoteRecipient(
  id: number,
  input: UpdateQuoteRecipientInput,
): Promise<UpdateQuoteRecipientResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);

  const email = (input.email ?? "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "A valid recipient email is required." };
  }
  const clinicName = (input.clinicName ?? "").trim().slice(0, 200) || null;
  const contactName = (input.contactName ?? "").trim().slice(0, 200) || null;

  const [existing] = await db
    .select({ id: pricingQuotes.id })
    .from(pricingQuotes)
    .where(eq(pricingQuotes.id, id))
    .limit(1);
  if (!existing) return { ok: false, error: "Quote not found." };

  await db
    .update(pricingQuotes)
    .set({ clinicName, contactName, email, updatedAt: new Date() })
    .where(eq(pricingQuotes.id, id));

  await recordAdminAudit(ctx, "quote.update_recipient", { type: "quote", id }, {
    email,
  });

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);
  return { ok: true };
}

export interface RegenerateResult {
  ok: boolean;
  error?: string;
  password?: string;
}

/** Issues a fresh password for a quote (invalidating the old one). Shown once. */
export async function regenerateQuotePassword(
  id: number,
): Promise<RegenerateResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);

  const [quote] = await db
    .select({ status: pricingQuotes.status })
    .from(pricingQuotes)
    .where(eq(pricingQuotes.id, id))
    .limit(1);
  if (!quote) return { ok: false, error: "Quote not found." };
  if (quote.status === "claimed") {
    return { ok: false, error: "This quote has already been used." };
  }

  const password = generateQuotePassword();
  await db
    .update(pricingQuotes)
    .set({ passwordHash: hashQuotePassword(password), updatedAt: new Date() })
    .where(eq(pricingQuotes.id, id));

  await recordAdminAudit(ctx, "quote.regenerate_password", {
    type: "quote",
    id,
  });

  revalidatePath(`/admin/quotes/${id}`);
  return { ok: true, password };
}

/** Disables a quote link so it can no longer be opened or accepted. */
export async function revokeQuote(id: number) {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);
  await db
    .update(pricingQuotes)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(pricingQuotes.id, id));
  await recordAdminAudit(ctx, "quote.revoke", { type: "quote", id });
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);
  revalidatePath("/admin");
}

/** Re-activates a previously revoked quote (not allowed once claimed). */
export async function reactivateQuote(id: number) {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);
  const [quote] = await db
    .select({ status: pricingQuotes.status })
    .from(pricingQuotes)
    .where(eq(pricingQuotes.id, id))
    .limit(1);
  if (!quote || quote.status === "claimed") return;
  await db
    .update(pricingQuotes)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(pricingQuotes.id, id));
  await recordAdminAudit(ctx, "quote.reactivate", { type: "quote", id });
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);
}

/** Permanently deletes a quote and its line items. */
export async function deleteQuote(id: number) {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);
  await db.delete(pricingQuotes).where(eq(pricingQuotes.id, id));
  await recordAdminAudit(ctx, "quote.delete", { type: "quote", id });
  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
}
