import { describe, expect, it } from "vitest";
import {
  CATALOG_CONFIG,
  CATALOG_TIERS,
  countActiveFilters,
  EMPTY_FILTERS,
  filterCatalog,
  formatPrice,
  formatValidityDate,
  getFilterCounts,
  getFilterGroupLabel,
  paginateCatalog,
  parseCatalogSearchParams,
  serializeCatalogSearchParams,
  sortCatalog,
  toggleFilterValue,
  type CatalogProduct,
} from "./catalog";

const fixtures: CatalogProduct[] = [
  {
    id: "a",
    name: "Alpha Injection",
    strength: "100 mg/mL",
    form: "Injectable",
    pricing: { retail: 100, provider: 80, volume: 60 },
    productFamily: ["Hormone Replacement"],
    brand: "Logos RX",
    therapeuticAreas: ["Hormone Replacement"],
  },
  {
    id: "b",
    name: "Beta Capsule",
    strength: "50 mg",
    form: "Capsule",
    pricing: { retail: 20, provider: 15, volume: null },
    productFamily: ["Custom Compound", "Hormone Replacement"],
    brand: "Logos RX",
    therapeuticAreas: ["Hormone Replacement", "Vitality"],
    details: "Custom formulation with selectable ingredients.",
  },
  {
    id: "c",
    name: "Charlie Cream",
    form: "Cream",
    pricing: { retail: 40, provider: null, volume: undefined },
    productFamily: ["Numbing Creams"],
    brand: "Commercial",
    therapeuticAreas: ["Dermatology"],
  },
  {
    id: "d",
    name: "Delta GLP-1 Injectable",
    strength: "2.5 mg/mL",
    form: "Injectable",
    pricing: { retail: 350, provider: 250, volume: 200 },
    productFamily: ["GLP-1"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Management"],
  },
];

describe("parseCatalogSearchParams", () => {
  it("returns sensible defaults for missing params", () => {
    const parsed = parseCatalogSearchParams(undefined);
    expect(parsed).toEqual(EMPTY_FILTERS);
  });

  it("parses comma-separated multi-valued filters", () => {
    const parsed = parseCatalogSearchParams({
      family: "GLP-1,Hormone Replacement",
    });
    expect(parsed.family).toEqual(["GLP-1", "Hormone Replacement"]);
  });

  it("accepts array-form params and dedupes", () => {
    const parsed = parseCatalogSearchParams({
      brand: ["Logos RX", "Logos RX", "Commercial"],
    });
    expect(parsed.brand).toEqual(["Logos RX", "Commercial"]);
  });

  it("drops unknown enum values silently", () => {
    const parsed = parseCatalogSearchParams({
      form: "Injectable,NotARealForm",
      sort: "bogus",
      tier: "fake-tier",
    });
    expect(parsed.form).toEqual(["Injectable"]);
    expect(parsed.sort).toBe("name");
    expect(parsed.tier).toBe(CATALOG_CONFIG.defaultTier);
  });

  it("clamps `page` to the valid range and defaults non-numbers to 1", () => {
    expect(parseCatalogSearchParams({ page: "0" }).page).toBe(1);
    expect(parseCatalogSearchParams({ page: "-5" }).page).toBe(1);
    expect(parseCatalogSearchParams({ page: "9999999" }).page).toBe(9999);
    expect(parseCatalogSearchParams({ page: "not-a-number" }).page).toBe(1);
  });

  it("caps search query length and trims whitespace", () => {
    const parsed = parseCatalogSearchParams({ q: `   ${"x".repeat(500)}   ` });
    expect(parsed.q.length).toBe(100);
    expect(parsed.q.startsWith(" ")).toBe(false);
  });
});

describe("serializeCatalogSearchParams", () => {
  it("returns an empty string when only defaults are set", () => {
    expect(serializeCatalogSearchParams(EMPTY_FILTERS)).toBe("");
  });

  it("omits default sort, tier, and page=1", () => {
    expect(
      serializeCatalogSearchParams({
        ...EMPTY_FILTERS,
        sort: "name",
        tier: CATALOG_CONFIG.defaultTier,
        page: 1,
      }),
    ).toBe("");
  });

  it("emits comma-separated arrays in a stable order", () => {
    const qs = serializeCatalogSearchParams({
      family: ["GLP-1", "Hormone Replacement"],
      form: ["Injectable"],
    });
    expect(qs).toContain("family=GLP-1%2CHormone+Replacement");
    expect(qs).toContain("form=Injectable");
  });

  it("includes non-default page / sort / tier", () => {
    const qs = serializeCatalogSearchParams({
      page: 3,
      sort: "price-asc",
      tier: "retail",
    });
    expect(qs).toContain("page=3");
    expect(qs).toContain("sort=price-asc");
    expect(qs).toContain("tier=retail");
  });

  it("round-trips a non-default filter set", () => {
    const filters = parseCatalogSearchParams({
      q: "test",
      family: "GLP-1",
      brand: "Logos RX",
      form: "Injectable",
      page: "4",
      sort: "price-desc",
      tier: "retail",
    });
    const qs = serializeCatalogSearchParams(filters);
    const reparsed = parseCatalogSearchParams(
      Object.fromEntries(new URLSearchParams(qs.slice(1))),
    );
    expect(reparsed).toEqual(filters);
  });
});

describe("toggleFilterValue", () => {
  it("adds a value when absent", () => {
    const next = toggleFilterValue(EMPTY_FILTERS, "family", "GLP-1");
    expect(next.family).toEqual(["GLP-1"]);
    expect(next.page).toBe(1);
  });

  it("removes a value when present", () => {
    const seed = { ...EMPTY_FILTERS, family: ["GLP-1", "Hormone Replacement"] as never };
    const next = toggleFilterValue(seed, "family", "GLP-1");
    expect(next.family).toEqual(["Hormone Replacement"]);
  });

  it("always resets the page to 1", () => {
    const seed = { ...EMPTY_FILTERS, page: 5 };
    const next = toggleFilterValue(seed, "brand", "Logos RX");
    expect(next.page).toBe(1);
  });

  it("does not mutate the input filters object", () => {
    const seed = { ...EMPTY_FILTERS, family: ["GLP-1"] as never };
    const snapshot = JSON.stringify(seed);
    toggleFilterValue(seed, "family", "Hormone Replacement");
    expect(JSON.stringify(seed)).toBe(snapshot);
  });
});

describe("filterCatalog", () => {
  it("returns the full list when no filters are active", () => {
    expect(filterCatalog(fixtures, EMPTY_FILTERS)).toHaveLength(fixtures.length);
  });

  it("matches search across name, strength, and details", () => {
    expect(
      filterCatalog(fixtures, { ...EMPTY_FILTERS, q: "alpha" }).map((p) => p.id),
    ).toEqual(["a"]);
    expect(
      filterCatalog(fixtures, { ...EMPTY_FILTERS, q: "2.5 mg" }).map((p) => p.id),
    ).toEqual(["d"]);
    expect(
      filterCatalog(fixtures, { ...EMPTY_FILTERS, q: "selectable" }).map((p) => p.id),
    ).toEqual(["b"]);
  });

  it("is case-insensitive on the search query", () => {
    expect(
      filterCatalog(fixtures, { ...EMPTY_FILTERS, q: "BETA" }).map((p) => p.id),
    ).toEqual(["b"]);
  });

  it("ORs within a multi-value group", () => {
    const result = filterCatalog(fixtures, {
      ...EMPTY_FILTERS,
      family: ["GLP-1", "Numbing Creams"],
    });
    expect(result.map((p) => p.id).sort()).toEqual(["c", "d"]);
  });

  it("ANDs across groups", () => {
    const result = filterCatalog(fixtures, {
      ...EMPTY_FILTERS,
      family: ["Hormone Replacement"],
      form: ["Capsule"],
    });
    expect(result.map((p) => p.id)).toEqual(["b"]);
  });

  it("treats missing brand on a product as a non-match when brand filter is set", () => {
    const productWithoutBrand: CatalogProduct = {
      id: "z",
      name: "No-Brand Item",
      form: "Tablet",
      pricing: {},
    };
    const result = filterCatalog([productWithoutBrand, ...fixtures], {
      ...EMPTY_FILTERS,
      brand: ["Logos RX"],
    });
    expect(result.find((p) => p.id === "z")).toBeUndefined();
  });
});

describe("sortCatalog", () => {
  it("sorts alphabetically by name (default)", () => {
    expect(sortCatalog(fixtures, "name", "provider").map((p) => p.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("sorts by ascending price within the selected tier", () => {
    expect(
      sortCatalog(fixtures, "price-asc", "retail").map((p) => p.id),
    ).toEqual(["b", "c", "a", "d"]);
  });

  it("sorts by descending price within the selected tier", () => {
    expect(
      sortCatalog(fixtures, "price-desc", "retail").map((p) => p.id),
    ).toEqual(["d", "a", "c", "b"]);
  });

  it("pushes products with missing tier prices to the end of the sort", () => {
    // For `provider` tier, `c.pricing.provider` is null and should sort last
    // regardless of direction.
    const asc = sortCatalog(fixtures, "price-asc", "provider").map((p) => p.id);
    const desc = sortCatalog(fixtures, "price-desc", "provider").map((p) => p.id);
    expect(asc[asc.length - 1]).toBe("c");
    expect(desc[desc.length - 1]).toBe("c");
  });

  it("does not mutate the source array", () => {
    const original = [...fixtures];
    sortCatalog(fixtures, "price-asc", "retail");
    expect(fixtures).toEqual(original);
  });
});

describe("paginateCatalog", () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));

  it("returns a single page when items fit", () => {
    const page = paginateCatalog(items.slice(0, 5), 1, 10);
    expect(page).toEqual({
      items: items.slice(0, 5),
      total: 5,
      page: 1,
      totalPages: 1,
      pageSize: 10,
    });
  });

  it("paginates correctly with a non-trivial set", () => {
    const page = paginateCatalog(items, 2, 10);
    expect(page.items).toEqual(items.slice(10, 20));
    expect(page.totalPages).toBe(3);
    expect(page.total).toBe(25);
  });

  it("clamps over-large pages to the last page", () => {
    const page = paginateCatalog(items, 99, 10);
    expect(page.page).toBe(3);
    expect(page.items).toEqual(items.slice(20, 25));
  });

  it("clamps zero / negative pages to 1", () => {
    expect(paginateCatalog(items, 0, 10).page).toBe(1);
    expect(paginateCatalog(items, -5, 10).page).toBe(1);
  });

  it("handles an empty source list", () => {
    const page = paginateCatalog([], 1, 10);
    expect(page).toEqual({
      items: [],
      total: 0,
      page: 1,
      totalPages: 1,
      pageSize: 10,
    });
  });
});

describe("getFilterCounts", () => {
  it("counts each option independently of the same group's selection", () => {
    const counts = getFilterCounts(fixtures, EMPTY_FILTERS);
    expect(counts.family["Hormone Replacement"]).toBe(2);
    expect(counts.family["GLP-1"]).toBe(1);
    expect(counts.form.Injectable).toBe(2);
    expect(counts.form.Capsule).toBe(1);
    expect(counts.form.Cream).toBe(1);
  });

  it("respects sibling-group filters when computing counts", () => {
    const counts = getFilterCounts(fixtures, {
      ...EMPTY_FILTERS,
      form: ["Injectable"],
    });
    // Only `a` (Hormone Replacement) + `d` (GLP-1) are Injectables, so the
    // family counts should reflect that subset.
    expect(counts.family["Hormone Replacement"]).toBe(1);
    expect(counts.family["GLP-1"]).toBe(1);
    expect(counts.family["Numbing Creams"]).toBe(0);
  });

  it("ignores the same group when computing its own counts (otherwise selecting one zeros others)", () => {
    const counts = getFilterCounts(fixtures, {
      ...EMPTY_FILTERS,
      family: ["GLP-1"],
    });
    // Even though only GLP-1 is selected, we still want to surface that
    // Hormone Replacement has matches available.
    expect(counts.family["Hormone Replacement"]).toBe(2);
    expect(counts.family["GLP-1"]).toBe(1);
  });

  it("returns zeroes for options that have no matches under the current other-group filters", () => {
    const counts = getFilterCounts(fixtures, {
      ...EMPTY_FILTERS,
      brand: ["Commercial"],
    });
    // Only `c` is Commercial; it's a Numbing Cream → no Hormone Replacement.
    expect(counts.family["Hormone Replacement"]).toBe(0);
    expect(counts.family["Numbing Creams"]).toBe(1);
  });
});

describe("formatters", () => {
  it("formats prices as USD with 2 decimals", () => {
    expect(formatPrice(33.6)).toBe("$33.60");
    expect(formatPrice(1.5)).toBe("$1.50");
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("renders null as Not Available and undefined as em-dash", () => {
    expect(formatPrice(null)).toBe("Not Available");
    expect(formatPrice(undefined)).toBe("—");
  });

  it("formats ISO validity dates in en-US with UTC stability", () => {
    expect(formatValidityDate("2026-01-01")).toBe("January 1, 2026");
    expect(formatValidityDate("2026-12-31")).toBe("December 31, 2026");
  });

  it("falls back to the input when the date is unparseable", () => {
    expect(formatValidityDate("not-a-date")).toBe("not-a-date");
  });
});

describe("countActiveFilters / getFilterGroupLabel", () => {
  it("counts all multi-select pills (not q / page / sort / tier)", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(
      countActiveFilters({
        ...EMPTY_FILTERS,
        family: ["GLP-1"],
        brand: ["Logos RX"],
        area: ["Vitality", "Hormone Replacement"],
        form: ["Injectable"],
        q: "shouldnotcount",
        page: 4,
      }),
    ).toBe(5);
  });

  it("maps internal keys to human-readable labels", () => {
    expect(getFilterGroupLabel("family")).toBe("Product Family");
    expect(getFilterGroupLabel("area")).toBe("Therapeutic Area");
    expect(getFilterGroupLabel("form")).toBe("Dosage Form");
    expect(getFilterGroupLabel("brand")).toBe("Brand");
  });
});

describe("CATALOG_TIERS exhaustiveness", () => {
  it("contains exactly retail / provider / volume", () => {
    expect([...CATALOG_TIERS]).toEqual(["retail", "provider", "volume"]);
  });
});
