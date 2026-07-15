import { describe, expect, it } from "vitest";
import {
  CATALOG_BOOK_PAGES,
  buildBookPriceIndex,
  resolveBookPrices,
} from "./catalog-book";
import { catalogProducts, type CatalogProduct } from "./catalog";
import { getProductBySlug } from "./products";
import { learningArticles } from "./learning";

describe("CATALOG_BOOK_PAGES manifest", () => {
  it("has unique page ids", () => {
    const ids = CATALOG_BOOK_PAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every product page references a real products.ts slug", () => {
    for (const page of CATALOG_BOOK_PAGES) {
      if (page.kind !== "product") continue;
      expect(
        getProductBySlug(page.slug),
        `unknown product slug in manifest: ${page.slug}`,
      ).toBeDefined();
    }
  });

  it("every product-page SKU id exists in the seed catalog", () => {
    const known = new Set(catalogProducts.map((p) => p.id));
    for (const page of CATALOG_BOOK_PAGES) {
      if (page.kind !== "product") continue;
      for (const id of page.skuIds) {
        expect(known.has(id), `unknown SKU id in manifest: ${id}`).toBe(true);
      }
    }
  });

  it("every dosage page references a real learning article", () => {
    const known = new Set(learningArticles.map((a) => a.slug));
    for (const page of CATALOG_BOOK_PAGES) {
      if (page.kind !== "dosage") continue;
      expect(
        known.has(page.articleSlug),
        `unknown learning article in manifest: ${page.articleSlug}`,
      ).toBe(true);
    }
  });

  it("starts with the cover and ends with the back cover", () => {
    expect(CATALOG_BOOK_PAGES[0]).toMatchObject({ kind: "static", staticId: "cover" });
    expect(CATALOG_BOOK_PAGES[CATALOG_BOOK_PAGES.length - 1]).toMatchObject({
      kind: "static",
      staticId: "back-cover",
    });
  });

  it("includes every products.ts product exactly once", () => {
    const slugs = CATALOG_BOOK_PAGES.filter((p) => p.kind === "product").map(
      (p) => p.slug,
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("buildBookPriceIndex / resolveBookPrices", () => {
  const product: CatalogProduct = {
    id: "semaglutide-glycine-2.5mg-1ml",
    name: "Semaglutide / Glycine 2.5mg/1mL",
    strength: "2.5 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 55, provider: 45 },
  };

  it("indexes retail prices by SKU id", () => {
    const index = buildBookPriceIndex([product]);
    expect(index["semaglutide-glycine-2.5mg-1ml"]).toEqual({
      id: "semaglutide-glycine-2.5mg-1ml",
      name: "Semaglutide / Glycine 2.5mg/1mL",
      strength: "2.5 mg/mL",
      unit: "Each",
      retail: 55,
    });
  });

  it("maps a missing or null retail tier to null", () => {
    const index = buildBookPriceIndex([
      { ...product, id: "a", pricing: {} },
      { ...product, id: "b", pricing: { retail: null } },
    ]);
    expect(index.a.retail).toBeNull();
    expect(index.b.retail).toBeNull();
  });

  it("resolves SKU ids in order, skipping unknown ids", () => {
    const index = buildBookPriceIndex([product]);
    const items = resolveBookPrices(
      ["not-a-sku", "semaglutide-glycine-2.5mg-1ml"],
      index,
    );
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("semaglutide-glycine-2.5mg-1ml");
  });

  it("returns an empty list for empty inputs", () => {
    expect(resolveBookPrices([], buildBookPriceIndex([]))).toEqual([]);
  });
});
