import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { catalogProducts } from "@/lib/db/schema";
import { isControlledSchedule } from "@/lib/lifefile/constants";
import { getClinicStorefrontFor } from "@/lib/portal/storefront";

/**
 * A catalog SKU as offered in the order wizard: clinic pricing merged with
 * the LifeFile mapping. `orderable` = active + mapped + not controlled.
 */
export interface OrderableProduct {
  id: string;
  name: string;
  strength: string | null;
  form: string;
  unit: string | null;
  priceCents: number | null;
  orderable: boolean;
  /** True when the SKU is blocked because it's a schedule 2-5 substance. */
  controlled: boolean;
  quantityUnits: string | null;
  defaultQuantity: string | null;
}

export async function getOrderableProducts(args: {
  clinicId: number;
  pricingTier: "standard" | "preferred" | "vip";
  discountPct: number;
}): Promise<OrderableProduct[]> {
  const [storefront, mappingRows] = await Promise.all([
    getClinicStorefrontFor(args),
    db
      .select({
        id: catalogProducts.id,
        lfProductId: catalogProducts.lfProductId,
        scheduleCode: catalogProducts.scheduleCode,
        quantityUnits: catalogProducts.quantityUnits,
        defaultQuantity: catalogProducts.defaultQuantity,
      })
      .from(catalogProducts)
      .where(eq(catalogProducts.active, true)),
  ]);

  const mapping = new Map(mappingRows.map((r) => [r.id, r]));

  return storefront.products.map((p) => {
    const m = mapping.get(p.id);
    const controlled = isControlledSchedule(m?.scheduleCode);
    return {
      id: p.id,
      name: p.name,
      strength: p.strength ?? null,
      form: p.form,
      unit: p.unit ?? null,
      priceCents: p.priceCents,
      orderable: m?.lfProductId != null && !controlled,
      controlled,
      quantityUnits: m?.quantityUnits ?? null,
      defaultQuantity: m?.defaultQuantity ?? null,
    };
  });
}

/** Set of catalog SKU ids that can be prescribed in-app right now. */
export async function getOrderableProductIds(): Promise<Set<string>> {
  const rows = await db
    .select({
      id: catalogProducts.id,
      lfProductId: catalogProducts.lfProductId,
      scheduleCode: catalogProducts.scheduleCode,
    })
    .from(catalogProducts)
    .where(eq(catalogProducts.active, true));
  return new Set(
    rows
      .filter(
        (r) => r.lfProductId != null && !isControlledSchedule(r.scheduleCode),
      )
      .map((r) => r.id),
  );
}
