/**
 * Online catalog data + types + pure helpers.
 *
 * Mirrors the structure of competitor catalogs (e.g. Hallandale Pharmacy's
 * partner catalog at https://partner.hallandalerx.com/2025-catalog-discounted)
 * while staying friendly for non-developer editing: drop new rows into
 * `catalogProducts`, extend the taxonomy const arrays as needed, and the
 * `/catalog` page will pick them up on the next build.
 *
 * Design choices:
 *   - Three independent price tiers per product (Retail / Provider / Volume).
 *     Each tier is `number | null | undefined`. `null` renders as
 *     "Not Available"; `undefined` hides the cell as "—". This lets the user
 *     express both "we don't have this priced for this tier" and "this product
 *     simply doesn't sell at this tier" with intent.
 *   - Multi-valued taxonomies (productFamily, therapeuticAreas) use arrays so
 *     a single SKU can appear in multiple filter groups simultaneously.
 *   - All helpers are pure functions for trivial unit-testing.
 */

export type CatalogTier = "retail" | "provider" | "volume";

export const CATALOG_TIERS = ["retail", "provider", "volume"] as const;

export interface CatalogPricing {
  /** Retail / cash-pay price. */
  retail?: number | null;
  /** Verified-provider price (typical default tier for the table). */
  provider?: number | null;
  /** Bulk / high-volume contract price. */
  volume?: number | null;
}

export interface CatalogProduct {
  /**
   * Stable identifier. Used as React key and as the URL anchor (`#sku-…`)
   * for deep-linking from print pieces, emails, etc. Must be unique.
   *
   * Convention: lowercase kebab-case derived from the name + strength,
   * e.g. `"testosterone-cypionate-200mg-5ml"`.
   */
  id: string;

  /** Display name as shown in the table's first column. */
  name: string;

  /** Optional strength / concentration (e.g. `"200 mg/mL"`). */
  strength?: string;

  /** Dosage form — one of `DOSAGE_FORMS`. */
  form: (typeof DOSAGE_FORMS)[number];

  /** Unit of sale shown in the table (e.g. `"Each"`, `"30-count"`). Default `"Each"`. */
  unit?: string;

  /** Three-tier pricing. Any tier may be omitted or set to `null`. */
  pricing: CatalogPricing;

  /** Product families this SKU belongs to. Use any of `PRODUCT_FAMILIES`. */
  productFamily?: (typeof PRODUCT_FAMILIES)[number][];

  /** Brand / fulfillment partner — one of `BRANDS`. */
  brand?: (typeof BRANDS)[number];

  /** Therapeutic areas the product addresses. */
  therapeuticAreas?: (typeof THERAPEUTIC_AREAS)[number][];

  /**
   * Long-form description shown in a full-width sub-row beneath the SKU.
   * Use for products that need extra clinical / formulary context (e.g.
   * "Custom HRT Capsule — select from Testosterone, Progesterone, …").
   */
  details?: string;

  /** Optional badge to highlight a row ("New", "Limited", "Promo"). */
  badge?: string;
}

export interface CatalogConfig {
  /** Big heading at the top of the page (e.g. `"2026 Catalog"`). */
  title: string;

  /** Eyebrow above the title (e.g. `"Provider Pricing"`). */
  eyebrow: string;

  /** Pill below the title (e.g. `"DISCOUNTED"`, `"STANDARD"`). Optional. */
  pill?: string;

  /** Validity range, both inclusive, ISO `YYYY-MM-DD`. */
  validFrom: string;
  validTo: string;

  /** Disclaimer rendered below the validity range. */
  disclaimer: string;

  /** Human-readable label for each tier. Used in column headers + sort labels. */
  priceTierLabels: Record<CatalogTier, string>;

  /** Default tier highlighted in the table and used for price sorting. */
  defaultTier: CatalogTier;

  /** Column/label for the single published price shown on the public catalog. */
  basePriceLabel: string;

  /**
   * Note steering viewers to a sales rep for better pricing. Volume and
   * custom/preferred pricing are intentionally not published on the catalog.
   */
  salesNote: string;

  /** Rows per page. Default 50; the reference site uses ~34. */
  pageSize: number;

  /**
   * When false, the page emits `<meta name="robots" content="noindex, nofollow" />`
   * and `/catalog` is added to `robots.txt` Disallow. Pricing is competitive
   * intel, so the default is **false** (link-only access).
   */
  indexable: boolean;
}

/* ──────────────────────────── Taxonomies ──────────────────────────── */

/**
 * Top-level product families. Extend as the catalog grows. Order in this
 * array drives the rendering order of the filter sidebar group.
 */
export const PRODUCT_FAMILIES = [
  "GLP-1",
  "Hormone Replacement",
  "Weight Loss",
  "Longevity",
  "Peptide Therapy",
  "IV Therapy & Supplements",
  "Detox",
  "Vitamins",
  "Hair Loss",
  "Supportive Care",
  "Wellness",
  "Numbing Creams",
  "Custom Compound",
] as const;

/** Brands / fulfillment partners. */
export const BRANDS = ["Logos RX", "Commercial", "FedEx"] as const;

/** Therapeutic areas the catalog covers. */
export const THERAPEUTIC_AREAS = [
  "Hormone Replacement",
  "Weight Loss",
  "Weight Management",
  "Longevity",
  "Peptide Therapy",
  "IV Therapy & Supplements",
  "Detox",
  "Vitamins",
  "Vitality",
  "Sexual Wellness",
  "Fertility",
  "Thyroid",
  "Dermatology",
  "Supportive Care",
  "Wellness",
  "Injectable Supplies",
  "Shipping",
] as const;

/** Dosage forms. */
export const DOSAGE_FORMS = [
  "Injectable",
  "Capsule",
  "Tablet",
  "Troche",
  "Oral Drops",
  "Oral Suspension",
  "Lollipop",
  "Ointment",
  "Cream",
  "Gel",
  "Shampoo",
  "Conditioner",
  "Serum",
  "Foam",
  "Nasal Spray",
  "Eye Drops",
  "Transdermal Patch",
  "Suppository",
  "Supplies",
] as const;

/** Filter groups, in the order they're rendered in the sidebar. */
export const FILTER_GROUPS = [
  { key: "family", label: "Product Family", options: PRODUCT_FAMILIES },
  { key: "brand", label: "Brand", options: BRANDS },
  { key: "area", label: "Therapeutic Area", options: THERAPEUTIC_AREAS },
  { key: "form", label: "Dosage Form", options: DOSAGE_FORMS },
] as const;

export type FilterGroupKey = (typeof FILTER_GROUPS)[number]["key"];

/* ──────────────────────────── Config ──────────────────────────── */

export const CATALOG_CONFIG: CatalogConfig = {
  title: "2026 Catalog",
  eyebrow: "Compounded medications",
  pill: "Provider Pricing",
  validFrom: "2026-01-01",
  validTo: "2026-12-31",
  disclaimer:
    "Commercial product pricing is subject to change without prior notice due to market fluctuations and availability. Prices shown are for licensed healthcare providers only. Patients should consult their provider for personalized pricing.",
  priceTierLabels: {
    retail: "Retail",
    provider: "Provider",
    volume: "Volume",
  },
  defaultTier: "provider",
  basePriceLabel: "Base price",
  salesNote:
    "Contact your Logos sales rep for volume and custom preferred pricing.",
  pageSize: 50,
  indexable: false,
};

/* ──────────────────────────── Data ──────────────────────────── */

/**
 * Live catalog. Append new SKUs by following the existing pattern.
 *
 * Editor's checklist:
 *   - `id` must be unique, lowercase, kebab-case, URL-safe (no spaces, `+`,
 *     `/`, etc.). Pattern in use: `<drug>-<strength>-<vial-size>` with an
 *     optional `-v2` suffix when two SKUs share the same drug + strength +
 *     size but differ in price or fulfillment partner.
 *   - `strength` is the per-mL concentration (e.g. `"2.5 mg/mL"`).
 *   - `pricing` accepts `number`, `null` ("Not Available"), or `undefined`
 *     ("—" / cell hidden).
 */
export const catalogProducts: CatalogProduct[] = [
  // ── Hormone Replacement ──
  {
    id: "testosterone-cypionate-200mg-5ml",
    name: "Testosterone Cypionate (Grape Seed Oil) 5 mL",
    strength: "200 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 30, provider: 25, volume: 20 },
    productFamily: ["Hormone Replacement"],
    brand: "Logos RX",
    therapeuticAreas: ["Hormone Replacement"],
  },
  {
    id: "pregnyl-hcg-10000iu",
    name: "Pregnyl HCG 10,000ui",
    strength: "10,000 IU",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 250, provider: 225, volume: null },
    productFamily: ["Hormone Replacement"],
    brand: "Logos RX",
    therapeuticAreas: ["Hormone Replacement"],
  },

  // ── Weight Loss — Semaglutide / Glycine ──
  {
    id: "semaglutide-glycine-2.5mg-1ml",
    name: "Semaglutide / Glycine 2.5mg/1mL",
    strength: "2.5 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 55, provider: 45, volume: null },
    productFamily: ["Weight Loss", "GLP-1"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Loss"],
  },
  {
    id: "semaglutide-glycine-2.5mg-2ml",
    name: "Semaglutide / Glycine 2.5mg/2mL",
    strength: "2.5 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 65, provider: 50, volume: null },
    productFamily: ["Weight Loss", "GLP-1"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Loss"],
  },
  {
    id: "semaglutide-glycine-2.5mg-3ml",
    name: "Semaglutide / Glycine 2.5mg/3mL",
    strength: "2.5 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 75, provider: 60, volume: null },
    productFamily: ["Weight Loss", "GLP-1"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Loss"],
  },
  {
    id: "semaglutide-glycine-5mg-2ml",
    name: "Semaglutide / Glycine 5mg/2mL",
    strength: "5 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 85, provider: 70, volume: null },
    productFamily: ["Weight Loss", "GLP-1"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Loss"],
  },
  {
    id: "semaglutide-glycine-2.5mg-5ml",
    name: "Semaglutide / Glycine 2.5mg/5mL",
    strength: "2.5 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 90, provider: 75, volume: null },
    productFamily: ["Weight Loss", "GLP-1"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Loss"],
  },

  // ── Weight Loss — Tirzepatide / Glycine ──
  {
    id: "tirzepatide-glycine-10mg-1ml",
    name: "Tirzepatide / Glycine 10mg/1mL",
    strength: "10 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 80, provider: 60, volume: null },
    productFamily: ["Weight Loss", "GLP-1"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Loss"],
  },
  {
    id: "tirzepatide-glycine-10mg-2ml",
    name: "Tirzepatide / Glycine 10mg/2mL",
    strength: "10 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 100, provider: 80, volume: null },
    productFamily: ["Weight Loss", "GLP-1"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Loss"],
  },
  {
    id: "tirzepatide-glycine-10mg-3ml",
    name: "Tirzepatide / Glycine 10mg/3mL",
    strength: "10 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 120, provider: 100, volume: null },
    productFamily: ["Weight Loss", "GLP-1"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Loss"],
  },
  {
    id: "tirzepatide-glycine-10mg-4ml",
    name: "Tirzepatide / Glycine 10mg/4mL",
    strength: "10 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 160, provider: 140, volume: null },
    productFamily: ["Weight Loss", "GLP-1"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Loss"],
  },
  {
    id: "tirzepatide-glycine-30mg-2ml",
    name: "Tirzepatide / Glycine 30mg/2mL",
    strength: "30 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 180, provider: 160, volume: null },
    productFamily: ["Weight Loss", "GLP-1"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Loss"],
  },

  // ── Longevity ──
  {
    id: "nad-plus-100mg-5ml",
    name: "NAD+ 100mg/5mL",
    strength: "100 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 100, provider: 85, volume: null },
    productFamily: ["Longevity", "IV Therapy & Supplements"],
    brand: "Logos RX",
    therapeuticAreas: ["Longevity", "IV Therapy & Supplements"],
  },

  // ── Peptide Therapy ──
  {
    id: "sermorelin-10mg-5ml",
    name: "Sermorelin 10mg/5mL",
    strength: "2 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 100, provider: 85, volume: null },
    productFamily: ["Peptide Therapy"],
    brand: "Logos RX",
    therapeuticAreas: ["Peptide Therapy"],
  },
  {
    id: "bpc-157-2.5mg-4ml",
    name: "BPC-157 2.5mg/4mL",
    strength: "2.5 mg/4 mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 100, provider: 85, volume: null },
    productFamily: ["Peptide Therapy"],
    brand: "Logos RX",
    therapeuticAreas: ["Peptide Therapy"],
  },
  {
    id: "tesamorelin-5mg-4ml",
    name: "Tesamorelin 5mg/4mL",
    strength: "5 mg/4 mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 140, provider: 120, volume: null },
    productFamily: ["Peptide Therapy"],
    brand: "Logos RX",
    therapeuticAreas: ["Peptide Therapy"],
  },
  // ── Detox ──
  {
    id: "glutathione-200mg-5ml",
    name: "Glutathione 200mg/5mL",
    strength: "200 mg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 50, provider: 40, volume: null },
    productFamily: ["Detox"],
    brand: "Logos RX",
    therapeuticAreas: ["Detox"],
  },

  // ── Vitamins ──
  {
    id: "cyanocobalamin-b12-10000mcg",
    name: "Cyanocobalamin (B12) 10,000mcg",
    strength: "1,000 mcg/mL",
    form: "Injectable",
    unit: "Each",
    pricing: { retail: 35, provider: 30, volume: null },
    productFamily: ["Vitamins"],
    brand: "Logos RX",
    therapeuticAreas: ["Vitamins"],
  },

  // ── Hormone Replacement — Oral ──
  // Pricing intentionally left blank ("—") so an admin sets it in /admin/catalog.
  {
    id: "anastrozole-0.25mg",
    name: "Anastrozole 0.25mg",
    strength: "0.25 mg",
    form: "Tablet",
    unit: "Each",
    pricing: {},
    productFamily: ["Hormone Replacement"],
    brand: "Logos RX",
    therapeuticAreas: ["Hormone Replacement"],
  },
  {
    id: "anastrozole-0.5mg",
    name: "Anastrozole 0.5mg",
    strength: "0.5 mg",
    form: "Tablet",
    unit: "Each",
    pricing: {},
    productFamily: ["Hormone Replacement"],
    brand: "Logos RX",
    therapeuticAreas: ["Hormone Replacement"],
  },
  {
    id: "anastrozole-1mg",
    name: "Anastrozole 1mg",
    strength: "1 mg",
    form: "Tablet",
    unit: "Each",
    pricing: {},
    productFamily: ["Hormone Replacement"],
    brand: "Logos RX",
    therapeuticAreas: ["Hormone Replacement"],
  },
  {
    id: "enclomiphene-citrate-25mg",
    name: "Enclomiphene Citrate 25mg",
    strength: "25 mg",
    form: "Capsule",
    unit: "Each",
    pricing: {},
    productFamily: ["Hormone Replacement"],
    brand: "Logos RX",
    therapeuticAreas: ["Hormone Replacement"],
  },
  {
    id: "enclomiphene-citrate-50mg",
    name: "Enclomiphene Citrate 50mg",
    strength: "50 mg",
    form: "Capsule",
    unit: "Each",
    pricing: {},
    productFamily: ["Hormone Replacement"],
    brand: "Logos RX",
    therapeuticAreas: ["Hormone Replacement"],
  },

  // ── Weight Loss — Oral ──
  {
    id: "metformin-500mg",
    name: "Metformin 500mg",
    strength: "500 mg",
    form: "Tablet",
    unit: "Each",
    pricing: {},
    productFamily: ["Weight Loss"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Management"],
  },
  {
    id: "metformin-850mg",
    name: "Metformin 850mg",
    strength: "850 mg",
    form: "Tablet",
    unit: "Each",
    pricing: {},
    productFamily: ["Weight Loss"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Management"],
  },
  {
    id: "metformin-1000mg",
    name: "Metformin 1,000mg",
    strength: "1,000 mg",
    form: "Tablet",
    unit: "Each",
    pricing: {},
    productFamily: ["Weight Loss"],
    brand: "Logos RX",
    therapeuticAreas: ["Weight Management"],
  },

  // ── Supportive Care ──
  {
    id: "ondansetron-4mg",
    name: "Ondansetron 4mg",
    strength: "4 mg",
    form: "Tablet",
    unit: "Each",
    pricing: {},
    productFamily: ["Supportive Care"],
    brand: "Logos RX",
    therapeuticAreas: ["Supportive Care"],
  },

  // ── Wellness ──
  {
    id: "low-dose-naltrexone-1.5mg",
    name: "Low-Dose Naltrexone 1.5mg",
    strength: "1.5 mg",
    form: "Capsule",
    unit: "Each",
    pricing: {},
    productFamily: ["Wellness"],
    brand: "Logos RX",
    therapeuticAreas: ["Wellness"],
  },
  {
    id: "low-dose-naltrexone-3mg",
    name: "Low-Dose Naltrexone 3mg",
    strength: "3 mg",
    form: "Capsule",
    unit: "Each",
    pricing: {},
    productFamily: ["Wellness"],
    brand: "Logos RX",
    therapeuticAreas: ["Wellness"],
  },
  {
    id: "low-dose-naltrexone-4.5mg",
    name: "Low-Dose Naltrexone 4.5mg",
    strength: "4.5 mg",
    form: "Capsule",
    unit: "Each",
    pricing: {},
    productFamily: ["Wellness"],
    brand: "Logos RX",
    therapeuticAreas: ["Wellness"],
  },

  // ── Hair Loss / Dermatology ──
  {
    id: "minoxidil-2.5mg",
    name: "Minoxidil 2.5mg",
    strength: "2.5 mg",
    form: "Tablet",
    unit: "Each",
    pricing: {},
    productFamily: ["Hair Loss"],
    brand: "Logos RX",
    therapeuticAreas: ["Dermatology"],
  },
  {
    id: "finasteride-1mg",
    name: "Finasteride 1mg",
    strength: "1 mg",
    form: "Tablet",
    unit: "Each",
    pricing: {},
    productFamily: ["Hair Loss"],
    brand: "Commercial",
    therapeuticAreas: ["Dermatology"],
  },
];

/* ──────────────────────────── Search-param parsing ──────────────────────────── */

export interface CatalogFilters {
  q: string;
  family: (typeof PRODUCT_FAMILIES)[number][];
  brand: (typeof BRANDS)[number][];
  area: (typeof THERAPEUTIC_AREAS)[number][];
  form: (typeof DOSAGE_FORMS)[number][];
  page: number;
  sort: CatalogSort;
  tier: CatalogTier;
}

export type CatalogSort = "name" | "price-asc" | "price-desc";

const CATALOG_SORTS: readonly CatalogSort[] = ["name", "price-asc", "price-desc"];

export const EMPTY_FILTERS: CatalogFilters = {
  q: "",
  family: [],
  brand: [],
  area: [],
  form: [],
  page: 1,
  sort: "name",
  tier: CATALOG_CONFIG.defaultTier,
};

/** Coerce a raw search-param value into a flat array of strings. */
function toStringArray(
  raw: string | string[] | undefined,
  allowed: readonly string[],
): string[] {
  if (raw === undefined) return [];
  const flattened = Array.isArray(raw) ? raw : raw.split(",");
  const allowedSet = new Set(allowed);
  return Array.from(
    new Set(
      flattened
        .map((v) => v.trim())
        .filter((v) => v.length > 0 && allowedSet.has(v)),
    ),
  );
}

function toIntInRange(
  raw: string | string[] | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

function toEnum<T extends string>(
  raw: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return fallback;
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/**
 * Parse Next.js `searchParams` (the already-awaited plain object) into a
 * strongly-typed `CatalogFilters`. Unknown / invalid values are silently
 * dropped so a hand-crafted URL can never crash the page.
 */
export function parseCatalogSearchParams(
  raw: Record<string, string | string[] | undefined> | undefined,
): CatalogFilters {
  const params = raw ?? {};
  const qRaw = params.q;
  const q = (Array.isArray(qRaw) ? qRaw[0] : qRaw)?.trim() ?? "";

  return {
    q: q.slice(0, 100),
    family: toStringArray(params.family, PRODUCT_FAMILIES) as CatalogFilters["family"],
    brand: toStringArray(params.brand, BRANDS) as CatalogFilters["brand"],
    area: toStringArray(params.area, THERAPEUTIC_AREAS) as CatalogFilters["area"],
    form: toStringArray(params.form, DOSAGE_FORMS) as CatalogFilters["form"],
    page: toIntInRange(params.page, 1, 9999, 1),
    sort: toEnum(params.sort, CATALOG_SORTS, "name"),
    tier: toEnum(params.tier, CATALOG_TIERS, CATALOG_CONFIG.defaultTier),
  };
}

/**
 * Inverse of `parseCatalogSearchParams`: serialize filters into a URL query
 * string with stable key order. Defaults are omitted so the URL stays clean.
 */
export function serializeCatalogSearchParams(
  filters: Partial<CatalogFilters>,
): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.family?.length) sp.set("family", filters.family.join(","));
  if (filters.brand?.length) sp.set("brand", filters.brand.join(","));
  if (filters.area?.length) sp.set("area", filters.area.join(","));
  if (filters.form?.length) sp.set("form", filters.form.join(","));
  if (filters.sort && filters.sort !== "name") sp.set("sort", filters.sort);
  if (filters.tier && filters.tier !== CATALOG_CONFIG.defaultTier) {
    sp.set("tier", filters.tier);
  }
  if (filters.page && filters.page > 1) sp.set("page", String(filters.page));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Toggle a single value within a multi-select filter group. Returns a new
 * `CatalogFilters` (immutable). Always resets `page` to 1 because the new
 * filter set will most likely change the result count.
 */
export function toggleFilterValue(
  filters: CatalogFilters,
  group: FilterGroupKey,
  value: string,
): CatalogFilters {
  const current = filters[group] as readonly string[];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  return { ...filters, [group]: next, page: 1 } as CatalogFilters;
}

/* ──────────────────────────── Filtering / sorting / paginating ──────────────────────────── */

/**
 * AND across groups, OR within a group. A product passes when:
 *   - search query matches name OR strength OR details (case-insensitive), AND
 *   - one of the selected families overlaps the product's families, AND
 *   - the product brand is in the selected brands, AND
 *   - one of the selected areas overlaps the product's areas, AND
 *   - the product form is in the selected forms.
 *
 * Empty filter groups are treated as "no constraint".
 */
export function filterCatalog(
  products: readonly CatalogProduct[],
  filters: Pick<CatalogFilters, "q" | "family" | "brand" | "area" | "form">,
): CatalogProduct[] {
  const needle = filters.q.trim().toLowerCase();
  const familySet = filters.family.length ? new Set<string>(filters.family) : null;
  const brandSet = filters.brand.length ? new Set<string>(filters.brand) : null;
  const areaSet = filters.area.length ? new Set<string>(filters.area) : null;
  const formSet = filters.form.length ? new Set<string>(filters.form) : null;

  return products.filter((p) => {
    if (needle) {
      const hay = `${p.name} ${p.strength ?? ""} ${p.details ?? ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    if (familySet) {
      const fams = p.productFamily ?? [];
      if (!fams.some((f) => familySet.has(f))) return false;
    }
    if (brandSet) {
      if (!p.brand || !brandSet.has(p.brand)) return false;
    }
    if (areaSet) {
      const areas = p.therapeuticAreas ?? [];
      if (!areas.some((a) => areaSet.has(a))) return false;
    }
    if (formSet) {
      if (!formSet.has(p.form)) return false;
    }
    return true;
  });
}

/**
 * Sort by name (locale-aware) or by the price of a tier. Products with a
 * missing / null price for the selected tier sort to the end of the list
 * regardless of direction so the table never opens with "Not Available" rows.
 */
export function sortCatalog(
  products: readonly CatalogProduct[],
  sort: CatalogSort,
): CatalogProduct[] {
  const arr = [...products];
  if (sort === "name") {
    return arr.sort((a, b) => a.name.localeCompare(b.name, "en"));
  }
  const direction = sort === "price-asc" ? 1 : -1;
  return arr.sort((a, b) => {
    const av = baseCatalogPrice(a);
    const bv = baseCatalogPrice(b);
    const aMissing = av === undefined || av === null;
    const bMissing = bv === undefined || bv === null;
    if (aMissing && bMissing) return a.name.localeCompare(b.name, "en");
    if (aMissing) return 1;
    if (bMissing) return -1;
    if (av === bv) return a.name.localeCompare(b.name, "en");
    return (av - bv) * direction;
  });
}

export interface CatalogPage<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

export function paginateCatalog<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): CatalogPage<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    totalPages,
    pageSize,
  };
}

/**
 * For each option in each filter group, count how many products would match
 * if that option were toggled on, holding the *other* groups constant. This
 * is the standard faceted-search pattern: filter counts within a group must
 * not be coupled to that same group's current selection, or selecting one
 * option zeros out the others.
 */
export function getFilterCounts(
  products: readonly CatalogProduct[],
  filters: CatalogFilters,
): Record<FilterGroupKey, Record<string, number>> {
  const result: Record<FilterGroupKey, Record<string, number>> = {
    family: {},
    brand: {},
    area: {},
    form: {},
  };

  for (const { key, options } of FILTER_GROUPS) {
    const others: Pick<CatalogFilters, "q" | "family" | "brand" | "area" | "form"> = {
      q: filters.q,
      family: key === "family" ? [] : filters.family,
      brand: key === "brand" ? [] : filters.brand,
      area: key === "area" ? [] : filters.area,
      form: key === "form" ? [] : filters.form,
    };
    const subset = filterCatalog(products, others);
    for (const option of options) {
      // The `options` array per group is typed narrowly to that group's
      // value union, but in this loop we mix groups, so we cast to string
      // once and compare against the (already-string) product values.
      const opt = option as string;
      result[key][opt] = subset.reduce((acc, p) => {
        switch (key) {
          case "family":
            return ((p.productFamily ?? []) as readonly string[]).includes(opt)
              ? acc + 1
              : acc;
          case "brand":
            return p.brand === opt ? acc + 1 : acc;
          case "area":
            return ((p.therapeuticAreas ?? []) as readonly string[]).includes(opt)
              ? acc + 1
              : acc;
          case "form":
            return (p.form as string) === opt ? acc + 1 : acc;
        }
      }, 0);
    }
  }

  return result;
}

/* ──────────────────────────── Formatters ──────────────────────────── */

const PRICE_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * The "standard" price a clinic pays for a SKU: the provider tier, falling back
 * to retail when provider isn't set. Returns `null` when neither is a number
 * (e.g. priced as "Not Available"). Used to seed per-clinic pricing sheets.
 */
export function standardCatalogPrice(p: CatalogProduct): number | null {
  const { provider, retail } = p.pricing;
  if (typeof provider === "number") return provider;
  if (typeof retail === "number") return retail;
  return null;
}

/**
 * The single "base" price published on the public catalog: the highest tier we
 * have on file — retail, falling back to provider, then volume. Returns
 * `undefined`/`null` (rendered as "—"/"Not Available") when no tier is priced.
 *
 * Volume and custom/preferred pricing are intentionally NOT published; viewers
 * are directed to a sales rep instead (see `CATALOG_CONFIG.salesNote`).
 */
export function baseCatalogPrice(
  p: CatalogProduct,
): number | null | undefined {
  const { retail, provider, volume } = p.pricing;
  return retail ?? provider ?? volume;
}

/** Format a price cell. `null` → "Not Available", `undefined` → "—". */
export function formatPrice(value: number | null | undefined): string {
  if (value === undefined) return "—";
  if (value === null) return "Not Available";
  return PRICE_FORMATTER.format(value);
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Format an ISO `YYYY-MM-DD` as `January 1, 2026`. UTC to avoid TZ drift. */
export function formatValidityDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return DATE_FORMATTER.format(date);
}

/**
 * `"family"` → `"Product Family"`. Pulled from `FILTER_GROUPS` so the source
 * of truth stays in one place.
 */
export function getFilterGroupLabel(key: FilterGroupKey): string {
  return FILTER_GROUPS.find((g) => g.key === key)?.label ?? key;
}

/** Total active filter pills (excludes `q` / `page` / `sort` / `tier`). */
export function countActiveFilters(filters: CatalogFilters): number {
  return (
    filters.family.length +
    filters.brand.length +
    filters.area.length +
    filters.form.length
  );
}

/* ──────────────────────────── Detail-page linking ──────────────────────────── */

/**
 * Map a catalog SKU `id` onto a product detail-page slug.
 *
 * Catalog SKU ids are variant-level (e.g. `"semaglutide-glycine-2.5mg-1ml"`),
 * while detail pages are product-level (`"semaglutide-glycine"`). A SKU links
 * to a detail page when a known slug is an exact match or a hyphen-bounded
 * prefix of the SKU id. When several slugs match (e.g. `"nad"` and
 * `"nad-plus"`), the longest wins so the most specific page is chosen.
 *
 * Hyphen-bounded matching prevents false positives like `"semaglutide"`
 * matching `"semaglutide-glycine"`-only ids when an unrelated
 * `"semaglutidexyz"` slug exists.
 *
 * Pure + dependency-free (slugs are injected) so it stays trivially testable
 * and avoids a `catalog.ts` → `products.ts` import cycle.
 */
export function resolveDetailSlug(
  catalogId: string,
  knownSlugs: readonly string[],
): string | undefined {
  let best: string | undefined;
  for (const slug of knownSlugs) {
    if (catalogId === slug || catalogId.startsWith(`${slug}-`)) {
      if (best === undefined || slug.length > best.length) best = slug;
    }
  }
  return best;
}
