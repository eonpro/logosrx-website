export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth/admin";
import { listAllPromotions, listAllFeatured } from "@/lib/portal/merchandising";
import { getCatalogProducts } from "@/lib/catalog/store";
import type { CatalogProduct } from "@/data/catalog";

/** Therapeutic areas across the catalog — the storefront's filter categories. */
function catalogCategories(catalogProducts: CatalogProduct[]): string[] {
  const set = new Set<string>();
  for (const p of catalogProducts) {
    for (const a of p.therapeuticAreas ?? []) set.add(a);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
import MerchandisingManager, {
  type PromotionVM,
  type FeaturedVM,
} from "./MerchandisingManager";

function toDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function MerchandisingPage() {
  await requireAdmin();

  const [promos, featured, catalogProducts] = await Promise.all([
    listAllPromotions(),
    listAllFeatured(),
    getCatalogProducts(),
  ]);

  const promotions: PromotionVM[] = promos.map((p) => ({
    id: p.id,
    kind: p.kind,
    layout: p.layout,
    title: p.title,
    body: p.body ?? "",
    imageUrl: p.imageUrl ?? "",
    bgColor: p.bgColor ?? "",
    badge: p.badge ?? "",
    ctaLabel: p.ctaLabel ?? "",
    ctaHref: p.ctaHref ?? "",
    productId: p.productId ?? "",
    audienceTier: p.audienceTier ?? "",
    pinned: p.pinned,
    active: p.active,
    sortOrder: p.sortOrder,
    startsAt: toDateInput(p.startsAt),
    endsAt: toDateInput(p.endsAt),
  }));

  const featuredVM: FeaturedVM[] = featured.map((f) => ({
    id: f.id,
    productId: f.productId,
    label: f.label ?? "",
    sortOrder: f.sortOrder,
    active: f.active,
  }));

  const productOptions = catalogProducts.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  return (
    <MerchandisingManager
      promotions={promotions}
      featured={featuredVM}
      productOptions={productOptions}
      categoryOptions={catalogCategories(catalogProducts)}
    />
  );
}
