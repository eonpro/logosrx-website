import Image from "next/image";
import type { Product, ProductCategoryKey } from "@/data/products";
import { SITE } from "@/lib/constants";
import ProductBadge from "./ProductBadge";

/**
 * Color treatment for the category eyebrow (e.g. magenta for "ORAL TABLETS",
 * sky-blue for "INJECTABLE"). Mirrors the print catalog.
 */
const CATEGORY_EYEBROW_CLASS: Record<ProductCategoryKey, string> = {
  Injectable: "text-sky",
  "Oral Tablets": "text-magenta",
  "Oral Capsules": "text-purple",
};

function ModifierLine({
  modifier,
  modifierStyle = "subtitle",
}: {
  modifier: string;
  modifierStyle?: NonNullable<Product["modifierStyle"]>;
}) {
  switch (modifierStyle) {
    case "in":
      return (
        <span className="italic font-normal text-navy/80">{` in ${modifier}`}</span>
      );
    case "plus":
      return (
        <>
          <sup className="ml-1 mr-0.5 text-[0.55em] font-semibold uppercase tracking-wider text-navy/60 align-super">
            plus
          </sup>
          <span className="italic font-normal text-navy/80">{modifier}</span>
        </>
      );
    case "generic":
      return (
        <span className="block text-base sm:text-lg font-medium text-navy/55 mt-2">
          {modifier}
        </span>
      );
    case "subtitle":
    default:
      return (
        <span className="block text-lg sm:text-xl font-medium text-navy/70 italic mt-1">
          {modifier}
        </span>
      );
  }
}

function VialPlaceholder({ name }: { name: string }) {
  return (
    <div
      className="relative w-28 h-72 rounded-2xl bg-gradient-to-b from-magenta/80 via-purple-deep/70 to-navy-deep/90 flex flex-col items-center shadow-2xl"
      aria-hidden="true"
    >
      <div className="w-10 h-6 rounded-t-lg bg-magenta-light/80 -mt-px" />
      <div className="flex-1 w-[calc(100%-10px)] rounded-b-lg bg-white/10 backdrop-blur-sm mt-2 flex items-center justify-center">
        <div className="text-center text-white/85 px-2">
          <p className="text-[10px] font-bold tracking-widest uppercase">
            Logos RX
          </p>
          <p className="text-[8px] mt-1 opacity-75 leading-tight">{name}</p>
        </div>
      </div>
    </div>
  );
}

interface ProductHeroProps {
  product: Product;
}

export default function ProductHero({ product }: ProductHeroProps) {
  const eyebrowClass =
    CATEGORY_EYEBROW_CLASS[product.categoryKey] ?? "text-magenta";
  const heroBullets = product.heroBullets ?? [];

  return (
    <section className="relative bg-gradient-to-b from-cream via-white to-white pt-12 sm:pt-20 pb-16 sm:pb-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left column — copy + CTA */}
          <div className="lg:col-span-7">
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 ${eyebrowClass}`}
            >
              {product.categoryKey}
            </p>

            {product.badges?.length ? (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {product.badges.map((b) => (
                  <ProductBadge key={b.label} badge={b} />
                ))}
              </div>
            ) : null}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.05] tracking-tight">
              {product.name}
              {product.modifier ? (
                <ModifierLine
                  modifier={product.modifier}
                  modifierStyle={product.modifierStyle}
                />
              ) : null}
            </h1>

            {product.tagline ? (
              <p className="mt-6 text-lg sm:text-xl leading-relaxed text-navy/70 max-w-xl">
                {product.tagline}
              </p>
            ) : null}

            {heroBullets.length > 0 ? (
              <ul className="mt-8 space-y-3 max-w-xl">
                {heroBullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-base text-navy/80">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      className="shrink-0 mt-0.5 text-magenta"
                    >
                      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                      <path
                        d="M6 10l3 3 5-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href={SITE.onboarding}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-magenta px-8 py-4 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors"
              >
                Prescribe via Onboarding Portal
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M4 10l6-6M5 4h5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href="#product-details"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-navy/15 px-8 py-4 text-sm font-semibold text-navy hover:bg-navy hover:text-white transition-colors"
              >
                View product details
              </a>
            </div>

            {product.footnote ? (
              <p className="mt-6 text-xs text-navy/60 leading-relaxed max-w-xl">
                {product.footnote}
              </p>
            ) : null}
          </div>

          {/* Right column — product image / placeholder */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square w-full max-w-md mx-auto rounded-3xl bg-gradient-to-br from-beige via-cream to-white overflow-hidden flex items-center justify-center shadow-sm">
              {product.image ? (
                <div className="relative">
                  <Image
                    src={product.image}
                    alt={product.imageAlt ?? product.name}
                    width={420}
                    height={420}
                    className="relative z-10 h-80 w-auto object-contain drop-shadow-xl"
                    priority
                  />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-6 rounded-[50%] bg-black/10 blur-lg" />
                </div>
              ) : (
                <div className="relative">
                  <VialPlaceholder name={product.name} />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-6 rounded-[50%] bg-black/15 blur-md" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
