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
  } catch {
    console.error("[partners] referral code lookup failed");
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

    const stamped = await db
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

    if (stamped.length > 0) {
      await db
        .update(referralLinks)
        .set({ signupCount: sql`${referralLinks.signupCount} + 1` })
        .where(eq(referralLinks.id, attribution.referralLinkId));

      // Notify partner webhooks (best-effort, non-blocking).
      runAfterResponse(
        dispatchPartnerEvent(attribution.partnerOrgId, "clinic.attributed", {
          clinicId: stamped[0].id,
          referralLinkId: attribution.referralLinkId,
          repId: attribution.partnerRepId,
        }),
      );
    }
  } catch {
    // Attribution is bonus data — never let it break account creation.
    console.error("[partners] clinic attribution stamp failed");
  }
}
