import "server-only";
import { and, asc, desc, eq, isNull, lte, gte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { promotions, featuredProducts } from "@/lib/db/schema";
import type { Promotion, FeaturedProduct } from "@/lib/db/schema";

export type PricingTier = "standard" | "preferred" | "vip";

/** A promotion/news item shaped for the clinic-facing banner. */
export interface StorefrontPromotion {
  id: number;
  kind: "promo" | "news";
  layout: "card" | "hero" | "tile";
  title: string;
  body: string | null;
  imageUrl: string | null;
  bgColor: string | null;
  badge: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  productId: string | null;
}

/**
 * Active promotions/news visible to a clinic right now, ordered pinned-first
 * then by `sortOrder`. Filters on the active flag, the optional time window,
 * and audience tier (null audience = everyone).
 */
export async function getActivePromotions(
  tier: PricingTier,
): Promise<StorefrontPromotion[]> {
  const now = new Date();
  const rows = await db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.active, true),
        or(isNull(promotions.startsAt), lte(promotions.startsAt, now)),
        or(isNull(promotions.endsAt), gte(promotions.endsAt, now)),
        or(isNull(promotions.audienceTier), eq(promotions.audienceTier, tier)),
      ),
    )
    .orderBy(desc(promotions.pinned), asc(promotions.sortOrder), desc(promotions.createdAt));

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    layout: r.layout,
    title: r.title,
    body: r.body,
    imageUrl: r.imageUrl,
    bgColor: r.bgColor,
    badge: r.badge,
    ctaLabel: r.ctaLabel,
    ctaHref: r.ctaHref,
    productId: r.productId,
  }));
}

/**
 * Ordered list of featured catalog SKU ids (+ optional badge label). The
 * storefront resolves these against its priced product list.
 */
export async function getFeaturedProductIds(): Promise<
  { productId: string; label: string | null }[]
> {
  const rows = await db
    .select({
      productId: featuredProducts.productId,
      label: featuredProducts.label,
    })
    .from(featuredProducts)
    .where(eq(featuredProducts.active, true))
    .orderBy(asc(featuredProducts.sortOrder), asc(featuredProducts.productId));
  return rows;
}

/* ─────────────── Admin reads (full lists, unfiltered) ─────────────── */

export async function listAllPromotions(): Promise<Promotion[]> {
  return db
    .select()
    .from(promotions)
    .orderBy(desc(promotions.pinned), asc(promotions.sortOrder), desc(promotions.createdAt));
}

export async function listAllFeatured(): Promise<FeaturedProduct[]> {
  return db
    .select()
    .from(featuredProducts)
    .orderBy(asc(featuredProducts.sortOrder), asc(featuredProducts.productId));
}
