"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerReps, referralLinks } from "@/lib/db/schema";
import { requirePartner } from "@/lib/auth/partner";
import { generateReferralCode } from "@/lib/partners/referral";
import { log } from "@/lib/observability/logger";

export interface LinkActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Creates a referral link. Org owners can create org-level links or links
 * scoped to one of their reps; reps can only create links scoped to
 * themselves (their sign-ups attribute to both them and their org).
 */
export async function createReferralLink(input: {
  label: string;
  repId: number | null;
}): Promise<LinkActionResult> {
  const ctx = await requirePartner({ minRole: "admin" });

  const label = input.label.trim().slice(0, 120);

  // Resolve the scope server-side — never trust the client's repId.
  let repId: number | null = null;
  if (ctx.kind === "rep") {
    repId = ctx.rep!.id;
  } else if (input.repId != null) {
    const [rep] = await db
      .select({ id: partnerReps.id })
      .from(partnerReps)
      .where(
        and(
          eq(partnerReps.id, input.repId),
          eq(partnerReps.orgId, ctx.org.id),
        ),
      )
      .limit(1);
    if (!rep) return { ok: false, error: "Rep not found." };
    repId = rep.id;
  }

  // Codes are random over a 32^10 space; a collision is vanishingly rare but
  // the unique index makes it loud, so retry a couple of times.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await db.insert(referralLinks).values({
        code: generateReferralCode(),
        orgId: ctx.org.id,
        repId,
        label: label || null,
      });
      revalidatePath("/partners/links");
      return { ok: true };
    } catch {
      if (attempt === 2) break;
    }
  }
  log.error("referral link insert failed after retries");
  return { ok: false, error: "Could not create the link. Please try again." };
}

/**
 * Activates/deactivates a referral link. Deactivated links stop setting the
 * attribution cookie immediately. Reps can only manage their own links; org
 * owners can manage any link in the org.
 */
export async function setReferralLinkActive(
  linkId: number,
  active: boolean,
): Promise<LinkActionResult> {
  const ctx = await requirePartner({ minRole: "admin" });

  const scope =
    ctx.kind === "rep"
      ? and(
          eq(referralLinks.id, linkId),
          eq(referralLinks.orgId, ctx.org.id),
          eq(referralLinks.repId, ctx.rep!.id),
        )
      : and(eq(referralLinks.id, linkId), eq(referralLinks.orgId, ctx.org.id));

  const updated = await db
    .update(referralLinks)
    .set({ active })
    .where(scope)
    .returning({ id: referralLinks.id });
  if (updated.length === 0) return { ok: false, error: "Link not found." };

  revalidatePath("/partners/links");
  return { ok: true };
}
