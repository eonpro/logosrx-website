import type { ReactNode } from "react";
import {
  CATALOG_BOOK_PAGES,
  resolveBookPrices,
  type BookPriceItem,
} from "@/data/catalog-book";
import { getProductBySlug } from "@/data/products";
import { learningArticles } from "@/data/learning";
import type { BookPageMeta } from "./CatalogBook";
import BookProductPage from "./pages/BookProductPage";
import BookDosagePage from "./pages/BookDosagePage";
import { STATIC_PAGE_COMPONENTS } from "./pages/BookStaticPages";

export interface BuiltBook {
  /** Serializable metadata for the client pager, aligned with `nodes`. */
  meta: BookPageMeta[];
  /** Server-rendered page contents. */
  nodes: ReactNode[];
}

/**
 * Materialize the catalog-book manifest into renderable pages. Pages whose
 * referenced product/article no longer exists are dropped (with the metadata
 * kept aligned) so a stale manifest entry can never crash the viewer.
 */
export function buildBookPages(
  priceIndex: Record<string, BookPriceItem>,
): BuiltBook {
  const meta: BookPageMeta[] = [];
  const nodes: ReactNode[] = [];

  for (const page of CATALOG_BOOK_PAGES) {
    let node: ReactNode | null = null;

    switch (page.kind) {
      case "static": {
        const StaticPage = STATIC_PAGE_COMPONENTS[page.staticId];
        node = <StaticPage key={page.id} />;
        break;
      }
      case "product": {
        const product = getProductBySlug(page.slug);
        if (!product) break;
        node = (
          <BookProductPage
            key={page.id}
            product={product}
            prices={resolveBookPrices(page.skuIds, priceIndex)}
          />
        );
        break;
      }
      case "dosage": {
        const article = learningArticles.find(
          (a) => a.slug === page.articleSlug,
        );
        if (!article) break;
        node = <BookDosagePage key={page.id} article={article} />;
        break;
      }
    }

    if (node === null) continue;
    meta.push({
      id: page.id,
      ...(page.tocLabel ? { tocLabel: page.tocLabel } : {}),
      ...(page.tocGroup ? { tocGroup: page.tocGroup } : {}),
    });
    nodes.push(node);
  }

  return { meta, nodes };
}
