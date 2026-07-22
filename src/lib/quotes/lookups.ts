import "server-only";
import { resolveDetailSlug, standardCatalogPrice } from "@/data/catalog";
import { getCatalogProducts } from "@/lib/catalog/store";
import { products } from "@/data/products";

// Resolve each catalog SKU to its marketing product image (same mapping the
// clinic storefront uses), so quote line items can show the product photo.
const detailSlugs = products.map((p) => p.slug);
const productBySlug = new Map(products.map((p) => [p.slug, p]));

export interface CatalogLookups {
  /** Standard catalog price in cents (or null when unpriced), keyed by SKU id. */
  standardCentsById: Map<string, number | null>;
  /** Marketing product image (public path + alt), keyed by SKU id. */
  imageById: Map<string, { url: string; alt: string } | null>;
}

/** Per-request lookups for standard price + product image, keyed by SKU id. */
export async function buildCatalogLookups(): Promise<CatalogLookups> {
  const catalogProducts = await getCatalogProducts();
  const standardCentsById = new Map<string, number | null>(
    catalogProducts.map((p) => {
      const dollars = standardCatalogPrice(p);
      return [p.id, dollars === null ? null : Math.round(dollars * 100)];
    }),
  );
  const imageById = new Map<string, { url: string; alt: string } | null>(
    catalogProducts.map((p) => {
      const slug = resolveDetailSlug(p.id, detailSlugs);
      const prod = slug ? productBySlug.get(slug) : undefined;
      return [
        p.id,
        prod?.image
          ? { url: prod.image, alt: prod.imageAlt ?? prod.name }
          : null,
      ];
    }),
  );
  return { standardCentsById, imageById };
}
