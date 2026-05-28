import Link from "next/link";
import {
  serializeCatalogSearchParams,
  type CatalogFilters,
} from "@/data/catalog";

interface CatalogPaginationProps {
  filters: CatalogFilters;
  page: number;
  totalPages: number;
}

/**
 * Builds a URL for a specific page number, preserving the current filter
 * state.
 */
function pageHref(filters: CatalogFilters, page: number) {
  return `/catalog${serializeCatalogSearchParams({ ...filters, page })}`;
}

/**
 * Smart pagination range: always show the first + last pages, the current
 * page +/- 1, and ellipses for the gap. Caps the visible page-number count
 * at ~7 entries so the bar stays readable for catalogs of any size.
 */
function getPageRange(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  const leftBound = Math.max(2, page - 1);
  const rightBound = Math.min(totalPages - 1, page + 1);
  if (leftBound > 2) pages.push("…");
  for (let p = leftBound; p <= rightBound; p++) pages.push(p);
  if (rightBound < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

export default function CatalogPagination({
  filters,
  page,
  totalPages,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageRange(page, totalPages);
  const prevHref = page > 1 ? pageHref(filters, page - 1) : undefined;
  const nextHref = page < totalPages ? pageHref(filters, page + 1) : undefined;

  return (
    <nav
      aria-label="Catalog pagination"
      className="flex items-center justify-center gap-2 pt-4"
    >
      {prevHref ? (
        <Link
          href={prevHref}
          rel="prev"
          aria-label="Previous page"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-beige bg-white px-3.5 text-sm font-medium text-navy hover:border-navy/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M6.5 2L3 5l3.5 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Prev
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-full border border-beige bg-cream/40 px-3.5 text-sm font-medium text-navy/35"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M6.5 2L3 5l3.5 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Prev
        </span>
      )}

      <ol role="list" className="flex items-center gap-1">
        {pages.map((p, i) => {
          if (p === "…") {
            return (
              <li
                key={`gap-${i}`}
                aria-hidden="true"
                className="px-1 text-sm text-navy/40"
              >
                …
              </li>
            );
          }
          const isCurrent = p === page;
          return (
            <li key={p}>
              <Link
                href={pageHref(filters, p)}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta ${
                  isCurrent
                    ? "bg-navy text-white"
                    : "text-navy/75 hover:bg-cream"
                }`}
              >
                {p}
              </Link>
            </li>
          );
        })}
      </ol>

      {nextHref ? (
        <Link
          href={nextHref}
          rel="next"
          aria-label="Next page"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-beige bg-white px-3.5 text-sm font-medium text-navy hover:border-navy/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
        >
          Next
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M3.5 2L7 5l-3.5 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-full border border-beige bg-cream/40 px-3.5 text-sm font-medium text-navy/35"
        >
          Next
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M3.5 2L7 5l-3.5 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </nav>
  );
}
