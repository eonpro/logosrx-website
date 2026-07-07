export const dynamic = "force-dynamic";

import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
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
import { Badge, PageHeader, cardClass } from "@/components/ui/portal";

function toDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function MerchandisingPage() {
  const ctx = await requireAdmin();

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

  // Viewers get a read-only summary — every control in the manager mutates,
  // and letting a viewer click through to a failed server action (or the
  // error boundary) reads as a broken page.
  if (ctx.role !== ADMIN_ROLE) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Admin"
          title="Merchandising"
          description="Your admin account is read-only — editing promotions and featured products requires full admin access."
        />
        <div className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-beige bg-cream/50 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Promotions
          </div>
          {promotions.length === 0 ? (
            <p className="px-5 py-6 text-sm text-navy/55">No promotions.</p>
          ) : (
            <ul className="divide-y divide-beige/60">
              {promotions.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-medium text-navy">{p.title}</span>
                  <Badge tone={p.active ? "success" : "neutral"}>
                    {p.active ? "Active" : "Inactive"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`${cardClass} mt-6 overflow-hidden`}>
          <div className="border-b border-beige bg-cream/50 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Featured products
          </div>
          {featuredVM.length === 0 ? (
            <p className="px-5 py-6 text-sm text-navy/55">No featured products.</p>
          ) : (
            <ul className="divide-y divide-beige/60">
              {featuredVM.map((f) => (
                <li key={f.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-medium text-navy">{f.productId}</span>
                  <Badge tone={f.active ? "success" : "neutral"}>
                    {f.active ? "Active" : "Inactive"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <MerchandisingManager
      promotions={promotions}
      featured={featuredVM}
      productOptions={productOptions}
      categoryOptions={catalogCategories(catalogProducts)}
    />
  );
}
