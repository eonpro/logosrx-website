import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics, clinicPricing } from "@/lib/db/schema";
import {
  catalogProducts,
  standardCatalogPrice,
  resolveDetailSlug,
  type CatalogProduct,
} from "@/data/catalog";
import { products } from "@/data/products";
import { computeEffectivePriceCents } from "@/lib/portal/pricing";

/** A catalog SKU priced for a specific clinic, ready for the storefront grid. */
export interface StorefrontProduct {
  id: string;
  name: string;
  strength?: string;
  form: string;
  unit?: string;
  badge?: string;
  details?: string;
  productFamily: string[];
  therapeuticAreas: string[];
  /** Detail-page slug when the SKU maps to a marketing product page. */
  detailSlug?: string;
  /** The clinic's effective price in cents (override or discounted standard). */
  priceCents: number | null;
  /** The standard (pre-discount) catalog price in cents, for strikethrough. */
  standardCents: number | null;
  /** True when an admin set a hard per-clinic override for this SKU. */
  isOverride: boolean;
}

export interface ClinicStorefront {
  pricingTier: "standard" | "preferred" | "vip";
  discountPct: number;
  products: StorefrontProduct[];
}

function standardCents(p: CatalogProduct): number | null {
  const dollars = standardCatalogPrice(p);
  return dollars === null ? null : Math.round(dollars * 100);
}

/**
 * Build the priced storefront for a clinic. Merges the static catalog with the
 * clinic's flat discount tier and any per-SKU overrides set by an admin. The
 * caller is responsible for verifying the clinic is approved before showing
 * prices.
 */
export async function getClinicStorefront(
  clerkUserId: string,
): Promise<ClinicStorefront> {
  const [clinic] = await db
    .select({
      id: clinics.id,
      pricingTier: clinics.pricingTier,
      pricingDiscountPct: clinics.pricingDiscountPct,
    })
    .from(clinics)
    .where(eq(clinics.clerkUserId, clerkUserId))
    .limit(1);

  return getClinicStorefrontFor({
    clinicId: clinic?.id ?? null,
    pricingTier: clinic?.pricingTier ?? "standard",
    discountPct: clinic?.pricingDiscountPct ?? 0,
  });
}

/**
 * Same as `getClinicStorefront` but for callers that already loaded the clinic's
 * id + pricing inputs (e.g. via `getClinicGate`). Skips the redundant `clinics`
 * lookup and issues only the per-SKU overrides query.
 */
export async function getClinicStorefrontFor(args: {
  clinicId: number | null;
  pricingTier: "standard" | "preferred" | "vip";
  discountPct: number;
}): Promise<ClinicStorefront> {
  const { clinicId, pricingTier, discountPct } = args;
  const detailSlugs = products.map((p) => p.slug);

  // Sparse per-SKU overrides keyed by catalog product id.
  const overrides = new Map<string, number>();
  if (clinicId !== null) {
    const rows = await db
      .select({
        productId: clinicPricing.productId,
        priceCents: clinicPricing.priceCents,
      })
      .from(clinicPricing)
      .where(
        and(
          eq(clinicPricing.clinicId, clinicId),
          isNotNull(clinicPricing.productId),
        ),
      );
    for (const r of rows) {
      if (r.productId) overrides.set(r.productId, r.priceCents);
    }
  }

  const storefrontProducts: StorefrontProduct[] = catalogProducts.map((p) => {
    const std = standardCents(p);
    const overrideCents = overrides.has(p.id)
      ? (overrides.get(p.id) as number)
      : null;
    return {
      id: p.id,
      name: p.name,
      strength: p.strength,
      form: p.form,
      unit: p.unit,
      badge: p.badge,
      details: p.details,
      productFamily: [...(p.productFamily ?? [])],
      therapeuticAreas: [...(p.therapeuticAreas ?? [])],
      detailSlug: resolveDetailSlug(p.id, detailSlugs),
      priceCents: computeEffectivePriceCents(std, discountPct, overrideCents),
      standardCents: std,
      isOverride: overrideCents !== null,
    };
  });

  return { pricingTier, discountPct, products: storefrontProducts };
}
