import { NextResponse, type NextRequest } from "next/server";

import { getOrderableProducts } from "@/lib/orders/products";
import { authenticateRequest, jsonOk } from "../shared";

export const dynamic = "force-dynamic";

/**
 * GET /api/clinic/v1/products — the medication catalog as this clinic sees
 * it: clinic-specific pricing, plus which SKUs are orderable through the API
 * right now. `productId` is the value to send in `rxs[].productId`.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authed = await authenticateRequest(req);
  if (!authed.ok) return authed.response;
  const { auth, requestId } = authed;

  const products = await getOrderableProducts({
    clinicId: auth.clinic.id,
    pricingTier: auth.clinic.pricingTier,
    discountPct: auth.clinic.pricingDiscountPct,
  });

  return jsonOk(requestId, {
    products: products.map((p) => ({
      productId: p.id,
      name: p.name,
      strength: p.strength,
      form: p.form,
      unit: p.unit,
      priceCents: p.priceCents,
      orderable: p.orderable,
      // Controlled substances are listed (visible) but not orderable via API.
      controlled: p.controlled,
      defaultQuantity: p.defaultQuantity,
      quantityUnits: p.quantityUnits,
    })),
  });
}
