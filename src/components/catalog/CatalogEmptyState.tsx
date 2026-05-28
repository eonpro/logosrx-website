import Link from "next/link";
import {
  countActiveFilters,
  type CatalogFilters,
} from "@/data/catalog";

interface CatalogEmptyStateProps {
  filters: CatalogFilters;
  /** Total number of products in the catalog data set (pre-filter). */
  totalProducts: number;
}

/**
 * Two distinct empty states:
 *   1. The catalog data set itself is empty (user hasn't loaded products yet).
 *   2. There ARE products, but the current filters / search match none.
 *
 * Both render inside the same shell so the surrounding layout doesn't jump.
 */
export default function CatalogEmptyState({
  filters,
  totalProducts,
}: CatalogEmptyStateProps) {
  const activeCount = countActiveFilters(filters);
  const hasQuery = filters.q.length > 0;

  if (totalProducts === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-beige bg-white p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-magenta">
          No catalog data loaded
        </p>
        <h2 className="mt-3 text-xl font-bold text-navy">
          The catalog is ready — just add products.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-navy/65 leading-relaxed">
          Populate{" "}
          <code className="rounded bg-cream px-1.5 py-0.5 font-mono text-xs text-navy">
            src/data/catalog.ts
          </code>{" "}
          (the <code className="rounded bg-cream px-1.5 py-0.5 font-mono text-xs text-navy">catalogProducts</code> array) and the table will populate on the next build. Filter taxonomies (product family, brand, therapeutic area, dosage form) can be extended in the same file.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-beige bg-white p-10 text-center">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="mx-auto text-navy/30"
      >
        <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2" />
        <path d="M40 40l-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h2 className="mt-4 text-xl font-bold text-navy">No products match your filters</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-navy/65">
        {hasQuery ? (
          <>
            We couldn&rsquo;t find anything for{" "}
            <span className="font-semibold text-navy">&ldquo;{filters.q}&rdquo;</span>
            {activeCount > 0 ? " with the selected filters." : "."}
          </>
        ) : (
          "Try removing one or more filters to see more results."
        )}
      </p>
      <Link
        href="/catalog"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-magenta px-6 py-2.5 text-sm font-semibold text-white hover:bg-magenta-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta transition-colors"
      >
        Clear all filters
      </Link>
    </div>
  );
}
