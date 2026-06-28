import "server-only";
import { cookies } from "next/headers";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics, referralLinks } from "@/lib/db/schema";
import {
  REF_COOKIE,
  attributionFromLink,
  isValidReferralCode,
  type ReferralAttribution,
} from "@/lib/partners/referral";
import { dispatchPartnerEvent } from "@/lib/partners/webhooks";
import { log } from "@/lib/observability/logger";
import { runAfterResponse } from "@/lib/runtime/after";

/**
 * Server-side referral attribution. The `/join/<code>` redirect drops the
 * code into a cookie; these helpers resolve it back to a live link and stamp
 * the resulting clinic/lead. All best-effort: attribution must never break a
 * signup.
 */

/** Resolves a raw referral code to attribution columns (null when invalid, unknown, or deactivated). */
export async function resolveReferralCode(
  code: string | undefined | null,
): Promise<ReferralAttribution | null> {
  if (!code || !isValidReferralCode(code)) return null;
  try {
    const [link] = await db
      .select({
        id: referralLinks.id,
        orgId: referralLinks.orgId,
        repId: referralLinks.repId,
        active: referralLinks.active,
      })
      .from(referralLinks)
      .where(eq(referralLinks.code, code.toLowerCase()))
      .limit(1);
    return attributionFromLink(link);
  } catch (err) {
    log.error("referral code lookup failed", { error: err });
    return null;
  }
}

/**
 * Stamps referral attribution onto a clinic profile after onboarding
 * completes. Reads the referral cookie, resolves the link, and fills the
 * attribution columns ONLY when they're still empty (first touch wins; a
 * later visit through another partner's link never re-attributes). Bumps the
 * link's signup counter exactly once — the conditional update tells us
 * whether this call did the stamping.
 */
export async function stampClinicAttribution(
  clerkUserId: string,
): Promise<void> {
  try {
    const store = await cookies();
    const code = store.get(REF_COOKIE)?.value;
    const attribution = await resolveReferralCode(code);
    if (!attribution) return;

    // Stamp the clinic and bump the link's signup counter in one transaction:
    // the conditional update is the source of truth for "did we attribute?", so
    // the counter must increment iff the stamp landed. Splitting them risks a
    // stamped clinic with an un-incremented counter (or vice versa) if the
    // second write fails.
    const stamped = await db.transaction(async (tx) => {
      const rows = await tx
        .update(clinics)
        .set({
          referralLinkId: attribution.referralLinkId,
          partnerOrgId: attribution.partnerOrgId,
          partnerRepId: attribution.partnerRepId,
        })
        .where(
          and(
            eq(clinics.clerkUserId, clerkUserId),
            isNull(clinics.partnerOrgId),
          ),
        )
        .returning({ id: clinics.id });

      if (rows.length === 0) return null;

      await tx
        .update(referralLinks)
        .set({ signupCount: sql`${referralLinks.signupCount} + 1` })
        .where(eq(referralLinks.id, attribution.referralLinkId));

      return rows[0];
    });

    if (stamped) {
      // Notify partner webhooks (best-effort, non-blocking). Fired only after
      // the attribution transaction commits.
      runAfterResponse(
        dispatchPartnerEvent(attribution.partnerOrgId, "clinic.attributed", {
          clinicId: stamped.id,
          referralLinkId: attribution.referralLinkId,
          repId: attribution.partnerRepId,
        }),
      );
    }
  } catch (err) {
    // Attribution is bonus data — never let it break account creation.
    log.error("clinic attribution stamp failed", { error: err });
  }
}
