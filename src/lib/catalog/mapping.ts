/**
 * Pure mappers between the `catalog_products` DB row and the `CatalogProduct`
 * shape used everywhere in the app. NO server-only / db imports here so this is
 * trivially unit-testable and safe to import from the seed script.
 *
 * The `pricing` jsonb mirrors `CatalogPricing` exactly: a tier may be a number,
 * `null` ("Not Available"), or absent (`undefined`, hidden "—"). `cleanPricing`
 * is the single chokepoint that preserves that present/null/absent distinction.
 */

import type { catalogProducts } from "@/lib/db/schema";
import {
  CATALOG_TIERS,
  type CatalogProduct,
  type CatalogPricing,
} from "@/data/catalog";

export type CatalogProductRow = typeof catalogProducts.$inferSelect;
export type CatalogProductInsert = typeof catalogProducts.$inferInsert;

/**
 * Valid SKU id (slug): lowercase alphanumerics separated by single `-` or `.`,
 * e.g. `semaglutide-glycine-2.5mg-1ml`. No spaces, uppercase, or leading/
 * trailing separators.
 */
export const SKU_ID_RE = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export function isValidSkuId(id: string): boolean {
  return id.length > 0 && id.length <= 120 && SKU_ID_RE.test(id);
}

/**
 * Normalize a pricing object so only intentionally-set tiers survive: a tier
 * that is `undefined` is dropped (renders as "—"); `null` is kept ("Not
 * Available"); a number is coerced and kept. Anything non-finite that isn't
 * `null` is dropped.
 */
export function cleanPricing(
  pricing: CatalogPricing | null | undefined,
): CatalogPricing {
  const out: CatalogPricing = {};
  if (!pricing) return out;
  for (const tier of CATALOG_TIERS) {
    const v = pricing[tier];
    if (v === undefined) continue;
    if (v === null) {
      out[tier] = null;
      continue;
    }
    const n = Number(v);
    if (Number.isFinite(n)) out[tier] = n;
  }
  return out;
}

/** DB row -> `CatalogProduct`. Omits optional keys when empty, matching the
 * original static-array shape so existing pure helpers behave identically. */
export function rowToCatalogProduct(row: CatalogProductRow): CatalogProduct {
  const product: CatalogProduct = {
    id: row.id,
    name: row.name,
    form: row.form as CatalogProduct["form"],
    pricing: cleanPricing(row.pricing as CatalogPricing),
  };
  if (row.strength) product.strength = row.strength;
  if (row.unit) product.unit = row.unit;
  if (row.productFamily?.length) {
    product.productFamily =
      row.productFamily as CatalogProduct["productFamily"];
  }
  if (row.brand) product.brand = row.brand as CatalogProduct["brand"];
  if (row.therapeuticAreas?.length) {
    product.therapeuticAreas =
      row.therapeuticAreas as CatalogProduct["therapeuticAreas"];
  }
  if (row.details) product.details = row.details;
  if (row.badge) product.badge = row.badge;
  return product;
}

/** `CatalogProduct` -> insert values for the `catalog_products` table. */
export function catalogProductToInsert(
  p: CatalogProduct,
  sortOrder: number,
): CatalogProductInsert {
  return {
    id: p.id,
    name: p.name,
    strength: p.strength ?? null,
    form: p.form,
    unit: p.unit ?? null,
    pricing: cleanPricing(p.pricing),
    productFamily: [...(p.productFamily ?? [])],
    brand: p.brand ?? null,
    therapeuticAreas: [...(p.therapeuticAreas ?? [])],
    details: p.details ?? null,
    badge: p.badge ?? null,
    sortOrder,
  };
}
