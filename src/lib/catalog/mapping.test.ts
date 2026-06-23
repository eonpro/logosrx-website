import { describe, it, expect } from "vitest";
import {
  cleanPricing,
  rowToCatalogProduct,
  catalogProductToInsert,
  isValidSkuId,
  type CatalogProductRow,
} from "./mapping";
import type { CatalogProduct } from "@/data/catalog";

function makeRow(over: Partial<CatalogProductRow> = {}): CatalogProductRow {
  return {
    id: "sema-2.5mg-1ml",
    name: "Semaglutide / Glycine",
    strength: "2.5 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 55, provider: 45 },
    productFamily: ["GLP-1"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Loss"],
    details: null,
    badge: null,
    sortOrder: 0,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as CatalogProductRow;
}

describe("cleanPricing", () => {
  it("keeps numbers, keeps null (Not Available), drops undefined (hidden)", () => {
    const out = cleanPricing({ retail: 55, provider: null, volume: undefined });
    expect(out).toEqual({ retail: 55, provider: null });
    expect("volume" in out).toBe(false);
  });

  it("drops non-finite values that are not null", () => {
    const out = cleanPricing({
      retail: Number.NaN,
      provider: 10,
      volume: Infinity,
    });
    expect(out).toEqual({ provider: 10 });
  });

  it("returns an empty object for null/undefined input", () => {
    expect(cleanPricing(null)).toEqual({});
    expect(cleanPricing(undefined)).toEqual({});
  });
});

describe("rowToCatalogProduct", () => {
  it("preserves the null vs undefined tier distinction", () => {
    const product = rowToCatalogProduct(
      makeRow({ pricing: { retail: 90, provider: null } }),
    );
    expect(product.pricing.retail).toBe(90);
    expect(product.pricing.provider).toBeNull();
    expect("volume" in product.pricing).toBe(false);
  });

  it("omits empty optional fields to match the static-array shape", () => {
    const product = rowToCatalogProduct(
      makeRow({
        strength: null,
        unit: null,
        brand: null,
        details: null,
        badge: null,
        productFamily: [],
        therapeuticAreas: [],
      }),
    );
    expect(product).toEqual({
      id: "sema-2.5mg-1ml",
      name: "Semaglutide / Glycine",
      form: "Injectable",
      pricing: expect.any(Object),
    });
    expect("strength" in product).toBe(false);
    expect("productFamily" in product).toBe(false);
  });

  it("carries arrays and scalar metadata through", () => {
    const product = rowToCatalogProduct(makeRow());
    expect(product.productFamily).toEqual(["GLP-1"]);
    expect(product.therapeuticAreas).toEqual(["Weight Loss"]);
    expect(product.brand).toBe("Logos RX");
    expect(product.unit).toBe("Each");
  });
});

describe("catalogProductToInsert", () => {
  it("round-trips through rowToCatalogProduct", () => {
    const original: CatalogProduct = {
      id: "tirzepatide-glycine-10mg-1ml",
      name: "Tirzepatide / Glycine",
      strength: "10 mg/mL",
      form: "Injectable",
      unit: "Each",
      pricing: { retail: 80, provider: 60, volume: null },
      productFamily: ["GLP-1"],
      brand: "Logos RX",
      therapeuticAreas: ["Weight Loss"],
    };
    const insert = catalogProductToInsert(original, 7);
    expect(insert.sortOrder).toBe(7);

    const roundTripped = rowToCatalogProduct(
      makeRow({
        ...insert,
        // makeRow expects these non-null DB defaults
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
      } as Partial<CatalogProductRow>),
    );
    expect(roundTripped).toEqual(original);
  });

  it("normalizes undefined optionals to null columns", () => {
    const insert = catalogProductToInsert(
      {
        id: "x-1",
        name: "X",
        form: "Capsule",
        pricing: { provider: 12 },
      },
      0,
    );
    expect(insert.strength).toBeNull();
    expect(insert.unit).toBeNull();
    expect(insert.brand).toBeNull();
    expect(insert.productFamily).toEqual([]);
    expect(insert.therapeuticAreas).toEqual([]);
    expect(insert.pricing).toEqual({ provider: 12 });
  });
});

describe("isValidSkuId", () => {
  it("accepts lowercase kebab/dot slugs", () => {
    expect(isValidSkuId("semaglutide-glycine-2.5mg-1ml")).toBe(true);
    expect(isValidSkuId("tirzepatide-30mg-2ml")).toBe(true);
    expect(isValidSkuId("x1")).toBe(true);
  });

  it("rejects uppercase, spaces, and bad separators", () => {
    expect(isValidSkuId("Semaglutide")).toBe(false);
    expect(isValidSkuId("has space")).toBe(false);
    expect(isValidSkuId("-leading")).toBe(false);
    expect(isValidSkuId("trailing-")).toBe(false);
    expect(isValidSkuId("double--dash")).toBe(false);
    expect(isValidSkuId("")).toBe(false);
    expect(isValidSkuId("a".repeat(121))).toBe(false);
  });
});
