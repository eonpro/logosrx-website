import Link from "next/link";
import {
  countActiveFilters,
  FILTER_GROUPS,
  type CatalogFilters,
  type FilterGroupKey,
} from "@/data/catalog";
import CatalogFilterGroup from "./CatalogFilterGroup";

interface CatalogFiltersSidebarProps {
  filters: CatalogFilters;
  counts: Record<FilterGroupKey, Record<string, number>>;
  /** Mobile copy uses idSuffix="mobile" to avoid duplicate-id collisions. */
  idSuffix?: string;
  /** Hide the header row (mobile drawer renders its own). */
  hideHeader?: boolean;
}

/**
 * Composite of all filter groups. Server-rendered, no JS for desktop.
 *
 * Each `<details>` block stays independently collapsible; the header shows
 * the total active-filter count and a clear-all link that strips the filter
 * params from the URL while preserving search query / sort / tier.
 */
export default function CatalogFiltersSidebar({
  filters,
  counts,
  idSuffix,
  hideHeader,
}: CatalogFiltersSidebarProps) {
  const activeCount = countActiveFilters(filters);
  // Clear-all preserves the user's search + sort + tier; only strips the
  // multi-select chips. Reset page back to 1.
  const clearHref =
    "/catalog" +
    (() => {
      const sp = new URLSearchParams();
      if (filters.q) sp.set("q", filters.q);
      if (filters.sort !== "name") sp.set("sort", filters.sort);
      if (filters.tier !== "provider") sp.set("tier", filters.tier);
      const qs = sp.toString();
      return qs ? `?${qs}` : "";
    })();

  return (
    <aside
      aria-label="Catalog filters"
      className="w-full"
    >
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-beige pb-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-navy">
            Filters
          </h2>
          {activeCount > 0 && (
            <Link
              href={clearHref}
              className="text-xs font-semibold text-magenta hover:text-magenta-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta rounded"
            >
              Clear all ({activeCount})
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col">
        {FILTER_GROUPS.map((group) => (
          <CatalogFilterGroup
            key={group.key}
            groupKey={group.key}
            label={group.label}
            options={group.options}
            filters={filters}
            counts={counts[group.key]}
            idSuffix={idSuffix}
          />
        ))}
      </div>
    </aside>
  );
}
