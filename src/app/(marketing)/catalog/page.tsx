import type { Metadata } from "next";
import {
  CATALOG_CONFIG,
  catalogProducts,
  filterCatalog,
  getFilterCounts,
  paginateCatalog,
  parseCatalogSearchParams,
  sortCatalog,
} from "@/data/catalog";
import CatalogHero from "@/components/catalog/CatalogHero";
import CatalogFiltersSidebar from "@/components/catalog/CatalogFiltersSidebar";
import CatalogMobileFilters from "@/components/catalog/CatalogMobileFilters";
import CatalogSearch from "@/components/catalog/CatalogSearch";
import CatalogSortSelect from "@/components/catalog/CatalogSortSelect";
import CatalogTierSelect from "@/components/catalog/CatalogTierSelect";
import CatalogActiveFilters from "@/components/catalog/CatalogActiveFilters";
import CatalogResultsSummary from "@/components/catalog/CatalogResultsSummary";
import CatalogTable from "@/components/catalog/CatalogTable";
import CatalogPagination from "@/components/catalog/CatalogPagination";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";

export const metadata: Metadata = {
  title: `${CATALOG_CONFIG.title} | Logos RX`,
  description: `${CATALOG_CONFIG.title} of compounded medications and provider pricing from Logos RX.`,
  // Pricing is competitive intel; default to no-index unless explicitly
  // opted-in via CATALOG_CONFIG.indexable.
  robots: CATALOG_CONFIG.indexable
    ? undefined
    : { index: false, follow: false },
};

interface CatalogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * `/catalog` — public-but-unlisted catalog of compounded medications with
 * three-tier pricing and faceted filters.
 *
 * Server component. All filtering / sorting / pagination is deterministic
 * given the URL search params, so the same URL always renders the same UI
 * (cache-friendly, share-friendly). The only client-side pieces are the
 * search input, the sort + tier selects, and the mobile filter drawer.
 */
export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const filters = parseCatalogSearchParams(params);

  const matched = filterCatalog(catalogProducts, filters);
  const sorted = sortCatalog(matched, filters.sort, filters.tier);
  const pageData = paginateCatalog(sorted, filters.page, CATALOG_CONFIG.pageSize);
  const counts = getFilterCounts(catalogProducts, filters);

  return (
    <>
      <CatalogHero />

      <section className="bg-white pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Toolbar: search + sort + tier */}
          <div className="flex flex-col gap-4 border-b border-beige pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 lg:max-w-md">
              <CatalogSearch
                initialQuery={filters.q}
                resultCount={pageData.total}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <CatalogMobileFilters filters={filters} counts={counts} />
              <CatalogTierSelect value={filters.tier} />
              <CatalogSortSelect value={filters.sort} tier={filters.tier} />
            </div>
          </div>

          {/* Active filter chips + result count */}
          <div className="flex flex-col-reverse gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <CatalogResultsSummary
              total={pageData.total}
              page={pageData.page}
              pageSize={pageData.pageSize}
            />
            <CatalogActiveFilters filters={filters} />
          </div>

          {/* Sidebar + main column */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <CatalogFiltersSidebar
                  filters={filters}
                  counts={counts}
                />
              </div>
            </div>

            <div className="min-w-0">
              {pageData.total === 0 ? (
                <CatalogEmptyState
                  filters={filters}
                  totalProducts={catalogProducts.length}
                />
              ) : (
                <div className="flex flex-col gap-6">
                  <CatalogTable items={pageData.items} tier={filters.tier} />
                  <CatalogPagination
                    filters={filters}
                    page={pageData.page}
                    totalPages={pageData.totalPages}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
