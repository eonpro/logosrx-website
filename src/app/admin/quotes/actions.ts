"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pricingQuotes } from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
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
    revalidatePath("/admin/quotes");
    revalidatePath("/admin");
  }
  return result;
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
  await requireAdmin({ minRole: ADMIN_ROLE });
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

  revalidatePath(`/admin/quotes/${id}`);
  return { ok: true, password };
}

/** Disables a quote link so it can no longer be opened or accepted. */
export async function revokeQuote(id: number) {
  await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);
  await db
    .update(pricingQuotes)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(pricingQuotes.id, id));
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);
  revalidatePath("/admin");
}

/** Re-activates a previously revoked quote (not allowed once claimed). */
export async function reactivateQuote(id: number) {
  await requireAdmin({ minRole: ADMIN_ROLE });
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
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);
}

/** Permanently deletes a quote and its line items. */
export async function deleteQuote(id: number) {
  await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);
  await db.delete(pricingQuotes).where(eq(pricingQuotes.id, id));
  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
}
