import {
  CATALOG_CONFIG,
  formatValidityDate,
  type CatalogConfig,
} from "@/data/catalog";

interface CatalogHeroProps {
  /**
   * Override the global catalog config. Useful when we eventually support
   * multiple catalog variants (e.g. retail vs. partner) — for now defaults
   * to the single global config exported from `src/data/catalog.ts`.
   */
  config?: CatalogConfig;
}

/**
 * Top-of-page hero for `/catalog`. Server component, ships no JS.
 *
 * Layout mirrors the Hallandale reference: eyebrow → big title → optional
 * pill → validity range → italic disclaimer.
 */
export default function CatalogHero({ config = CATALOG_CONFIG }: CatalogHeroProps) {
  return (
    <section
      aria-labelledby="catalog-heading"
      className="bg-gradient-to-b from-cream to-white pt-16 pb-10 sm:pt-20 sm:pb-12"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-3">
          {config.eyebrow}
        </p>

        <h1
          id="catalog-heading"
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-tight"
        >
          {config.title}
        </h1>

        {config.pill && (
          <div className="mt-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-magenta px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white">
              {config.pill}
            </span>
          </div>
        )}

        <p className="mt-6 text-sm sm:text-base font-medium text-navy/80">
          Valid {formatValidityDate(config.validFrom)} &ndash;{" "}
          {formatValidityDate(config.validTo)}
        </p>

        <p className="mt-3 max-w-3xl text-sm italic text-navy/65 leading-relaxed">
          {config.disclaimer}
        </p>

        <div className="mt-6 inline-flex max-w-3xl items-start gap-2.5 rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-3">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-magenta"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm1-11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1 3a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0v-3a1 1 0 0 0-1-1Z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm font-medium text-navy">{config.salesNote}</p>
        </div>
      </div>
    </section>
  );
}
