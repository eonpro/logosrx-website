import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getClinicGate } from "@/lib/onboarding/data";
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
import CatalogProductCards from "@/components/catalog/CatalogProductCards";
import CatalogPagination from "@/components/catalog/CatalogPagination";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { products } from "@/data/products";

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
  // The full catalog (SKUs + provider pricing) is private. Only clinics that
  // have created an account AND been approved by an admin may view it.
  //   - anonymous            → account creation (`/onboarding`)
  //   - signed-in, no intake → finish account creation
  //   - pending / rejected   → dashboard (shows verification status banner)
  const { userId } = await auth();
  if (!userId) redirect("/onboarding");

  const gate = await getClinicGate(userId);
  if (!gate.onboardingCompleted) redirect("/onboarding");
  if (gate.verificationStatus !== "verified") redirect("/dashboard");

  const params = await searchParams;
  const filters = parseCatalogSearchParams(params);

  const matched = filterCatalog(catalogProducts, filters);
  const sorted = sortCatalog(matched, filters.sort, filters.tier);
  const pageData = paginateCatalog(sorted, filters.page, CATALOG_CONFIG.pageSize);
  const counts = getFilterCounts(catalogProducts, filters);
  const detailSlugs = products.map((p) => p.slug);

  return (
    <>
      <CatalogHero />

      {/* App-style sticky toolbar — frosts over content as the list scrolls. */}
      <div className="catalog-sticky-toolbar safe-px">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 lg:max-w-md">
              <CatalogSearch
                initialQuery={filters.q}
                resultCount={pageData.total}
              />
            </div>

            {/* Mobile action row: Filters + Sort split evenly as big targets. */}
            <div className="flex items-stretch gap-2 lg:hidden">
              <div className="flex-1">
                <CatalogMobileFilters filters={filters} counts={counts} />
              </div>
              <div className="flex-1">
                <CatalogSortSelect value={filters.sort} tier={filters.tier} />
              </div>
            </div>

            {/* Desktop controls. */}
            <div className="hidden items-center gap-3 lg:flex">
              <CatalogTierSelect value={filters.tier} />
              <CatalogSortSelect value={filters.sort} tier={filters.tier} />
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          {/* Mobile: tier "show price" segmented control above the list. */}
          <div className="lg:hidden">
            <CatalogTierSelect value={filters.tier} />
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
                  {/* Mobile: tappable cards. Desktop: dense table. */}
                  <CatalogProductCards
                    items={pageData.items}
                    tier={filters.tier}
                    detailSlugs={detailSlugs}
                  />
                  <div className="hidden lg:block">
                    <CatalogTable items={pageData.items} tier={filters.tier} />
                  </div>
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
