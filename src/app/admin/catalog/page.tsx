export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth/admin";
import { getCatalogProductsForAdmin } from "@/lib/catalog/store";
import {
  BRANDS,
  DOSAGE_FORMS,
  PRODUCT_FAMILIES,
  THERAPEUTIC_AREAS,
  type CatalogPricing,
} from "@/data/catalog";
import CatalogManager, {
  type CatalogProductVM,
} from "./CatalogManager";
import type { TierInput } from "./actions";

/** DB pricing value (number | null | undefined) -> editor tier input. */
function toTier(v: number | null | undefined): TierInput {
  if (v === undefined) return { state: "hidden", dollars: 0 };
  if (v === null) return { state: "na", dollars: 0 };
  return { state: "price", dollars: v };
}

export default async function AdminCatalogPage() {
  const ctx = await requireAdmin();
  const canEdit = ctx.role === "admin";

  const rows = await getCatalogProductsForAdmin();

  const products: CatalogProductVM[] = rows.map((r) => {
    const pricing = (r.pricing ?? {}) as CatalogPricing;
    return {
      id: r.id,
      name: r.name,
      strength: r.strength ?? "",
      form: r.form,
      unit: r.unit ?? "",
      retail: toTier(pricing.retail),
      provider: toTier(pricing.provider),
      volume: toTier(pricing.volume),
      productFamily: r.productFamily ?? [],
      brand: r.brand ?? "",
      therapeuticAreas: r.therapeuticAreas ?? [],
      details: r.details ?? "",
      badge: r.badge ?? "",
      active: r.active,
      sortOrder: r.sortOrder,
    };
  });

  return (
    <CatalogManager
      products={products}
      canEdit={canEdit}
      taxonomy={{
        forms: [...DOSAGE_FORMS],
        families: [...PRODUCT_FAMILIES],
        brands: [...BRANDS],
        areas: [...THERAPEUTIC_AREAS],
      }}
    />
  );
}
