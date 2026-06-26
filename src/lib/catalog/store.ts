import "server-only";
import { unstable_cache } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { catalogProducts } from "@/lib/db/schema";
import type { CatalogProduct } from "@/data/catalog";
import { rowToCatalogProduct, type CatalogProductRow } from "./mapping";

/**
 * Server-only catalog reads. The product roster + three-tier pricing live in
 * the `catalog_products` table (seeded from the former static array). Reads are
 * tag-cached so the public `/catalog` page and clinic storefront stay fast;
 * admin mutations call `updateTag(CATALOG_PRODUCTS_TAG)` for immediate freshness
 * (read-your-own-writes), so saved prices show up on the next read everywhere.
 */

/** Cache tag for all catalog product reads. */
export const CATALOG_PRODUCTS_TAG = "catalog-products";

const getActiveRows = unstable_cache(
  async (): Promise<CatalogProductRow[]> =>
    db
      .select()
      .from(catalogProducts)
      .where(eq(catalogProducts.active, true))
      .orderBy(asc(catalogProducts.sortOrder), asc(catalogProducts.name)),
  ["catalog-products:active"],
  { tags: [CATALOG_PRODUCTS_TAG], revalidate: 300 },
);

/**
 * Active catalog SKUs mapped to the `CatalogProduct` shape. Drop-in replacement
 * for the former `catalogProducts` static import; the pure helpers in
 * `@/data/catalog` (filter/sort/paginate/getFilterCounts/standardCatalogPrice)
 * operate on this unchanged.
 */
export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const rows = await getActiveRows();
  return rows.map(rowToCatalogProduct);
}

/** Every SKU (including inactive), as raw rows, for the admin editor. */
export async function getCatalogProductsForAdmin(): Promise<
  CatalogProductRow[]
> {
  return db
    .select()
    .from(catalogProducts)
    .orderBy(asc(catalogProducts.sortOrder), asc(catalogProducts.name));
}

/** Set of active catalog SKU ids — handy for validating references. */
export async function getActiveCatalogIds(): Promise<Set<string>> {
  const rows = await getActiveRows();
  return new Set(rows.map((r) => r.id));
}
