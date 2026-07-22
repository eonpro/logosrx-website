/**
 * Native web catalog ("the book") — page manifest + pure pricing helpers.
 *
 * This file is the single source of truth for the order and content of the
 * online 2026 catalog at `/download/catalog/view`. It mirrors the printed
 * 32-page book, but every
 * page is real HTML composed from `products.ts` / `learning.ts` — not a page
 * scan. To add, remove, or reorder pages, edit `CATALOG_BOOK_PAGES`.
 *
 * Page kinds:
 *   - `static`  → one-off layouts (cover, intro, back matter) rendered by the
 *                 component keyed in `catalog-book/pages/static`.
 *   - `product` → a product spread driven by a `products.ts` slug, with live
 *                 suggested-retail pricing for the listed catalog SKU ids.
 *   - `dosage`  → an insulin-syringe dosage explainer from `learning.ts`.
 *
 * Pricing itself is NOT stored here — it's read live from `catalog_products`
 * (retail tier) and joined via `buildBookPriceIndex`, so /admin/catalog edits
 * show up in the book immediately.
 */

import type { CatalogProduct } from "@/data/catalog";

/* ──────────────────────────── Types ──────────────────────────── */

/** One-off page layouts, each mapped to a dedicated component. */
export const STATIC_PAGE_IDS = [
  "cover",
  "welcome",
  "excellence",
  "facility",
  "our-products",
  "glp1-overview",
  "lifefile",
  "peptides-teaser",
  "white-label",
  "shipping",
  "states",
  "vial-fill",
  "back-cover",
] as const;

export type StaticPageId = (typeof STATIC_PAGE_IDS)[number];

interface BookPageBase {
  /**
   * Stable, URL-safe page id. Doubles as the hash deep link
   * (`/download/catalog/view?key=…#semaglutide`) and the React key.
   */
  id: string;
  /** Label in the table of contents. Pages without one are still reachable. */
  tocLabel?: string;
  /** TOC section header the entry is grouped under. */
  tocGroup?: string;
}

export interface StaticBookPage extends BookPageBase {
  kind: "static";
  staticId: StaticPageId;
}

export interface ProductBookPage extends BookPageBase {
  kind: "product";
  /** `products.ts` slug that drives the page content. */
  slug: string;
  /**
   * Catalog SKU ids (from `catalog_products`) whose retail prices are shown
   * in the page's "Suggested Retail" block. Empty → block hidden.
   */
  skuIds: readonly string[];
  /**
   * Book-only hero image override (e.g. the print catalog's photography)
   * when the sitewide product image doesn't read well on the page.
   */
  image?: string;
  imageAlt?: string;
}

export interface DosageBookPage extends BookPageBase {
  kind: "dosage";
  /** `learning.ts` article slug. */
  articleSlug: string;
}

export type BookPage = StaticBookPage | ProductBookPage | DosageBookPage;

/* ──────────────────────────── Manifest ──────────────────────────── */

const INTRO = "Introduction";
const WEIGHT = "GLP-1 & Weight Management";
const INJECTABLES = "Injectables";
const ORALS = "Oral Treatments";
const RESOURCES = "Resources";

export const CATALOG_BOOK_PAGES: readonly BookPage[] = [
  { kind: "static", id: "cover", staticId: "cover", tocLabel: "Cover", tocGroup: INTRO },
  { kind: "static", id: "welcome", staticId: "welcome", tocLabel: "Welcome", tocGroup: INTRO },
  { kind: "static", id: "excellence", staticId: "excellence", tocLabel: "Compounding Excellence", tocGroup: INTRO },
  { kind: "static", id: "facility", staticId: "facility", tocLabel: "Our Facility", tocGroup: INTRO },
  { kind: "static", id: "our-products", staticId: "our-products", tocLabel: "Our Products", tocGroup: INTRO },

  { kind: "static", id: "glp1", staticId: "glp1-overview", tocLabel: "GLP-1 Overview", tocGroup: WEIGHT },
  {
    kind: "product",
    id: "semaglutide",
    slug: "semaglutide-glycine",
    tocLabel: "Semaglutide + Glycine",
    tocGroup: WEIGHT,
    skuIds: [
      "semaglutide-glycine-2.5mg-1ml",
      "semaglutide-glycine-2.5mg-2ml",
      "semaglutide-glycine-2.5mg-3ml",
      "semaglutide-glycine-5mg-2ml",
      "semaglutide-glycine-2.5mg-5ml",
    ],
  },
  { kind: "dosage", id: "semaglutide-dosage", articleSlug: "semaglutide-dosage", tocLabel: "Semaglutide Dosage", tocGroup: WEIGHT },
  {
    kind: "product",
    id: "tirzepatide",
    slug: "tirzepatide-glycine",
    tocLabel: "Tirzepatide + Glycine",
    tocGroup: WEIGHT,
    skuIds: [
      "tirzepatide-glycine-10mg-1ml",
      "tirzepatide-glycine-10mg-2ml",
      "tirzepatide-glycine-10mg-3ml",
      "tirzepatide-glycine-10mg-4ml",
      "tirzepatide-glycine-30mg-2ml",
    ],
  },
  { kind: "dosage", id: "tirzepatide-dosage", articleSlug: "tirzepatide-dosage", tocLabel: "Tirzepatide Dosage", tocGroup: WEIGHT },

  { kind: "static", id: "lifefile", staticId: "lifefile", tocLabel: "LifeFile Technology", tocGroup: INTRO },

  { kind: "product", id: "nad-plus", slug: "nad-plus", tocLabel: "NAD+", tocGroup: INJECTABLES, skuIds: ["nad-plus-100mg-5ml"] },
  { kind: "product", id: "sermorelin", slug: "sermorelin", tocLabel: "Sermorelin", tocGroup: INJECTABLES, skuIds: ["sermorelin-10mg-5ml"] },
  { kind: "product", id: "testosterone", slug: "testosterone-cypionate", tocLabel: "Testosterone Cypionate", tocGroup: INJECTABLES, skuIds: ["testosterone-cypionate-200mg-5ml"] },
  { kind: "product", id: "glutathione", slug: "glutathione", tocLabel: "Glutathione", tocGroup: INJECTABLES, skuIds: ["glutathione-200mg-5ml"] },
  { kind: "product", id: "pregnyl", slug: "pregnyl-hcg", tocLabel: "Pregnyl HCG", tocGroup: INJECTABLES, skuIds: ["pregnyl-hcg-10000iu"] },
  { kind: "product", id: "bpc-157", slug: "bpc-157", tocLabel: "BPC-157", tocGroup: INJECTABLES, skuIds: ["bpc-157-2.5mg-4ml"] },

  { kind: "product", id: "ondansetron", slug: "ondansetron", tocLabel: "Ondansetron", tocGroup: ORALS, skuIds: ["ondansetron-4mg"] },
  {
    kind: "product",
    id: "enclomiphene",
    slug: "enclomiphene-citrate",
    tocLabel: "Enclomiphene Citrate",
    tocGroup: ORALS,
    skuIds: ["enclomiphene-citrate-25mg", "enclomiphene-citrate-50mg"],
  },
  {
    kind: "product",
    id: "anastrozole",
    slug: "anastrozole",
    tocLabel: "Anastrozole",
    tocGroup: ORALS,
    skuIds: ["anastrozole-0.25mg", "anastrozole-0.5mg", "anastrozole-1mg"],
  },
  {
    kind: "product",
    id: "metformin",
    slug: "metformin",
    tocLabel: "Metformin",
    tocGroup: ORALS,
    skuIds: ["metformin-500mg", "metformin-850mg", "metformin-1000mg"],
    // The white-on-white pill render is illegible on the page; use the print
    // catalog's photograph instead.
    image: "/images/catalog-book/metformin-hand.webp",
    imageAlt: "A hand holding a Metformin oral tablet",
  },
  { kind: "product", id: "finasteride", slug: "finasteride", tocLabel: "Finasteride", tocGroup: ORALS, skuIds: ["finasteride-1mg"] },
  { kind: "product", id: "minoxidil", slug: "minoxidil", tocLabel: "Minoxidil", tocGroup: ORALS, skuIds: ["minoxidil-2.5mg"] },
  {
    kind: "product",
    id: "low-dose-naltrexone",
    slug: "low-dose-naltrexone",
    tocLabel: "Low-Dose Naltrexone",
    tocGroup: ORALS,
    skuIds: ["low-dose-naltrexone-1.5mg", "low-dose-naltrexone-3mg", "low-dose-naltrexone-4.5mg"],
  },

  { kind: "static", id: "peptides", staticId: "peptides-teaser", tocLabel: "Peptide Therapies (Coming Soon)", tocGroup: INJECTABLES },
  { kind: "product", id: "cyanocobalamin-b12", slug: "cyanocobalamin-b12", tocLabel: "Cyanocobalamin (B12)", tocGroup: INJECTABLES, skuIds: ["cyanocobalamin-b12-10000mcg"] },
  {
    kind: "product",
    id: "tadalafil",
    slug: "tadalafil",
    tocLabel: "Tadalafil",
    tocGroup: ORALS,
    skuIds: [],
    // The framed screenshot-style asset reads badly on the page; use the
    // print catalog's capsule photograph.
    image: "/images/catalog-book/tadalafil-capsule.webp",
    imageAlt: "A Logos RX Tadalafil 5mg capsule",
  },

  { kind: "static", id: "white-label", staticId: "white-label", tocLabel: "White-Label Packaging", tocGroup: RESOURCES },
  { kind: "static", id: "shipping", staticId: "shipping", tocLabel: "Shipping & Packaging", tocGroup: RESOURCES },
  { kind: "static", id: "states", staticId: "states", tocLabel: "State Licenses", tocGroup: RESOURCES },
  { kind: "static", id: "vial-fill", staticId: "vial-fill", tocLabel: "Vial Fill Amounts", tocGroup: RESOURCES },
  { kind: "static", id: "back-cover", staticId: "back-cover", tocLabel: "Contact", tocGroup: RESOURCES },
];

/* ──────────────────────────── Pricing ──────────────────────────── */

/** One suggested-retail row on a product page. */
export interface BookPriceItem {
  /** Catalog SKU id. */
  id: string;
  /** Full SKU display name, e.g. "Semaglutide / Glycine 2.5mg/1mL". */
  name: string;
  strength?: string;
  unit?: string;
  /** Retail-tier price, or `null` when not priced (renders "Contact rep"). */
  retail: number | null;
}

/**
 * Index the live catalog products by SKU id for O(1) lookups from product
 * pages. Only the fields the book renders are kept.
 */
export function buildBookPriceIndex(
  products: readonly CatalogProduct[],
): Record<string, BookPriceItem> {
  const out: Record<string, BookPriceItem> = {};
  for (const p of products) {
    const item: BookPriceItem = {
      id: p.id,
      name: p.name,
      retail: typeof p.pricing.retail === "number" ? p.pricing.retail : null,
    };
    if (p.strength) item.strength = p.strength;
    if (p.unit) item.unit = p.unit;
    out[p.id] = item;
  }
  return out;
}

/** Resolve a page's SKU ids against the price index, skipping unknown ids. */
export function resolveBookPrices(
  skuIds: readonly string[],
  index: Record<string, BookPriceItem>,
): BookPriceItem[] {
  const items: BookPriceItem[] = [];
  for (const id of skuIds) {
    const item = index[id];
    if (item) items.push(item);
  }
  return items;
}
