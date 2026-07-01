import Link from "next/link";
import {
  baseCatalogPrice,
  CATALOG_CONFIG,
  formatPrice,
  resolveDetailSlug,
  type CatalogProduct,
} from "@/data/catalog";

interface CatalogProductCardsProps {
  items: CatalogProduct[];
  /**
   * Known product detail-page slugs. A card deep-links to `/products/<slug>`
   * when its SKU id resolves to one of these; otherwise it renders as a
   * static (non-tappable) card.
   */
  detailSlugs: readonly string[];
}

/**
 * Mobile (`<lg`) catalog list. Replaces the horizontal-scroll table with a
 * stack of tappable, app-style cards — each card is a full press target that
 * navigates to the product detail page and leads with the currently
 * highlighted price tier.
 *
 * Server component: pure presentation, ships zero client JS. Press feedback
 * is handled with CSS `:active` so it stays instant and native-feeling.
 */
export default function CatalogProductCards({
  items,
  detailSlugs,
}: CatalogProductCardsProps) {
  return (
    <ul role="list" className="flex flex-col gap-3 lg:hidden">
      {items.map((product) => (
        <li key={product.id}>
          <CatalogProductCard
            product={product}
            slug={resolveDetailSlug(product.id, detailSlugs)}
          />
        </li>
      ))}
    </ul>
  );
}

interface CatalogProductCardProps {
  product: CatalogProduct;
  slug: string | undefined;
}

function CatalogProductCard({ product, slug }: CatalogProductCardProps) {
  const meta = [product.strength, product.form, product.unit ?? "Each"].filter(
    Boolean,
  ) as string[];

  const basePrice = baseCatalogPrice(product);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold leading-snug text-navy">
              {product.name}
            </h3>
            {product.badge && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-magenta/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-magenta">
                {product.badge}
              </span>
            )}
          </div>
          {meta.length > 0 && (
            <p className="mt-1 text-xs font-medium text-navy/55">
              {meta.join("  ·  ")}
            </p>
          )}
        </div>

        {slug && (
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-navy/30"
          >
            <path
              d="M6.5 3.5L12 9l-5.5 5.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-magenta">
            {CATALOG_CONFIG.basePriceLabel}
          </p>
          <p
            className={`mt-0.5 text-2xl font-bold tabular-nums leading-none ${
              basePrice === null || basePrice === undefined
                ? "text-navy/40"
                : "text-navy"
            }`}
          >
            {basePrice === null ? "Not available" : formatPrice(basePrice)}
          </p>
        </div>
      </div>

      {product.details && (
        <p className="mt-3 border-t border-beige/70 pt-3 text-xs leading-relaxed text-navy/60">
          {product.details}
        </p>
      )}
    </>
  );

  const baseClass =
    "block rounded-2xl border border-beige bg-white p-4 text-left shadow-[0_1px_2px_rgba(38,34,98,0.04)]";

  if (slug) {
    return (
      <Link
        href={`/products/${slug}`}
        id={`sku-${product.id}`}
        aria-label={`${product.name} — view details`}
        className={`${baseClass} transition-transform duration-100 active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta`}
      >
        {body}
      </Link>
    );
  }

  return (
    <div id={`sku-${product.id}`} className={baseClass}>
      {body}
    </div>
  );
}
