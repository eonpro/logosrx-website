import "server-only";
import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics, clinicPricing, pricingQuotes, pricingQuoteItems } from "@/lib/db/schema";
import { QUOTE_CLAIM_COOKIE, verifyQuoteClaim } from "@/lib/quotes/crypto";

/**
 * Applies an accepted pricing quote to a freshly-created clinic account.
 *
 * Called from the onboarding completion flow. Reads the signed `quote_claim`
 * cookie set when the recipient accepted the quote, then copies the quote's
 * tier, flat discount, and per-line prices onto the clinic — so once an admin
 * verifies the clinic, it sees exactly the prices it was quoted. The quote is
 * marked `claimed` and the cookie cleared.
 *
 * Best-effort by design: any failure is swallowed so it can never block account
 * creation. Returns true only when a quote was actually applied.
 */
export async function applyClaimedQuote(clerkUserId: string): Promise<boolean> {
  try {
    const store = await cookies();
    const claim = verifyQuoteClaim(store.get(QUOTE_CLAIM_COOKIE)?.value);
    if (!claim) return false;

    const [quote] = await db
      .select()
      .from(pricingQuotes)
      .where(eq(pricingQuotes.id, claim.quoteId))
      .limit(1);

    // Only apply a still-valid, matching quote that hasn't already been claimed.
    if (
      !quote ||
      quote.token !== claim.token ||
      quote.status === "revoked" ||
      quote.status === "claimed"
    ) {
      store.delete(QUOTE_CLAIM_COOKIE);
      return false;
    }

    const [clinic] = await db
      .select({ id: clinics.id })
      .from(clinics)
      .where(eq(clinics.clerkUserId, clerkUserId))
      .limit(1);
    if (!clinic) return false;

    const items = await db
      .select()
      .from(pricingQuoteItems)
      .where(eq(pricingQuoteItems.quoteId, quote.id));

    // Set the clinic's tier + flat discount from the quote.
    await db
      .update(clinics)
      .set({
        pricingTier: quote.tier,
        pricingDiscountPct: quote.discountPct,
        pricingNotes: `Applied from pricing quote ${quote.token}.`,
        updatedAt: new Date(),
      })
      .where(eq(clinics.id, clinic.id));

    // If a partner (sales org) created this quote, attribute the clinic to that
    // org/rep so they earn on its sales — first-touch only (never overwrite an
    // existing attribution, e.g. from a referral link).
    if (quote.partnerOrgId) {
      await db
        .update(clinics)
        .set({
          partnerOrgId: quote.partnerOrgId,
          partnerRepId: quote.partnerRepId,
        })
        .where(and(eq(clinics.id, clinic.id), isNull(clinics.partnerOrgId)));
    }

    // Copy each line item into clinic_pricing. Catalog SKUs upsert on
    // (clinic, product); ad-hoc items (no productId) are plain inserts.
    for (const item of items) {
      const pid = item.productId?.trim() || null;
      if (pid) {
        await db
          .insert(clinicPricing)
          .values({
            clinicId: clinic.id,
            productId: pid,
            productName: item.productName,
            priceCents: item.priceCents,
            unit: item.unit,
          })
          .onConflictDoUpdate({
            target: [clinicPricing.clinicId, clinicPricing.productId],
            set: {
              priceCents: item.priceCents,
              productName: item.productName,
              unit: item.unit,
              updatedAt: new Date(),
            },
          });
      } else {
        await db.insert(clinicPricing).values({
          clinicId: clinic.id,
          productName: item.productName,
          priceCents: item.priceCents,
          unit: item.unit,
        });
      }
    }

    await db
      .update(pricingQuotes)
      .set({
        status: "claimed",
        claimedClerkUserId: clerkUserId,
        claimedClinicId: clinic.id,
        claimedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pricingQuotes.id, quote.id));

    store.delete(QUOTE_CLAIM_COOKIE);
    return true;
  } catch {
    console.error("[quotes] applyClaimedQuote failed");
    return false;
  }
}
