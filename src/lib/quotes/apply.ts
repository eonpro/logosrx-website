import "server-only";
import { cookies } from "next/headers";
import { and, eq, isNull, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics, clinicPricing, pricingQuotes, pricingQuoteItems } from "@/lib/db/schema";
import { QUOTE_CLAIM_COOKIE, verifyQuoteClaim } from "@/lib/quotes/crypto";
import { log } from "@/lib/observability/logger";

export type ApplyQuoteResult =
  /** A quote was applied to the clinic. */
  | "applied"
  /** No claim cookie was present — nothing to do. */
  | "none"
  /**
   * The user held a claim but it could not be applied (already claimed by
   * another clinic, revoked, or a write failed). Callers should tell the user
   * their quoted pricing was NOT applied.
   */
  | "failed";

/**
 * Applies an accepted pricing quote to a freshly-created clinic account.
 *
 * Called from the onboarding completion flow. Reads the signed `quote_claim`
 * cookie set when the recipient accepted the quote, then copies the quote's
 * tier, flat discount, and per-line prices onto the clinic — so once an admin
 * verifies the clinic, it sees exactly the prices it was quoted. The quote is
 * marked `claimed` and the cookie cleared.
 *
 * The claim is atomic: the quote row is flipped to `claimed` with a
 * conditional UPDATE inside the same transaction as the pricing writes, so two
 * recipients racing to finish onboarding can never both apply the same quote,
 * and a failure mid-apply rolls everything back.
 *
 * Never throws (a failure must not block account creation), but the result
 * distinguishes "no quote" from "had a quote and couldn't apply it" so callers
 * can warn the user.
 */
export async function applyClaimedQuote(
  clerkUserId: string,
): Promise<ApplyQuoteResult> {
  try {
    const store = await cookies();
    const claim = verifyQuoteClaim(store.get(QUOTE_CLAIM_COOKIE)?.value);
    if (!claim) return "none";

    const [clinic] = await db
      .select({ id: clinics.id })
      .from(clinics)
      .where(eq(clinics.clerkUserId, clerkUserId))
      .limit(1);
    if (!clinic) return "failed";

    const applied = await db.transaction(async (txn) => {
      // Atomically claim the quote. The conditional UPDATE is the lock: if a
      // concurrent apply (or an admin revoke) got there first, zero rows match
      // and we bail without touching the clinic.
      const [quote] = await txn
        .update(pricingQuotes)
        .set({
          status: "claimed",
          claimedClerkUserId: clerkUserId,
          claimedClinicId: clinic.id,
          claimedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(pricingQuotes.id, claim.quoteId),
            eq(pricingQuotes.token, claim.token),
            notInArray(pricingQuotes.status, ["revoked", "claimed"]),
          ),
        )
        .returning();
      if (!quote) return false;

      const items = await txn
        .select()
        .from(pricingQuoteItems)
        .where(eq(pricingQuoteItems.quoteId, quote.id));

      // Set the clinic's tier + flat discount from the quote.
      await txn
        .update(clinics)
        .set({
          pricingTier: quote.tier,
          pricingDiscountPct: quote.discountPct,
          pricingNotes: `Applied from pricing quote ${quote.token}.`,
          updatedAt: new Date(),
        })
        .where(eq(clinics.id, clinic.id));

      // If a partner (sales org) created this quote, attribute the clinic to
      // that org/rep so they earn on its sales — first-touch only (never
      // overwrite an existing attribution, e.g. from a referral link).
      if (quote.partnerOrgId) {
        await txn
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
          await txn
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
          await txn.insert(clinicPricing).values({
            clinicId: clinic.id,
            productName: item.productName,
            priceCents: item.priceCents,
            unit: item.unit,
          });
        }
      }

      return true;
    });

    // The claim cookie is spent either way: on success the quote is applied;
    // on a lost race the quote belongs to someone else and retrying is futile.
    store.delete(QUOTE_CLAIM_COOKIE);
    return applied ? "applied" : "failed";
  } catch (err) {
    log.error("applyClaimedQuote failed", { error: err });
    return "failed";
  }
}
