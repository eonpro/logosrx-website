"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { discountPercent, formatCents } from "@/lib/portal/pricing";
import type { StorefrontProduct } from "@/lib/portal/storefront";
import type { StorefrontPromotion } from "@/lib/portal/merchandising";

const TIER_LABELS: Record<string, string> = {
  standard: "Standard",
  preferred: "Preferred",
  vip: "VIP",
};

interface FeaturedRef {
  productId: string;
  label: string | null;
}

interface StorefrontProps {
  products: StorefrontProduct[];
  discountPct: number;
  pricingTier: "standard" | "preferred" | "vip";
  promotions: StorefrontPromotion[];
  featuredIds: FeaturedRef[];
  lifefileUrl: string;
}

export default function Storefront({
  products,
  discountPct,
  pricingTier,
  promotions,
  featuredIds,
  lifefileUrl,
}: StorefrontProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) for (const a of p.therapeuticAreas) set.add(a);
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const featured = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return featuredIds
      .map((f) => {
        const product = byId.get(f.productId);
        return product ? { product, label: f.label } : null;
      })
      .filter((x): x is { product: StorefrontProduct; label: string | null } =>
        Boolean(x),
      );
  }, [featuredIds, products]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "All" && !p.therapeuticAreas.includes(category)) {
        return false;
      }
      if (needle) {
        const hay = `${p.name} ${p.strength ?? ""} ${p.form}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [products, query, category]);

  const heroes = promotions.filter((p) => p.layout === "hero");
  const tiles = promotions.filter((p) => p.layout === "tile");
  const cards = promotions.filter((p) => p.layout === "card");

  function selectCategory(cat: string) {
    setCategory(categories.includes(cat) ? cat : "All");
    if (typeof document !== "undefined") {
      document
        .getElementById("all-products")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Hero spotlight banner(s) */}
      {heroes.length > 0 && (
        <div className="flex flex-col gap-4">
          {heroes.map((promo) => (
            <HeroBanner
              key={promo.id}
              promo={promo}
              onSelectCategory={selectCategory}
            />
          ))}
        </div>
      )}

      {/* Category tiles */}
      {tiles.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((promo) => (
            <CategoryTile
              key={promo.id}
              promo={promo}
              onSelectCategory={selectCategory}
            />
          ))}
        </div>
      )}

      {/* Page heading + pricing summary */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Storefront</h1>
          <p className="mt-1 text-sm text-navy/60">
            Your live catalog and pricing. Prescribe through LifeFile to order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-3 py-1.5 text-xs font-semibold text-navy">
            {TIER_LABELS[pricingTier] ?? "Standard"} pricing
          </span>
          {discountPct > 0 && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
              {discountPct}% off standard
            </span>
          )}
        </div>
      </div>

      {/* Promotions & special news */}
      {cards.length > 0 && (
        <section className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {cards.map((promo) => (
            <PromotionCard
              key={promo.id}
              promo={promo}
              onSelectCategory={selectCategory}
            />
          ))}
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-navy">Featured</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(({ product, label }) => (
              <ProductCard
                key={`featured-${product.id}`}
                p={product}
                lifefileUrl={lifefileUrl}
                featuredLabel={label}
                highlight
              />
            ))}
          </div>
        </section>
      )}

      {/* Toolbar: search + category filter */}
      <section id="all-products" className="mt-10 scroll-mt-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-navy">All products</h2>
          <div className="relative w-full sm:max-w-xs">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="w-full rounded-full border border-beige-dark bg-white px-4 py-2 text-sm text-navy placeholder:text-navy/40 focus:border-magenta focus:outline-none focus:ring-2 focus:ring-magenta/20"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === cat
                  ? "bg-magenta text-white"
                  : "bg-white text-navy/60 hover:bg-beige hover:text-navy"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-beige-dark bg-white py-16 text-center text-sm text-navy/50">
            No products match your search.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} lifefileUrl={lifefileUrl} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/**
 * Tiles/CTAs that point at `#category=<area>` filter the in-page grid instead
 * of navigating. Returns the decoded category, or null for a normal link.
 */
function categoryFromHref(href: string | null): string | null {
  if (!href) return null;
  const m = /^#category=(.+)$/.exec(href);
  return m ? decodeURIComponent(m[1]) : null;
}

function HeroBanner({
  promo,
  onSelectCategory,
}: {
  promo: StorefrontPromotion;
  onSelectCategory: (cat: string) => void;
}) {
  const bg = promo.bgColor || "#bcd4ea";
  const ctaCategory = categoryFromHref(promo.ctaHref);
  const lines = (promo.body ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div
      className="relative isolate overflow-hidden rounded-3xl px-7 py-9 sm:px-12 sm:py-12"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${bg} 55%, white), ${bg})`,
      }}
    >
      {/* Faint product list behind the title, as in the brand banner */}
      {lines.length > 0 && (
        <div className="pointer-events-none absolute inset-y-0 left-6 z-0 hidden flex-col justify-center gap-1 opacity-25 sm:flex">
          {lines.map((l, i) => (
            <span
              key={i}
              className="text-[11px] font-semibold uppercase tracking-widest text-white"
            >
              {l}
            </span>
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-lg [text-shadow:0_1px_12px_rgba(0,0,0,0.12)]">
        <h2 className="text-3xl font-bold leading-[1.05] text-white sm:text-5xl">
          {promo.title}
        </h2>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {promo.badge && (
            <span className="rounded-full border-2 border-navy/70 bg-white/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-navy backdrop-blur sm:text-sm">
              {promo.badge}
            </span>
          )}
          {promo.ctaHref &&
            promo.ctaLabel &&
            (ctaCategory ? (
              <button
                type="button"
                onClick={() => onSelectCategory(ctaCategory)}
                className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-deep"
              >
                {promo.ctaLabel}
              </button>
            ) : (
              <a
                href={promo.ctaHref}
                className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-deep"
              >
                {promo.ctaLabel}
              </a>
            ))}
        </div>
      </div>

      {promo.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={promo.imageUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 z-[5] h-full w-auto max-w-[46%] object-contain object-bottom"
        />
      )}
    </div>
  );
}

function CategoryTile({
  promo,
  onSelectCategory,
}: {
  promo: StorefrontPromotion;
  onSelectCategory: (cat: string) => void;
}) {
  const bg = promo.bgColor || "#26225f";
  const ctaCategory = categoryFromHref(promo.ctaHref);
  const inner = (
    <div
      className="relative flex h-28 items-center overflow-hidden rounded-2xl px-5 transition-transform duration-150 hover:scale-[1.01]"
      style={{
        background: `linear-gradient(135deg, ${bg}, color-mix(in srgb, ${bg} 55%, black))`,
      }}
    >
      <h3 className="relative z-10 max-w-[58%] text-lg font-bold leading-tight text-white">
        {promo.title}
      </h3>
      {promo.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={promo.imageUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-2 z-0 h-[115%] w-auto max-w-[48%] object-contain object-bottom"
        />
      )}
    </div>
  );

  if (ctaCategory) {
    return (
      <button
        type="button"
        onClick={() => onSelectCategory(ctaCategory)}
        aria-label={`Filter products by ${promo.title}`}
        className="block w-full text-left"
      >
        {inner}
      </button>
    );
  }
  if (promo.ctaHref) {
    return (
      <a href={promo.ctaHref} aria-label={promo.title} className="block">
        {inner}
      </a>
    );
  }
  return inner;
}

function PromotionCard({
  promo,
  onSelectCategory,
}: {
  promo: StorefrontPromotion;
  onSelectCategory: (cat: string) => void;
}) {
  const ctaCategory = categoryFromHref(promo.ctaHref);
  const isNews = promo.kind === "news";
  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border p-5 ${
        isNews
          ? "border-navy/10 bg-navy/[0.03]"
          : "border-magenta/20 bg-magenta/[0.04]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isNews ? "bg-navy/10 text-navy" : "bg-magenta/15 text-magenta"
          }`}
        >
          {promo.badge ?? (isNews ? "News" : "Promotion")}
        </span>
      </div>
      <h3 className="text-base font-bold text-navy">{promo.title}</h3>
      {promo.body && (
        <p className="text-sm leading-relaxed text-navy/70">{promo.body}</p>
      )}
      {promo.ctaHref &&
        promo.ctaLabel &&
        (ctaCategory ? (
          <button
            type="button"
            onClick={() => onSelectCategory(ctaCategory)}
            className="mt-1 inline-flex w-fit items-center gap-1 text-sm font-semibold text-magenta hover:underline"
          >
            {promo.ctaLabel}
            <span aria-hidden="true">→</span>
          </button>
        ) : (
          <a
            href={promo.ctaHref}
            className="mt-1 inline-flex w-fit items-center gap-1 text-sm font-semibold text-magenta hover:underline"
          >
            {promo.ctaLabel}
            <span aria-hidden="true">→</span>
          </a>
        ))}
    </div>
  );
}

function ProductCard({
  p,
  lifefileUrl,
  featuredLabel,
  highlight,
}: {
  p: StorefrontProduct;
  lifefileUrl: string;
  featuredLabel?: string | null;
  highlight?: boolean;
}) {
  const off = discountPercent(p.standardCents, p.priceCents);
  const showStrike =
    p.standardCents !== null &&
    p.priceCents !== null &&
    p.priceCents < p.standardCents;
  const meta = [p.strength, p.form, p.unit ?? "Each"]
    .filter(Boolean)
    .join("  ·  ");
  const badgeText = featuredLabel ?? p.badge;

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(38,34,98,0.04)] ${
        highlight ? "border-magenta/30" : "border-beige"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug text-navy">
          {p.name}
        </h3>
        {badgeText && (
          <span className="inline-flex shrink-0 items-center rounded-full bg-magenta/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-magenta">
            {badgeText}
          </span>
        )}
      </div>

      {meta && <p className="mt-1 text-xs font-medium text-navy/55">{meta}</p>}

      {p.details && (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-navy/60">
          {p.details}
        </p>
      )}

      <div className="mt-auto pt-5">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold tabular-nums leading-none text-navy">
            {formatCents(p.priceCents)}
          </span>
          {p.priceCents !== null && (
            <span className="pb-0.5 text-xs font-medium text-navy/45">
              / {(p.unit ?? "each").toLowerCase()}
            </span>
          )}
        </div>
        {(showStrike || off > 0) && (
          <div className="mt-1 flex items-center gap-2">
            {showStrike && (
              <span className="text-xs font-medium text-navy/40 line-through tabular-nums">
                {formatCents(p.standardCents)}
              </span>
            )}
            {off > 0 && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                {p.isOverride ? "Your price" : `${off}% off`}
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <a
            href={lifefileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-full bg-magenta px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-magenta-dark"
          >
            Prescribe
          </a>
          {p.detailSlug && (
            <Link
              href={`/products/${p.detailSlug}`}
              className="rounded-full border border-beige-dark px-4 py-2 text-center text-sm font-semibold text-navy/70 transition-colors hover:border-navy hover:text-navy"
            >
              Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
