import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pricingQuotes, pricingQuoteItems } from "@/lib/db/schema";
import { SITE_URL } from "@/lib/constants";
import {
  generateQuotePassword,
  generateQuoteToken,
  hashQuotePassword,
} from "@/lib/quotes/crypto";

export type PricingTier = "standard" | "preferred" | "vip";
const VALID_TIER = new Set<PricingTier>(["standard", "preferred", "vip"]);

const MAX_ITEMS = 100;

/** A fully-resolved line item (price already in integer cents). */
export interface QuoteItemSpec {
  productId: string | null;
  productName: string;
  priceCents: number;
  unit: string | null;
}

export interface CreateQuoteRecordInput {
  clinicName: string | null;
  contactName: string | null;
  email: string;
  intro: string | null;
  tier: PricingTier;
  discountPct: number;
  expiresInDays: number;
  items: QuoteItemSpec[];
  createdBy: string;
  createdByEmail: string | null;
  partnerOrgId?: number | null;
  partnerRepId?: number | null;
}

export interface CreateQuoteRecordResult {
  ok: boolean;
  error?: string;
  /** Returned ONCE on success — the plaintext password is never stored. */
  quote?: { id: number; token: string; password: string; url: string };
}

/** Picks a quote token that isn't already taken (collisions are astronomically rare). */
async function uniqueToken(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const token = generateQuoteToken();
    const [existing] = await db
      .select({ id: pricingQuotes.id })
      .from(pricingQuotes)
      .where(eq(pricingQuotes.token, token))
      .limit(1);
    if (!existing) return token;
  }
  throw new Error("could not allocate a unique token");
}

/**
 * Persists a pricing quote + line items. Auth, scoping, and (for partners) floor
 * enforcement are the caller's responsibility — this only validates shape and
 * writes the rows. Returns the public link and the generated password, which is
 * shown to the creator exactly once (only its hash is stored).
 */
export async function createQuoteRecord(
  input: CreateQuoteRecordInput,
): Promise<CreateQuoteRecordResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "A valid recipient email is required." };
  }
  if (!VALID_TIER.has(input.tier)) {
    return { ok: false, error: "Invalid pricing tier." };
  }
  const discountPct = Math.max(0, Math.min(100, Math.round(input.discountPct || 0)));

  const items = (Array.isArray(input.items) ? input.items : []).filter(
    (it) =>
      it.productName.trim() &&
      Number.isFinite(it.priceCents) &&
      it.priceCents >= 0,
  );
  if (items.length > MAX_ITEMS) {
    return { ok: false, error: `A quote can have at most ${MAX_ITEMS} items.` };
  }
  if (items.length === 0 && discountPct === 0) {
    return {
      ok: false,
      error: "Add at least one priced product or set a catalog-wide discount.",
    };
  }

  const password = generateQuotePassword();
  const passwordHash = hashQuotePassword(password);
  const expiresInDays = Math.max(0, Math.min(365, Math.round(input.expiresInDays || 0)));
  const expiresAt =
    expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

  let token: string;
  try {
    token = await uniqueToken();
  } catch {
    return { ok: false, error: "Could not create the quote. Please try again." };
  }

  let quoteId: number;
  try {
    quoteId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(pricingQuotes)
        .values({
          token,
          clinicName: input.clinicName?.trim() || null,
          contactName: input.contactName?.trim() || null,
          email,
          intro: input.intro?.trim() || null,
          passwordHash,
          tier: input.tier,
          discountPct,
          expiresAt,
          createdBy: input.createdBy,
          createdByEmail: input.createdByEmail,
          partnerOrgId: input.partnerOrgId ?? null,
          partnerRepId: input.partnerRepId ?? null,
        })
        .returning({ id: pricingQuotes.id });

      if (items.length > 0) {
        await tx.insert(pricingQuoteItems).values(
          items.map((it, idx) => ({
            quoteId: row.id,
            productId: it.productId,
            productName: it.productName.trim(),
            priceCents: Math.round(it.priceCents),
            unit: it.unit?.trim() || null,
            sortOrder: idx,
          })),
        );
      }
      return row.id;
    });
  } catch {
    console.error("[quotes] createQuoteRecord failed");
    return { ok: false, error: "Could not create the quote. Please try again." };
  }

  return {
    ok: true,
    quote: { id: quoteId, token, password, url: `${SITE_URL}/quote/${token}` },
  };
}
