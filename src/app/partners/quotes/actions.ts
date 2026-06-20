"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pricingQuotes } from "@/lib/db/schema";
import { requirePartner, type PartnerContext } from "@/lib/auth/partner";
import { getOrgFloorMap } from "@/lib/partners/pricing";
import { validateSellAboveFloor } from "@/lib/partners/commission";
import {
  createQuoteRecord,
  type CreateQuoteRecordResult,
  type QuoteItemSpec,
} from "@/lib/quotes/create";
import { getPartnerQuoteWithItems } from "@/lib/quotes/data";
import { generateQuotePassword, hashQuotePassword } from "@/lib/quotes/crypto";

export interface PartnerQuoteItemInput {
  productId: string;
  priceDollars: number;
}

export interface CreatePartnerQuoteInput {
  clinicName: string;
  contactName: string;
  email: string;
  intro: string;
  expiresInDays: number;
  items: PartnerQuoteItemInput[];
}

export type CreatePartnerQuoteResult = CreateQuoteRecordResult;

function assertId(id: number) {
  if (!Number.isFinite(id) || id <= 0) throw new Error("invalid id");
}

function scopeFor(ctx: PartnerContext) {
  return {
    orgId: ctx.org.id,
    repId: ctx.kind === "rep" ? ctx.rep!.id : null,
  };
}

/**
 * Creates a custom pricing quote on behalf of a sales org. Margin-model only;
 * every line must be a catalog SKU with a wholesale floor, priced at/above it.
 * The quote is attributed to the org (and rep, for rep sessions) so a clinic
 * that accepts is credited to them.
 */
export async function createPartnerQuote(
  input: CreatePartnerQuoteInput,
): Promise<CreatePartnerQuoteResult> {
  const ctx = await requirePartner();
  if (ctx.org.compensationModel !== "margin") {
    return {
      ok: false,
      error:
        "Custom pricing quotes are available on the wholesale/margin model. Use your referral links to onboard clinics.",
    };
  }

  const floorMap = await getOrgFloorMap(ctx.org.id);
  if (floorMap.size === 0) {
    return {
      ok: false,
      error: "No wholesale floor prices are set for your organization yet — contact Logos RX.",
    };
  }

  const items: QuoteItemSpec[] = [];
  for (const raw of Array.isArray(input.items) ? input.items : []) {
    const productId = raw.productId?.trim();
    if (!productId) continue;
    const floor = floorMap.get(productId);
    if (!floor) {
      return { ok: false, error: "One or more products aren't in your price list." };
    }
    const priceCents = Math.round((Number(raw.priceDollars) || 0) * 100);
    const floorErr = validateSellAboveFloor(priceCents, floor.floorCents);
    if (floorErr) return { ok: false, error: `${floor.productName}: ${floorErr}` };
    items.push({
      productId,
      productName: floor.productName,
      priceCents,
      unit: floor.unit,
    });
  }

  if (items.length === 0) {
    return { ok: false, error: "Add at least one product to the quote." };
  }

  const result = await createQuoteRecord({
    clinicName: input.clinicName,
    contactName: input.contactName,
    email: input.email,
    intro: input.intro,
    tier: "standard",
    discountPct: 0,
    expiresInDays: input.expiresInDays,
    items,
    createdBy: ctx.userId,
    createdByEmail: ctx.kind === "rep" ? ctx.rep!.email : ctx.org.contactEmail,
    partnerOrgId: ctx.org.id,
    partnerRepId: ctx.kind === "rep" ? ctx.rep!.id : null,
  });

  if (result.ok) revalidatePath("/partners/quotes");
  return result;
}

/** Confirms a quote belongs to the caller's scope before a mutation. */
async function assertOwned(id: number, ctx: PartnerContext): Promise<boolean> {
  const data = await getPartnerQuoteWithItems(id, scopeFor(ctx));
  return Boolean(data);
}

export interface RegenerateResult {
  ok: boolean;
  error?: string;
  password?: string;
}

export async function regeneratePartnerQuotePassword(
  id: number,
): Promise<RegenerateResult> {
  const ctx = await requirePartner();
  assertId(id);
  const data = await getPartnerQuoteWithItems(id, scopeFor(ctx));
  if (!data) return { ok: false, error: "Quote not found." };
  if (data.quote.status === "claimed") {
    return { ok: false, error: "This quote has already been used." };
  }

  const password = generateQuotePassword();
  await db
    .update(pricingQuotes)
    .set({ passwordHash: hashQuotePassword(password), updatedAt: new Date() })
    .where(eq(pricingQuotes.id, id));

  revalidatePath(`/partners/quotes/${id}`);
  return { ok: true, password };
}

export async function revokePartnerQuote(id: number) {
  const ctx = await requirePartner();
  assertId(id);
  if (!(await assertOwned(id, ctx))) return;
  await db
    .update(pricingQuotes)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(pricingQuotes.id, id));
  revalidatePath("/partners/quotes");
  revalidatePath(`/partners/quotes/${id}`);
}

export async function reactivatePartnerQuote(id: number) {
  const ctx = await requirePartner();
  assertId(id);
  const data = await getPartnerQuoteWithItems(id, scopeFor(ctx));
  if (!data || data.quote.status === "claimed") return;
  await db
    .update(pricingQuotes)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(pricingQuotes.id, id));
  revalidatePath("/partners/quotes");
  revalidatePath(`/partners/quotes/${id}`);
}

export async function deletePartnerQuote(id: number) {
  const ctx = await requirePartner();
  assertId(id);
  if (!(await assertOwned(id, ctx))) return;
  await db.delete(pricingQuotes).where(eq(pricingQuotes.id, id));
  revalidatePath("/partners/quotes");
}
