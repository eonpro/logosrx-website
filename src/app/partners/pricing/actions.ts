"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicPricing, clinics } from "@/lib/db/schema";
import { requirePartner } from "@/lib/auth/partner";
import { recordPartnerAudit } from "@/lib/audit/log";
import { validateSellAboveFloor } from "@/lib/partners/commission";
import { getOrgFloorMap } from "@/lib/partners/pricing";

export interface PricingActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Confirms the clinic is attributed to the caller's scope (the whole org for an
 * owner; just the rep's own clinics for a rep). Returns the clinic id or null.
 */
async function assertClinicInScope(
  clinicId: number,
  ctx: Awaited<ReturnType<typeof requirePartner>>,
): Promise<boolean> {
  const scope =
    ctx.kind === "rep"
      ? and(
          eq(clinics.id, clinicId),
          eq(clinics.partnerRepId, ctx.rep!.id),
        )
      : and(eq(clinics.id, clinicId), eq(clinics.partnerOrgId, ctx.org.id));
  const [row] = await db
    .select({ id: clinics.id })
    .from(clinics)
    .where(scope)
    .limit(1);
  return Boolean(row);
}

/**
 * Sets a clinic's selling price for a catalog SKU, validated to be at or above
 * the org's wholesale floor. Writes to `clinic_pricing` (which the clinic
 * storefront already honors), so the spread becomes the partner's margin.
 */
export async function setClinicProductPrice(input: {
  clinicId: number;
  productId: string;
  productName: string;
  priceDollars: number;
  unit: string;
}): Promise<PricingActionResult> {
  const ctx = await requirePartner({ minRole: "admin" });
  if (ctx.org.compensationModel !== "margin") {
    return {
      ok: false,
      error: "Pricing control is only available on the wholesale/margin model.",
    };
  }
  if (!(await assertClinicInScope(input.clinicId, ctx))) {
    return { ok: false, error: "Clinic not found in your network." };
  }

  const productId = input.productId.trim();
  if (!productId) return { ok: false, error: "Product is required." };
  if (!Number.isFinite(input.priceDollars) || input.priceDollars < 0) {
    return { ok: false, error: "Enter a valid price." };
  }
  const priceCents = Math.round(input.priceDollars * 100);

  const floor = (await getOrgFloorMap(ctx.org.id)).get(productId);
  if (!floor) {
    return {
      ok: false,
      error: "No wholesale floor is set for this product yet — contact Logos RX.",
    };
  }
  const floorErr = validateSellAboveFloor(priceCents, floor.floorCents);
  if (floorErr) return { ok: false, error: floorErr };

  await db
    .insert(clinicPricing)
    .values({
      clinicId: input.clinicId,
      productId,
      productName: input.productName.trim() || floor.productName,
      priceCents,
      unit: input.unit.trim() || floor.unit,
    })
    .onConflictDoUpdate({
      target: [clinicPricing.clinicId, clinicPricing.productId],
      set: {
        priceCents,
        productName: input.productName.trim() || floor.productName,
        unit: input.unit.trim() || floor.unit,
        updatedAt: new Date(),
      },
    });

  await recordPartnerAudit(ctx, "partner.clinic_price_set", {
    type: "clinic",
    id: input.clinicId,
  }, { productId, priceCents, floorCents: floor.floorCents });

  revalidatePath("/partners/pricing");
  return { ok: true };
}

/** Clears a clinic's override for a SKU (reverts to standard catalog pricing). */
export async function resetClinicProductPrice(
  clinicId: number,
  productId: string,
): Promise<PricingActionResult> {
  const ctx = await requirePartner({ minRole: "admin" });
  if (!(await assertClinicInScope(clinicId, ctx))) {
    return { ok: false, error: "Clinic not found in your network." };
  }
  const pid = productId.trim();
  if (!pid) return { ok: false, error: "Product is required." };

  await db
    .delete(clinicPricing)
    .where(
      and(eq(clinicPricing.clinicId, clinicId), eq(clinicPricing.productId, pid)),
    );

  await recordPartnerAudit(ctx, "partner.clinic_price_reset", {
    type: "clinic",
    id: clinicId,
  }, { productId: pid });

  revalidatePath("/partners/pricing");
  return { ok: true };
}
