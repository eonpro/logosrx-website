/**
 * Product catalog — single source of truth for the marketing surface.
 *
 * The schema is intentionally rich: each entry holds everything needed to
 * render the Hims-style `/products/[slug]` detail page (hero, ingredient
 * highlights, how-to-take, variant table, titration schedule, FAQ, CTA)
 * AND the legacy `<ProductCard>` / `<FeaturedProducts>` tile on the home
 * page. Backwards-compatible fields (`concentration`, `form`, `size`,
 * `image`, `activeIngredient`, `details`) keep the existing tile components
 * happy without any refactor on their side.
 *
 * Editor notes:
 *   - Drop new entries at the bottom of the `products` array.
 *   - Image is optional in v1; the page falls back to a gradient vial
 *     placeholder. Once a real photo lands at
 *     `/public/images/products/<slug>.webp`, set `image` to that path and
 *     the hero / card will pick it up.
 *   - `variants` + `variantColumns` drive the "Product Details" table —
 *     the renderer iterates `variantColumns` and pulls the matching key
 *     from each variant row, so cells stay aligned regardless of category.
 *   - `dosageSchedule.columns` works the same way for the titration table.
 *   - Add new therapeutic areas to `THERAPEUTIC_AREAS` (also drives the
 *     home-page filter pills). Keep `"All Products"` as the lead entry.
 */

/* ───────────────────────── Taxonomy ───────────────────────── */

/** Top-level dosage form. Drives the hero eyebrow and badge color tones. */
export type ProductCategoryKey = "Injectable" | "Oral Tablets" | "Oral Capsules";

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategoryKey, string> = {
  Injectable: "Injectable",
  "Oral Tablets": "Oral Tablets",
  "Oral Capsules": "Oral Capsules",
};

/**
 * Therapeutic areas — used by both the home-page filter pills and as a
 * cross-link surface on the product page. Order here drives the order of
 * the filter pills.
 */
export const THERAPEUTIC_AREAS = [
  "All Products",
  "Weight Loss",
  "Hormone Replacement",
  "Peptide Therapy",
  "Longevity",
  "Dermatology",
  "Wellness",
  "Supportive Care",
] as const;

export type Category = (typeof THERAPEUTIC_AREAS)[number];

/** Legacy alias used by `FeaturedProducts` / `ProductCard`. */
export const categories = THERAPEUTIC_AREAS;

/* ───────────────────────── Sub-types ───────────────────────── */

export type ProductBadgeVariant =
  | "controlled"
  | "fda"
  | "coming-soon"
  | "popular"
  | "commercial"
  | "info";

export interface ProductBadge {
  label: string;
  variant: ProductBadgeVariant;
  /**
   * Optional footnote marker (e.g. `*`) appended to the badge label.
   * Pair with `Product.footnote` to render an asterisked explanation under
   * the hero.
   */
  footnoteMark?: string;
}

export type ProductVariantColumn =
  | "strength"
  | "form"
  | "quantity"
  | "vialTotalMg"
  | "concentration"
  | "ml";

export interface ProductVariant {
  /** Used by oral tablets / capsules. */
  strength?: string;
  /** "Tablets" / "Capsules" — usually constant across rows. */
  form?: string;
  /** "As prescribed", "30-count", etc. */
  quantity?: string;
  /** Used by injectables. */
  vialTotalMg?: string;
  /** "200 mg/mL". */
  concentration?: string;
  /** "5 mL". */
  ml?: string;
  /** Optional per-strength vial photo, shown as a thumbnail in the details table. */
  image?: string;
  /** Alt text for the per-strength vial photo. */
  imageAlt?: string;
}

export type DosageScheduleColumn =
  | "weeks"
  | "units"
  | "mg"
  | "ml"
  | "directions";

export interface DosageScheduleRow {
  weeks?: string;
  units?: string;
  mg?: string;
  ml?: string;
  directions?: string;
}

export interface DosageSchedule {
  columns: DosageScheduleColumn[];
  rows: DosageScheduleRow[];
  /** Asterisk-style footnote rendered under the table. */
  note?: string;
}

export interface IngredientHighlight {
  title: string;
  description: string;
}

export interface ProductFaqItem {
  q: string;
  a: string;
}

export interface ProductDetail {
  label: string;
  content: string;
}

/* ───────────────────────── Product ───────────────────────── */

export interface Product {
  /* Identity */
  slug: string;
  name: string;
  /** "in Grape Seed Oil", "plus Glycine", "Generic Zofran", "Body Protection Compound" */
  modifier?: string;
  /** Visual style for the modifier: italic preposition, plus-superscript, or grayed-out generic. */
  modifierStyle?: "in" | "plus" | "generic" | "subtitle";

  /* Categorization */
  category: Category;
  categoryKey: ProductCategoryKey;
  badges?: ProductBadge[];
  /** Footnote rendered under the badges (paired with `ProductBadge.footnoteMark`). */
  footnote?: string;
  /**
   * FDA 503A compounding availability disclaimer. When present, renders a
   * prominent callout in the hero stating the medication is only available
   * when the commercial product is unavailable or a prescriber determines a
   * clinically significant difference for the patient. Required on compounded
   * copies of commercially available drugs (e.g. semaglutide, tirzepatide).
   */
  compoundingDisclaimer?: string;

  /* Hero copy */
  /** One-liner that sits between the H1 and the description paragraphs. */
  tagline?: string;
  /** Three to five bullet points highlighting key benefits. */
  heroBullets?: string[];
  /** Long-form description paragraphs (verbatim from the print catalog). */
  descriptionParagraphs?: string[];

  /* Media */
  image?: string;
  imageAlt?: string;

  /* Mid-page sections */
  activeIngredient: {
    name: string;
    description: string;
  };
  ingredientHighlights?: IngredientHighlight[];
  howToTake?: string[];

  /* Product details + titration tables */
  variants?: ProductVariant[];
  variantColumns?: ProductVariantColumn[];
  variantNote?: string;
  dosageSchedule?: DosageSchedule;

  /* FAQ */
  faqs?: ProductFaqItem[];

  /* Backwards-compatible fields consumed by ProductCard / FeaturedProducts */
  description: string;
  concentration: string;
  form: string;
  size: string;
  details: ProductDetail[];
  /** Single legacy "Very Popular" pill used by ProductCard. */
  badge?: string;
  sku?: string;

  /* SEO / linking */
  metaDescription?: string;
  relatedSlugs?: string[];
}

/* ───────────────────────── Helpers ───────────────────────── */

/**
 * FDA 503A compounding availability disclaimer, applied to compounded copies
 * of commercially available drugs (e.g. semaglutide, tirzepatide).
 */
const COMPOUNDING_DISCLAIMER =
  "This compounded medication is only available when the commercially available product is unavailable or when a prescriber determines that there is a clinically significant difference for the patient.";

/** Common how-to-take copy reused across injectables. */
const SUBQ_HOW_TO_TAKE = [
  "Inspect the vial — solution should be clear and free of particles before each use.",
  "Clean the vial stopper with a fresh alcohol swab and let it air-dry.",
  "Draw the prescribed dose using an insulin syringe; tap out any air bubbles.",
  "Inject subcutaneously into the abdomen, thigh, or upper arm, rotating sites each dose.",
  "Discard the used syringe immediately in an FDA-cleared sharps container.",
];

const IM_HOW_TO_TAKE = [
  "Inspect the vial — solution should be clear and free of particles before each use.",
  "Clean the vial stopper with a fresh alcohol swab and let it air-dry.",
  "Draw the prescribed dose with a standard syringe; swap to the injection needle and tap out any air bubbles.",
  "Inject intramuscularly into the gluteus, thigh, or deltoid as directed by your provider, rotating sites with each dose.",
  "Discard the used needle and syringe immediately in an FDA-cleared sharps container.",
];

const ORAL_HOW_TO_TAKE = (sig: string) => [
  sig,
  "Take at the same time each day to maintain steady levels.",
  "Swallow whole with a full glass of water; do not crush or chew unless directed.",
  "If you miss a dose, take it as soon as you remember unless it's close to the next scheduled dose — never double up.",
  "Store at room temperature, away from heat, moisture, and direct sunlight.",
];

/* ───────────────────────── Catalog ───────────────────────── */

export const products: Product[] = [
  /* ───── Hormone Replacement ───── */
  {
    slug: "testosterone-cypionate",
    name: "Testosterone Cypionate",
    modifier: "Grape Seed Oil",
    modifierStyle: "in",
    category: "Hormone Replacement",
    categoryKey: "Injectable",
    badges: [
      { label: "Controlled Substance", variant: "controlled" },
      { label: "DEA Number Required", variant: "info", footnoteMark: "*" },
    ],
    footnote:
      "* A current DEA registration number is required on the prescriber file before this medication can be dispensed.",
    tagline:
      "Long-acting bioidentical testosterone compounded in pharmaceutical-grade grape seed oil for smoother absorption.",
    heroBullets: [
      "Long-acting bioidentical testosterone ester",
      "Compounded in pharmaceutical-grade grape seed oil for reduced post-injection discomfort",
      "Multi-dose vials in 200 mg/mL or 50 mg/mL strengths",
      "Steady serum levels with weekly intramuscular dosing",
    ],
    descriptionParagraphs: [
      "Testosterone Cypionate is a long-acting injectable form of bioidentical testosterone used to restore optimal hormone levels in men. Compounded in pharmaceutical-grade grape seed oil, it delivers smooth absorption, reduced post-injection discomfort, and steady serum levels.",
      "Testosterone therapy helps improve energy, strength, mood, libido, and overall vitality. When properly monitored, it supports lean muscle development, healthy metabolism, and general well-being.",
    ],
    description:
      "Long-acting injectable bioidentical testosterone, compounded in pharmaceutical-grade grape seed oil for smooth absorption and steady serum levels.",
    image: "/images/products/testosterone-cypionate.webp",
    imageAlt: "Logos RX Testosterone Cypionate 200 mg/mL multi-dose vial",
    concentration: "200 mg/mL",
    form: "Injectable",
    size: "5 mL",
    activeIngredient: {
      name: "Testosterone Cypionate",
      description:
        "A long-acting ester of bioidentical testosterone formulated in grape seed oil to slow release into systemic circulation.",
    },
    ingredientHighlights: [
      {
        title: "Bioidentical testosterone",
        description:
          "Chemically identical to the testosterone produced by the human body, supporting natural endocrine pathways.",
      },
      {
        title: "Grape seed oil base",
        description:
          "A light, hypoallergenic carrier oil compared to traditional cottonseed or sesame — typically associated with less injection-site discomfort.",
      },
      {
        title: "Long-acting ester",
        description:
          "The cypionate ester slows release after IM injection, supporting steady serum testosterone with weekly dosing.",
      },
    ],
    howToTake: IM_HOW_TO_TAKE,
    variants: [
      {
        vialTotalMg: "1,000 mg",
        concentration: "200 mg/mL",
        ml: "5 mL",
        image: "/images/products/testosterone-cypionate.webp",
        imageAlt: "Logos RX Testosterone Cypionate 200 mg/mL, 5 mL vial",
      },
      {
        vialTotalMg: "100 mg",
        concentration: "50 mg/mL",
        ml: "2 mL",
        image: "/images/products/testosterone-cypionate-50mg.webp",
        imageAlt: "Logos RX Testosterone Cypionate 50 mg/mL, 2 mL vial",
      },
    ],
    variantColumns: ["vialTotalMg", "concentration", "ml"],
    dosageSchedule: {
      columns: ["weeks", "units", "mg", "ml", "directions"],
      rows: [
        {
          weeks: "1–12+",
          units: "100",
          mg: "200 mg",
          ml: "1.0 mL",
          directions: "Inject 1 mL (200 mg) intramuscularly once weekly.*",
        },
      ],
      note:
        "* Provider preference based on lab results may adjust to twice per week (0.5 mL / 100 mg each injection).",
    },
    details: [
      { label: "How to Use", content: "Administer intramuscularly as directed by your healthcare provider." },
      { label: "Size", content: "5 mL multi-dose vial (1,000 mg) or 2 mL multi-dose vial (100 mg)" },
      { label: "Concentration", content: "200 mg/mL or 50 mg/mL" },
      { label: "Schedule", content: "Once weekly, or as prescribed by your healthcare provider." },
      { label: "BUD", content: "Please refer to the vial label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "Why grape seed oil instead of cottonseed or sesame oil?",
        a: "Grape seed oil is a lighter, more hypoallergenic carrier compared to traditional ester vehicles. Patients commonly report less post-injection soreness and a smoother injection experience.",
      },
      {
        q: "How often is Testosterone Cypionate typically dosed?",
        a: "The most common cadence is once weekly intramuscular injection, but providers may split the dose to twice weekly (every 3.5 days) based on lab results and patient response.",
      },
      {
        q: "Is monitoring required during therapy?",
        a: "Yes — providers typically order baseline labs and follow-up labs at 6–12 weeks, then every 6–12 months, to monitor total testosterone, estradiol, hematocrit, PSA, and other markers.",
      },
    ],
    relatedSlugs: ["anastrozole", "enclomiphene-citrate", "pregnyl-hcg"],
  },

  {
    slug: "anastrozole",
    name: "Anastrozole",
    category: "Hormone Replacement",
    categoryKey: "Oral Tablets",
    tagline:
      "An oral aromatase inhibitor that helps maintain optimal testosterone-to-estrogen balance during hormone therapy.",
    heroBullets: [
      "Selective aromatase inhibitor (AI)",
      "Helps prevent estrogen-related side effects of TRT (water retention, gynecomastia, mood swings)",
      "Available in 0.25 mg, 0.50 mg, and 1 mg tablets",
      "Typically dosed two times per week alongside testosterone therapy",
    ],
    descriptionParagraphs: [
      "Anastrozole is an oral aromatase inhibitor (AI) designed to reduce the body's conversion of testosterone into estradiol (estrogen). By selectively inhibiting the aromatase enzyme, Anastrozole helps maintain optimal testosterone-to-estrogen balance, supporting hormonal stability in men undergoing testosterone replacement therapy (TRT) or other hormone optimization programs.",
      "This medication is commonly prescribed to prevent estrogen-related side effects such as water retention, gynecomastia, and mood fluctuations — while preserving the benefits of testosterone therapy, including increased energy, lean muscle, and improved libido.",
    ],
    description:
      "An oral aromatase inhibitor used to maintain testosterone-to-estrogen balance during hormone therapy.",
    image: "/images/products/anastrozole.webp",
    imageAlt: "Logos RX Anastrozole oral tablets",
    concentration: "0.25 mg / 0.50 mg / 1 mg",
    form: "Oral Tablets",
    size: "As prescribed",
    activeIngredient: {
      name: "Anastrozole",
      description:
        "A selective non-steroidal aromatase inhibitor that blocks the conversion of androgens to estrogens.",
    },
    ingredientHighlights: [
      {
        title: "Selective aromatase blocker",
        description:
          "Anastrozole binds reversibly to the aromatase enzyme, reducing the peripheral conversion of testosterone to estradiol without affecting other steroid pathways.",
      },
      {
        title: "Estrogen-balanced TRT",
        description:
          "Pairs with testosterone therapy to keep estradiol within a healthy range, supporting libido, mood, and body composition.",
      },
      {
        title: "Flexible micro-dosing",
        description:
          "Three tablet strengths allow precise titration based on lab-confirmed estradiol levels.",
      },
    ],
    howToTake: ORAL_HOW_TO_TAKE(
      "Take one tablet (0.25 mg) by mouth two times per week, or as directed by your provider.",
    ),
    variants: [
      { strength: "0.25 mg", form: "Tablets", quantity: "As prescribed" },
      { strength: "0.50 mg", form: "Tablets", quantity: "As prescribed" },
      { strength: "1 mg", form: "Tablets", quantity: "As prescribed" },
    ],
    variantColumns: ["strength", "form", "quantity"],
    dosageSchedule: {
      columns: ["weeks", "mg", "directions"],
      rows: [
        {
          weeks: "1–4",
          mg: "0.25 mg – 0.50 mg – 1 mg",
          directions:
            "Take one tablet (0.25 mg) by mouth two times per week.",
        },
      ],
    },
    details: [
      { label: "How to Use", content: "Take orally as directed by your healthcare provider." },
      { label: "Strengths", content: "0.25 mg, 0.50 mg, or 1 mg tablets" },
      { label: "Form", content: "Oral tablets" },
      { label: "Schedule", content: "Typically two times per week, or as prescribed." },
      { label: "BUD", content: "Refer to the dispensing label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "Why is an aromatase inhibitor used alongside testosterone therapy?",
        a: "When exogenous testosterone is administered, a portion is naturally converted to estradiol via the aromatase enzyme. In some patients this can lead to elevated estradiol and side effects like gynecomastia or water retention; Anastrozole prevents that conversion.",
      },
      {
        q: "How often will my provider check labs?",
        a: "Estradiol is typically checked alongside total testosterone — at baseline, again at 6–12 weeks after starting therapy, and then every 6–12 months for stable patients.",
      },
    ],
    relatedSlugs: ["testosterone-cypionate", "enclomiphene-citrate"],
  },

  {
    slug: "enclomiphene-citrate",
    name: "Enclomiphene Citrate",
    category: "Hormone Replacement",
    categoryKey: "Oral Capsules",
    tagline:
      "A selective estrogen receptor modulator (SERM) that stimulates the body's natural testosterone production while preserving fertility.",
    heroBullets: [
      "Stimulates endogenous testosterone production",
      "Preserves natural testicular function and fertility",
      "Increases LH and FSH secretion",
      "Available in 25 mg and 50 mg oral capsules",
    ],
    descriptionParagraphs: [
      "Enclomiphene Citrate is an orally active selective estrogen receptor modulator (SERM) that stimulates the body's natural testosterone production by enhancing luteinizing hormone (LH) and follicle-stimulating hormone (FSH) secretion. By increasing endogenous testosterone levels while maintaining fertility, Enclomiphene offers a natural alternative to testosterone replacement therapy, ideal for men seeking hormonal optimization without suppression of the hypothalamic–pituitary–gonadal axis.",
      "This therapy helps restore energy, mood, libido, and overall well-being while preserving natural testicular function.",
    ],
    description:
      "A SERM that stimulates the body's own testosterone production while preserving fertility.",
    image: "/images/products/enclomiphene-citrate.webp",
    imageAlt: "Logos RX Enclomiphene Citrate oral capsules",
    concentration: "25 mg / 50 mg",
    form: "Oral Capsules",
    size: "As prescribed",
    activeIngredient: {
      name: "Enclomiphene Citrate",
      description:
        "The trans-isomer of clomiphene citrate — a SERM that selectively blocks estrogen feedback at the hypothalamus, increasing LH and FSH release.",
    },
    ingredientHighlights: [
      {
        title: "Trans-isomer purity",
        description:
          "Enclomiphene is the bioactive trans-isomer of clomiphene, isolated from the estrogenic zuclomiphene isomer for a cleaner pharmacologic profile.",
      },
      {
        title: "Fertility-preserving",
        description:
          "Unlike exogenous testosterone, enclomiphene increases endogenous production without suppressing the HPG axis — preserving sperm production and testicular volume.",
      },
      {
        title: "Once-daily oral dosing",
        description:
          "Convenient capsule format avoids weekly injections while maintaining steady-state hormone support.",
      },
    ],
    howToTake: ORAL_HOW_TO_TAKE("Take one capsule by mouth daily, with or without food."),
    variants: [
      { strength: "25 mg", form: "Capsules", quantity: "As prescribed" },
      { strength: "50 mg", form: "Capsules", quantity: "As prescribed" },
    ],
    variantColumns: ["strength", "form", "quantity"],
    dosageSchedule: {
      columns: ["weeks", "mg", "directions"],
      rows: [
        {
          weeks: "1–4",
          mg: "25 mg – 50 mg",
          directions: "Take one tablet by mouth daily.",
        },
      ],
    },
    details: [
      { label: "How to Use", content: "Take orally once daily, with or without food." },
      { label: "Strengths", content: "25 mg or 50 mg capsules" },
      { label: "Form", content: "Oral capsules" },
      { label: "Schedule", content: "Once daily, or as prescribed." },
      { label: "BUD", content: "Refer to the dispensing label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "How is Enclomiphene different from testosterone therapy?",
        a: "Testosterone therapy supplies exogenous hormone, which suppresses the body's natural production. Enclomiphene stimulates the pituitary to make more LH and FSH, increasing the patient's own testosterone production while preserving fertility.",
      },
      {
        q: "Is fertility really preserved on Enclomiphene?",
        a: "Clinical data support preservation of spermatogenesis on enclomiphene, in contrast to exogenous testosterone which commonly suppresses sperm production. Patients planning pregnancy should still discuss monitoring with their provider.",
      },
    ],
    relatedSlugs: ["testosterone-cypionate", "anastrozole", "pregnyl-hcg"],
  },

  {
    slug: "pregnyl-hcg",
    name: "Pregnyl",
    modifier: "Human Chorionic Gonadotropin",
    modifierStyle: "subtitle",
    category: "Hormone Replacement",
    categoryKey: "Injectable",
    badges: [{ label: "FDA Approved", variant: "fda" }],
    tagline:
      "FDA-approved Human Chorionic Gonadotropin (hCG) used to preserve testicular function and fertility during testosterone therapy.",
    heroBullets: [
      "Commercially available, FDA-approved hCG",
      "Mimics luteinizing hormone (LH) to stimulate endogenous testosterone production",
      "Helps preserve testicular volume and fertility on TRT",
      "Supplied as a lyophilized powder with mixing kit included",
    ],
    descriptionParagraphs: [
      "Pregnyl (Human Chorionic Gonadotropin, or hCG) is a biologically active polypeptide hormone that mimics luteinizing hormone (LH), stimulating the testes to produce testosterone and maintain fertility. In men undergoing testosterone replacement therapy, hCG helps preserve testicular volume, sustain natural testosterone production, and prevent infertility from gonadotropin suppression.",
      "This formulation of Pregnyl is a commercially available, FDA-approved product that is reconstituted with bacteriostatic water for subcutaneous or intramuscular use. It is commonly prescribed as part of a comprehensive hormone optimization protocol.",
    ],
    description:
      "FDA-approved Human Chorionic Gonadotropin (hCG) used to preserve testicular function and fertility during testosterone therapy.",
    image: "/images/products/pregnyl-hcg.webp",
    imageAlt: "Pregnyl (hCG) lyophilized powder vial with reconstitution kit",
    concentration: "1,000 IU/mL",
    form: "Injectable (Lyophilized Powder)",
    size: "10 mL",
    activeIngredient: {
      name: "Chorionic Gonadotropin (hCG)",
      description:
        "A glycoprotein hormone that binds to LH receptors on testicular Leydig cells, stimulating endogenous testosterone synthesis.",
    },
    ingredientHighlights: [
      {
        title: "LH-mimetic action",
        description:
          "hCG shares the same receptor as luteinizing hormone, directly stimulating the testes to produce testosterone — bypassing the suppression that exogenous TRT causes upstream.",
      },
      {
        title: "Fertility-supportive",
        description:
          "Maintains spermatogenesis and testicular volume on TRT, a critical consideration for patients planning future pregnancy.",
      },
      {
        title: "Commercial FDA-approved product",
        description:
          "Pregnyl is dispensed as the brand-name product, not a compounded formulation, and ships with a sterile mixing kit.",
      },
    ],
    howToTake: SUBQ_HOW_TO_TAKE,
    variants: [
      {
        vialTotalMg: "10,000 IU",
        concentration: "1,000 IU/mL",
        ml: "10 mL",
      },
    ],
    variantColumns: ["vialTotalMg", "concentration", "ml"],
    variantNote: "Supplied as lyophilized powder with sterile reconstitution kit included.",
    dosageSchedule: {
      columns: ["weeks", "units", "mg", "ml", "directions"],
      rows: [
        {
          weeks: "1–4",
          units: "40",
          mg: "400 IU",
          ml: "0.40 mL",
          directions: "Inject 40 units (400 IU) subcutaneously three times per week (Mon/Wed/Fri).",
        },
        {
          weeks: "5–8",
          units: "40",
          mg: "400 IU",
          ml: "0.40 mL",
          directions: "Continue same dosing schedule to sustain testicular function and testosterone output.",
        },
        {
          weeks: "9+",
          units: "40",
          mg: "400 IU",
          ml: "0.40 mL",
          directions: "Maintain dose or adjust per provider based on labs and clinical response.",
        },
      ],
    },
    details: [
      { label: "How to Use", content: "Reconstitute with the supplied bacteriostatic water; inject subcutaneously as directed." },
      { label: "Size", content: "10 mL reconstituted vial (10,000 IU total)" },
      { label: "Concentration", content: "1,000 IU/mL after reconstitution" },
      { label: "Schedule", content: "Typically three times per week, or as prescribed." },
      { label: "BUD", content: "After reconstitution, refer to the vial label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "Do I need to refrigerate Pregnyl?",
        a: "Lyophilized vials may be stored at room temperature; after reconstitution, store the vial refrigerated (36–46 °F) and use within the BUD on the label.",
      },
      {
        q: "Can hCG be used at the same time as testosterone?",
        a: "Yes — adding hCG to a testosterone regimen is a common protocol used to preserve testicular volume and fertility while maintaining the benefits of TRT.",
      },
    ],
    relatedSlugs: ["testosterone-cypionate", "enclomiphene-citrate"],
  },

  /* ───── Weight Loss / GLP-1 ───── */
  {
    slug: "semaglutide-glycine",
    name: "Semaglutide",
    modifier: "Glycine",
    modifierStyle: "plus",
    category: "Weight Loss",
    categoryKey: "Injectable",
    compoundingDisclaimer: COMPOUNDING_DISCLAIMER,
    tagline:
      "An advanced GLP-1 receptor agonist formulation designed for effective weight management and metabolic optimization.",
    heroBullets: [
      "Once-weekly subcutaneous injection",
      "Regulates appetite and blood sugar via GLP-1 receptor agonism",
      "Glycine adjunct supports muscle recovery and cellular repair",
      "Five vial sizes from 2.5 mg / 1 mL to 12.5 mg / 5 mL",
    ],
    descriptionParagraphs: [
      "Semaglutide + Glycine is an advanced GLP-1 receptor agonist formulation designed for effective weight management and metabolic optimization. This injectable combines Semaglutide, a proven GLP-1 analog that regulates blood sugar and reduces appetite, with Glycine, an amino acid that supports muscle recovery, cellular repair, and improved metabolic health.",
      "Administered once weekly via subcutaneous injection, this dual formulation promotes consistent weight loss, enhances insulin sensitivity, and supports overall wellness. The addition of Glycine complements Semaglutide's mechanism of action by aiding in metabolic recovery and promoting better long-term results.",
    ],
    description:
      "GLP-1 receptor agonist co-formulated with glycine for weight management and metabolic support.",
    image: "/images/products/semaglutide-glycine.webp",
    imageAlt: "Logos RX Semaglutide and Glycine injection multi-dose vial",
    concentration: "2.5 mg/mL",
    form: "Injectable",
    size: "1 mL",
    activeIngredient: {
      name: "Semaglutide + Glycine",
      description:
        "Semaglutide is a long-acting GLP-1 analog that suppresses appetite and slows gastric emptying. Glycine is a non-essential amino acid that supports muscle protein synthesis and metabolic recovery.",
    },
    ingredientHighlights: [
      {
        title: "GLP-1 receptor agonism",
        description:
          "Semaglutide mimics endogenous GLP-1, stimulating insulin release and signaling satiety to the hypothalamus — reducing appetite and food intake.",
      },
      {
        title: "Glycine adjunct",
        description:
          "Glycine is the simplest amino acid and a key building block for muscle protein, collagen, and neurotransmitter synthesis. Co-administration is intended to support recovery during caloric restriction.",
      },
      {
        title: "Once-weekly cadence",
        description:
          "Semaglutide's long half-life enables once-weekly dosing, improving adherence compared to daily or twice-daily medications.",
      },
    ],
    howToTake: SUBQ_HOW_TO_TAKE,
    variants: [
      { vialTotalMg: "2.5 mg", concentration: "2.5 mg / 20 mg/mL", ml: "1 mL", image: "/images/products/semaglutide-glycine.webp", imageAlt: "Logos RX Semaglutide and Glycine 2.5 mg/mL, 1 mL vial" },
      { vialTotalMg: "5 mg", concentration: "2.5 mg / 20 mg/mL", ml: "2 mL", image: "/images/products/semaglutide-5mg.webp", imageAlt: "Logos RX Semaglutide and Glycine 2.5 mg/mL, 2 mL vial" },
      { vialTotalMg: "7.5 mg", concentration: "2.5 mg / 20 mg/mL", ml: "3 mL", image: "/images/products/semaglutide-7-5mg.webp", imageAlt: "Logos RX Semaglutide and Glycine 2.5 mg/mL, 3 mL vial" },
      { vialTotalMg: "10 mg", concentration: "5 mg / 20 mg/mL", ml: "2 mL", image: "/images/products/semaglutide-10mg.webp", imageAlt: "Logos RX Semaglutide and Glycine 5 mg/mL, 2 mL vial" },
      { vialTotalMg: "12.5 mg", concentration: "2.5 mg / 20 mg/mL", ml: "5 mL", image: "/images/products/semaglutide-12-5mg.webp", imageAlt: "Logos RX Semaglutide and Glycine 2.5 mg/mL, 5 mL vial" },
    ],
    variantColumns: ["vialTotalMg", "concentration", "ml"],
    dosageSchedule: {
      columns: ["weeks", "units", "mg", "ml", "directions"],
      rows: [
        { weeks: "1–4", units: "10", mg: "0.25 mg", ml: "0.1 mL", directions: "Inject 10 units (0.25 mg) subcutaneously once weekly." },
        { weeks: "5–8", units: "20", mg: "0.50 mg", ml: "0.2 mL", directions: "Inject 20 units (0.5 mg) subcutaneously once weekly." },
        { weeks: "9–12", units: "40", mg: "1 mg", ml: "0.4 mL", directions: "Inject 40 units (1 mg) subcutaneously once weekly." },
        { weeks: "13–16", units: "60", mg: "1.5 mg", ml: "0.6 mL", directions: "Inject 60 units (1.5 mg) subcutaneously once weekly." },
        { weeks: "17–20", units: "80", mg: "2 mg", ml: "0.8 mL", directions: "Inject 80 units (2 mg) subcutaneously once weekly." },
        { weeks: "21+", units: "100", mg: "2.5 mg", ml: "1.0 mL", directions: "Inject 100 units (2.5 mg) subcutaneously once weekly." },
      ],
    },
    details: [
      { label: "How to Use", content: "Inject subcutaneously once weekly. Rotate injection sites." },
      { label: "Size", content: "5 vial sizes (1 mL, 2 mL, 3 mL, 5 mL) with 2.5–12.5 mg total" },
      { label: "Concentration", content: "2.5 mg/mL or 5 mg/mL" },
      { label: "Schedule", content: "Once weekly with titration over 21+ weeks." },
      { label: "BUD", content: "Refer to the vial label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "How is this different from compounded semaglutide alone?",
        a: "This formulation co-includes glycine, an amino acid intended to support muscle recovery and metabolic health during caloric restriction. The semaglutide active is the same GLP-1 analog used in commercial GLP-1 products.",
      },
      {
        q: "Why is the dose titrated up over time?",
        a: "Slow titration improves tolerability — the most common side effects (nausea, GI upset) are dose-dependent and tend to resolve as the body adjusts. Most patients reach a maintenance dose between weeks 13 and 21.",
      },
      {
        q: "Where do I learn about reading the dosing scale?",
        a: "See our explainer at /learn/semaglutide-dosage for a side-by-side of the vial concentration and the corresponding insulin-syringe units.",
      },
    ],
    relatedSlugs: ["tirzepatide-glycine", "metformin", "ondansetron"],
  },

  {
    slug: "tirzepatide-glycine",
    name: "Tirzepatide",
    modifier: "Glycine",
    modifierStyle: "plus",
    category: "Weight Loss",
    categoryKey: "Injectable",
    compoundingDisclaimer: COMPOUNDING_DISCLAIMER,
    tagline:
      "A next-generation GLP-1 and GIP dual-receptor agonist co-formulated with glycine for advanced weight management.",
    heroBullets: [
      "Once-weekly subcutaneous injection",
      "Dual GLP-1 and GIP receptor agonist for stronger metabolic effect",
      "Glycine adjunct supports muscle recovery and cellular repair",
      "Six vial sizes from 10 mg / 1 mL to 60 mg / 2 mL",
    ],
    descriptionParagraphs: [
      "Tirzepatide + Glycine is a next-generation GLP-1 and GIP receptor agonist formulation created to deliver superior results in weight reduction and metabolic balance. This injectable combines Tirzepatide, a dual-action incretin mimetic that enhances both insulin and glucagon regulation, with Glycine, an amino acid that supports muscle recovery, cellular repair, and improved metabolic function.",
      "Administered once weekly via subcutaneous injection, this formulation promotes powerful, sustained weight loss, enhances glucose control, and supports cardiovascular and overall metabolic health. The addition of Glycine optimizes cellular performance and recovery, amplifying Tirzepatide's metabolic benefits and helping patients achieve longer-lasting results.",
    ],
    description:
      "Dual GLP-1/GIP receptor agonist co-formulated with glycine for advanced weight management.",
    image: "/images/products/tirzepatide-glycine.webp",
    imageAlt: "Logos RX Tirzepatide and Glycine injection multi-dose vial",
    concentration: "10 mg/mL",
    form: "Injectable",
    size: "1 mL",
    activeIngredient: {
      name: "Tirzepatide + Glycine",
      description:
        "Tirzepatide is a dual GIP/GLP-1 receptor agonist (incretin mimetic). Glycine is a non-essential amino acid that supports muscle protein synthesis and cellular recovery.",
    },
    ingredientHighlights: [
      {
        title: "Dual incretin action",
        description:
          "By activating both GLP-1 and GIP receptors, tirzepatide delivers stronger appetite regulation and glucose control than single-receptor GLP-1 agonists.",
      },
      {
        title: "Glycine adjunct",
        description:
          "Glycine supports muscle protein synthesis and metabolic recovery, complementing tirzepatide during periods of caloric restriction.",
      },
      {
        title: "Once-weekly maintenance",
        description:
          "Long half-life supports once-weekly dosing with steady plasma levels and improved adherence vs. daily medications.",
      },
    ],
    howToTake: SUBQ_HOW_TO_TAKE,
    variants: [
      { vialTotalMg: "10 mg", concentration: "10 mg / 20 mg/mL", ml: "1 mL", image: "/images/products/tirzepatide-glycine.webp", imageAlt: "Logos RX Tirzepatide and Glycine 10 mg/mL, 1 mL vial" },
      { vialTotalMg: "20 mg", concentration: "10 mg / 20 mg/mL", ml: "2 mL", image: "/images/products/tirzepatide-20mg.webp", imageAlt: "Logos RX Tirzepatide and Glycine 10 mg/mL, 2 mL vial" },
      { vialTotalMg: "30 mg", concentration: "10 mg / 20 mg/mL", ml: "3 mL", image: "/images/products/tirzepatide-30mg.webp", imageAlt: "Logos RX Tirzepatide and Glycine 10 mg/mL, 3 mL vial" },
      { vialTotalMg: "40 mg", concentration: "10 mg / 20 mg/mL", ml: "4 mL", image: "/images/products/tirzepatide-40mg.webp", imageAlt: "Logos RX Tirzepatide and Glycine 10 mg/mL, 4 mL vial" },
      { vialTotalMg: "60 mg", concentration: "30 mg / 20 mg/mL", ml: "2 mL", image: "/images/products/tirzepatide-60mg.webp", imageAlt: "Logos RX Tirzepatide and Glycine 30 mg/mL, 2 mL vial" },
    ],
    variantColumns: ["vialTotalMg", "concentration", "ml"],
    dosageSchedule: {
      columns: ["weeks", "units", "mg", "ml", "directions"],
      rows: [
        { weeks: "1–4", units: "25", mg: "2.5 mg", ml: "0.25 mL", directions: "Inject 25 units (2.5 mg) subcutaneously once weekly." },
        { weeks: "5–8", units: "50", mg: "5 mg", ml: "0.50 mL", directions: "Inject 50 units (5 mg) subcutaneously once weekly." },
        { weeks: "9–12", units: "75", mg: "7.5 mg", ml: "0.75 mL", directions: "Inject 75 units (7.5 mg) subcutaneously once weekly." },
        { weeks: "13–16", units: "100", mg: "10 mg", ml: "1.0 mL", directions: "Inject 100 units (10 mg) subcutaneously once weekly." },
        { weeks: "17–20", units: "37.5", mg: "12.5 mg", ml: "0.37 mL", directions: "Inject 37.5 units (12.5 mg) subcutaneously once weekly." },
        { weeks: "21+", units: "50", mg: "15 mg", ml: "0.5 mL", directions: "Inject 50 units (15 mg) subcutaneously once weekly." },
      ],
    },
    details: [
      { label: "How to Use", content: "Inject subcutaneously once weekly. Rotate injection sites." },
      { label: "Size", content: "5 vial sizes (1 mL, 2 mL, 3 mL, 4 mL) with 10–60 mg total" },
      { label: "Concentration", content: "10 mg/mL or 30 mg/mL" },
      { label: "Schedule", content: "Once weekly with titration over 21+ weeks." },
      { label: "BUD", content: "Refer to the vial label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "What makes tirzepatide different from semaglutide?",
        a: "Tirzepatide is a dual agonist (both GLP-1 and GIP), while semaglutide acts on GLP-1 only. Clinical trials suggest greater weight loss and glucose control with tirzepatide for many patients.",
      },
      {
        q: "How is the dose calculated for the insulin syringe?",
        a: "See our /learn/tirzepatide-dosage page for a side-by-side of the vial concentration and the corresponding insulin-syringe units, with common-strength examples worked out.",
      },
    ],
    relatedSlugs: ["semaglutide-glycine", "metformin", "ondansetron"],
  },

  {
    slug: "metformin",
    name: "Metformin",
    category: "Weight Loss",
    categoryKey: "Oral Tablets",
    tagline:
      "First-line oral therapy that improves insulin sensitivity and supports metabolic health.",
    heroBullets: [
      "First-line therapy for insulin resistance",
      "Reduces hepatic glucose production",
      "Often paired with GLP-1 therapy for synergistic metabolic effect",
      "Available in 500 mg, 850 mg, and 1,000 mg tablets",
    ],
    descriptionParagraphs: [
      "Metformin Hydrochloride is a first-line oral medication used to improve insulin sensitivity and support metabolic health. Originally developed for the management of type 2 diabetes, Metformin is now also recognized for its broader benefits in weight control, cardiovascular support, and longevity optimization.",
      "Metformin works by reducing hepatic glucose production, increasing peripheral glucose uptake, and enhancing insulin sensitivity — helping regulate blood sugar levels and support steady metabolic function. It is frequently prescribed as part of comprehensive metabolic and weight optimization protocols, including those involving GLP-1 receptor agonists.",
    ],
    description:
      "First-line oral therapy that improves insulin sensitivity and supports metabolic health.",
    image: "/images/products/metformin.webp",
    imageAlt: "Logos RX Metformin oral tablets",
    concentration: "500 mg / 850 mg / 1,000 mg",
    form: "Oral Tablets",
    size: "As prescribed",
    activeIngredient: {
      name: "Metformin Hydrochloride",
      description:
        "A biguanide that decreases hepatic gluconeogenesis and increases peripheral glucose uptake, improving insulin sensitivity.",
    },
    ingredientHighlights: [
      {
        title: "Lowers hepatic glucose",
        description:
          "Metformin's primary mechanism is suppression of liver gluconeogenesis, the largest contributor to fasting hyperglycemia.",
      },
      {
        title: "Insulin sensitizer",
        description:
          "Improves peripheral glucose uptake without forcing additional insulin release — a low hypoglycemia risk profile when used as monotherapy.",
      },
      {
        title: "Longevity research interest",
        description:
          "Ongoing studies (e.g. TAME) are evaluating metformin's potential role in cellular aging and cardiometabolic resilience.",
      },
    ],
    howToTake: ORAL_HOW_TO_TAKE(
      "Take one tablet (500 mg) by mouth twice daily with morning and evening meals.",
    ),
    variants: [
      { strength: "500 mg", form: "Tablets", quantity: "As prescribed" },
      { strength: "850 mg", form: "Tablets", quantity: "As prescribed" },
      { strength: "1,000 mg", form: "Tablets", quantity: "As prescribed" },
    ],
    variantColumns: ["strength", "form", "quantity"],
    dosageSchedule: {
      columns: ["weeks", "mg", "directions"],
      rows: [
        {
          weeks: "1–4",
          mg: "500 mg daily",
          directions: "Take one tablet (500 mg) by mouth twice daily with morning and evening meals.",
        },
        {
          weeks: "5+",
          mg: "1,000 mg daily",
          directions: "Maintain one tablet (1,000 mg) by mouth twice daily, or as directed by your provider.",
        },
      ],
    },
    details: [
      { label: "How to Use", content: "Take with food to reduce GI upset, as directed by your provider." },
      { label: "Strengths", content: "500 mg, 850 mg, or 1,000 mg tablets" },
      { label: "Form", content: "Oral tablets" },
      { label: "Schedule", content: "Typically twice daily, titrated up as tolerated." },
      { label: "BUD", content: "Refer to the dispensing label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "Why is metformin paired with GLP-1 therapy?",
        a: "GLP-1 agonists work on appetite and insulin secretion; metformin works primarily on hepatic glucose output and insulin sensitivity. The two mechanisms are complementary — many protocols combine them for stronger metabolic results.",
      },
      {
        q: "How do I minimize GI side effects?",
        a: "Start at the lowest tolerated dose, take with meals, and titrate up over 2–4 weeks. Extended-release formulations can also be considered if GI symptoms persist.",
      },
    ],
    relatedSlugs: ["semaglutide-glycine", "tirzepatide-glycine"],
  },

  {
    slug: "ondansetron",
    name: "Ondansetron",
    modifier: "Generic Zofran",
    modifierStyle: "generic",
    category: "Supportive Care",
    categoryKey: "Oral Tablets",
    tagline:
      "A selective 5-HT₃ receptor antagonist used to prevent and treat nausea and vomiting.",
    heroBullets: [
      "Selective 5-HT₃ receptor antagonist",
      "Effective against medication-, anesthesia-, and GI-related nausea",
      "Commonly prescribed alongside GLP-1 therapies",
      "4 mg tablets, dosed every 8 hours as needed",
    ],
    descriptionParagraphs: [
      "Ondansetron is a selective 5-HT₃ receptor antagonist used to prevent and treat nausea and vomiting caused by medications, anesthesia, or gastrointestinal disturbances. By blocking serotonin receptors in both the central nervous system and the gastrointestinal tract, Ondansetron effectively reduces the urge to vomit and improves comfort in patients experiencing nausea due to GLP-1 therapies, anesthesia, or other medical treatments.",
      "This medication is well-tolerated, fast-acting, and commonly prescribed as part of supportive care regimens in clinical and telehealth settings.",
    ],
    description:
      "Selective 5-HT₃ receptor antagonist for nausea and vomiting (generic Zofran).",
    image: "/images/products/ondansetron.webp",
    imageAlt: "Logos RX Ondansetron 4 mg oral tablets",
    concentration: "4 mg",
    form: "Oral Tablets",
    size: "As prescribed",
    activeIngredient: {
      name: "Ondansetron",
      description:
        "A selective serotonin 5-HT₃ receptor antagonist that prevents activation of vomiting reflexes in the CNS and GI tract.",
    },
    ingredientHighlights: [
      {
        title: "5-HT₃ blockade",
        description:
          "Ondansetron blocks serotonin from binding to 5-HT₃ receptors on vagal afferents and in the chemoreceptor trigger zone, breaking the nausea signal cascade.",
      },
      {
        title: "GLP-1 supportive care",
        description:
          "A common adjunct during GLP-1 initiation and dose titration, when transient nausea is most likely.",
      },
      {
        title: "Fast onset, well-tolerated",
        description:
          "Oral ondansetron typically begins to work within 30 minutes and has a favorable side-effect profile for short-term use.",
      },
    ],
    howToTake: ORAL_HOW_TO_TAKE(
      "Take one tablet (4 mg) by mouth every 8 hours as needed for nausea or vomiting.",
    ),
    variants: [{ strength: "4 mg", form: "Tablets", quantity: "As prescribed" }],
    variantColumns: ["strength", "form", "quantity"],
    dosageSchedule: {
      columns: ["weeks", "mg", "directions"],
      rows: [
        {
          weeks: "Daily",
          mg: "4 mg daily",
          directions: "Take one tablet (4 mg) by mouth every 8 hours as needed for nausea or vomiting.",
        },
      ],
    },
    details: [
      { label: "How to Use", content: "Take orally every 8 hours as needed, not to exceed prescribed limits." },
      { label: "Strengths", content: "4 mg tablets" },
      { label: "Form", content: "Oral tablets" },
      { label: "Schedule", content: "As needed, every 8 hours, per provider direction." },
      { label: "BUD", content: "Refer to the dispensing label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "Is ondansetron the same as Zofran?",
        a: "Yes — ondansetron is the generic name; Zofran is the brand name. The active ingredient and mechanism are identical.",
      },
      {
        q: "When should I take it during GLP-1 therapy?",
        a: "Many patients use it on an as-needed basis during the first weeks of GLP-1 dose escalation, when nausea is most pronounced. Always follow your provider's specific directions.",
      },
    ],
    relatedSlugs: ["semaglutide-glycine", "tirzepatide-glycine"],
  },

  /* ───── Peptide Therapy ───── */
  {
    slug: "sermorelin",
    name: "Sermorelin",
    category: "Peptide Therapy",
    categoryKey: "Injectable",
    tagline:
      "A growth hormone–releasing hormone (GHRH) analog that stimulates natural HGH production from the pituitary.",
    heroBullets: [
      "GHRH analog — stimulates the body's natural HGH",
      "Supports lean muscle, recovery, sleep, and metabolism",
      "Subcutaneous injection, Monday through Friday before bedtime",
      "10 mg / 5 mL multi-dose vial",
    ],
    descriptionParagraphs: [
      "Sermorelin is a growth hormone–releasing hormone (GHRH) analog that stimulates the natural production of human growth hormone (HGH) from the pituitary gland. This peptide helps promote lean muscle development, improved recovery, deeper sleep, and enhanced metabolism.",
      "By increasing endogenous HGH levels rather than replacing them directly, Sermorelin provides a safer, more natural approach to age management, muscle support, and fat reduction. Regular use contributes to improved energy levels, better mood, and healthier body composition.",
    ],
    description:
      "GHRH analog that stimulates the body's natural growth hormone release.",
    image: "/images/products/sermorelin.webp",
    imageAlt: "Logos RX Sermorelin subcutaneous injection multi-dose vial",
    concentration: "2 mg/mL",
    form: "Injectable",
    size: "5 mL",
    activeIngredient: {
      name: "Sermorelin Acetate",
      description:
        "A 29-amino-acid synthetic analog of growth hormone–releasing hormone (GHRH) that binds to GHRH receptors on pituitary somatotrophs, stimulating endogenous HGH release.",
    },
    ingredientHighlights: [
      {
        title: "Stimulates endogenous HGH",
        description:
          "Sermorelin amplifies the natural pulsatile release of HGH rather than introducing exogenous hormone — preserving normal feedback regulation.",
      },
      {
        title: "Bedtime dosing",
        description:
          "Administered before bed to align with the body's nocturnal HGH pulse, the largest natural surge in adults.",
      },
      {
        title: "Recovery and body-composition support",
        description:
          "Patients commonly report better sleep, faster exercise recovery, and gradual changes in lean mass and fat distribution.",
      },
    ],
    howToTake: SUBQ_HOW_TO_TAKE,
    variants: [{ vialTotalMg: "10 mg", concentration: "2 mg/mL", ml: "5 mL" }],
    variantColumns: ["vialTotalMg", "concentration", "ml"],
    dosageSchedule: {
      columns: ["weeks", "units", "mg", "ml", "directions"],
      rows: [
        {
          weeks: "1–2",
          units: "25",
          mg: "0.40 mg",
          ml: "0.25 mL",
          directions: "Inject 25 units (0.4 mg) subcutaneously once daily, Monday through Friday before bedtime.",
        },
        {
          weeks: "3+",
          units: "50",
          mg: "0.8 mg",
          ml: "0.50 mL",
          directions: "Inject 50 units (0.8 mg) subcutaneously once daily, Monday through Friday before bedtime.",
        },
      ],
    },
    details: [
      { label: "How to Use", content: "Administer subcutaneously before bedtime, Monday through Friday." },
      { label: "Size", content: "5 mL multi-dose vial (10 mg)" },
      { label: "Concentration", content: "2 mg/mL" },
      { label: "Schedule", content: "Once daily Mon–Fri, or as prescribed." },
      { label: "BUD", content: "Refer to the vial label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "How is Sermorelin different from synthetic HGH?",
        a: "Sermorelin stimulates the pituitary to make more of its own HGH. Synthetic HGH bypasses the pituitary entirely. Sermorelin preserves natural feedback regulation and is generally considered the gentler approach.",
      },
      {
        q: "Why dose only Monday through Friday?",
        a: "Cycling 5-on / 2-off helps maintain pituitary sensitivity and avoids long-term receptor downregulation.",
      },
    ],
    relatedSlugs: ["tesamorelin", "bpc-157", "nad-plus"],
  },

  {
    slug: "tesamorelin",
    name: "Tesamorelin",
    category: "Peptide Therapy",
    categoryKey: "Injectable",
    tagline:
      "A growth hormone–releasing hormone (GHRH) analog used to reduce visceral fat and support healthy body composition.",
    heroBullets: [
      "GHRH analog — stimulates the body's natural HGH",
      "Studied for reducing visceral adipose tissue (deep belly fat)",
      "Supports body composition, recovery, and metabolic health",
      "Subcutaneous injection, typically once daily",
    ],
    descriptionParagraphs: [
      "Tesamorelin is a growth hormone–releasing hormone (GHRH) analog that stimulates the pituitary gland to produce and release the body's own human growth hormone (HGH). It is best known for its clinically studied ability to reduce visceral adipose tissue — the deep abdominal fat associated with metabolic and cardiovascular risk.",
      "By increasing endogenous HGH in a natural, pulsatile pattern rather than replacing it directly, Tesamorelin supports improved body composition, recovery, and metabolic health. It is commonly used in body-composition, longevity, and hormone-optimization protocols, often alongside other peptides.",
    ],
    description:
      "GHRH analog studied for reducing visceral fat and supporting healthy body composition.",
    image: "/images/products/tesamorelin.webp",
    imageAlt: "Logos RX Tesamorelin subcutaneous injection multi-dose vial",
    concentration: "5 mg/mL",
    form: "Injectable",
    size: "2 mL",
    activeIngredient: {
      name: "Tesamorelin Acetate",
      description:
        "A synthetic analog of growth hormone–releasing hormone (GHRH) that binds GHRH receptors on pituitary somatotrophs, stimulating endogenous HGH release.",
    },
    ingredientHighlights: [
      {
        title: "Stimulates endogenous HGH",
        description:
          "Tesamorelin amplifies the body's natural pulsatile release of HGH rather than introducing exogenous hormone, preserving normal feedback regulation.",
      },
      {
        title: "Visceral fat reduction",
        description:
          "Best known clinically for its ability to reduce visceral adipose tissue — the metabolically active deep abdominal fat.",
      },
      {
        title: "Bedtime dosing",
        description:
          "Administered before bed to align with the body's nocturnal HGH pulse, the largest natural surge in adults.",
      },
    ],
    howToTake: SUBQ_HOW_TO_TAKE,
    variants: [{ vialTotalMg: "10 mg", concentration: "5 mg/mL", ml: "2 mL" }],
    variantColumns: ["vialTotalMg", "concentration", "ml"],
    dosageSchedule: {
      columns: ["weeks", "units", "mg", "ml", "directions"],
      rows: [
        {
          weeks: "1–4",
          units: "20",
          mg: "1 mg",
          ml: "0.2 mL",
          directions: "Inject 20 units (1 mg) subcutaneously once daily before bedtime.",
        },
        {
          weeks: "5+",
          units: "40",
          mg: "2 mg",
          ml: "0.4 mL",
          directions: "Inject 40 units (2 mg) subcutaneously once daily before bedtime, or as directed by your provider.",
        },
      ],
    },
    details: [
      { label: "How to Use", content: "Administer subcutaneously before bedtime, as directed by your provider." },
      { label: "Size", content: "2 mL multi-dose vial (10 mg)" },
      { label: "Concentration", content: "5 mg/mL" },
      { label: "Schedule", content: "Once daily, or as prescribed." },
      { label: "BUD", content: "Refer to the vial label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "How is Tesamorelin different from Sermorelin?",
        a: "Both are GHRH analogs that stimulate the body's own HGH. Tesamorelin is most studied for reducing visceral adipose tissue (deep belly fat), while Sermorelin is more commonly used for general age-management and recovery support. Your provider will recommend the best fit for your goals.",
      },
      {
        q: "Why is Tesamorelin dosed at bedtime?",
        a: "Dosing before bed aligns with the body's natural overnight HGH pulse, the largest physiologic surge in adults — supporting a more natural release pattern.",
      },
    ],
    relatedSlugs: ["sermorelin", "bpc-157", "nad-plus"],
  },

  {
    slug: "bpc-157",
    name: "BPC-157",
    modifier: "Body Protection Compound",
    modifierStyle: "subtitle",
    category: "Peptide Therapy",
    categoryKey: "Injectable",
    badges: [{ label: "Coming Soon", variant: "coming-soon" }],
    tagline:
      "A synthetic pentadecapeptide explored for its role in tissue recovery, soft-tissue healing, and gut integrity.",
    heroBullets: [
      "15-amino-acid synthetic pentadecapeptide",
      "Studied for tendon, ligament, muscle, nerve, and GI tissue support",
      "Reconstituted from lyophilized powder per clinician protocol",
      "Typically dosed Monday through Friday",
    ],
    descriptionParagraphs: [
      "BPC-157 is a biologically active synthetic pentadecapeptide composed of 15 amino acids and is commonly discussed in regenerative, sports medicine, and tissue-recovery protocols for its potential role in supporting healing and cellular repair. It is derived from a protective peptide sequence associated with gastric tissue and has been studied for its effects on inflammation modulation, collagen organization, angiogenesis, blood-flow support, and soft-tissue recovery.",
      "Mechanistically, BPC-157 is believed to influence several repair pathways involved in tendon, ligament, muscle, nerve, skin, and gastrointestinal tissue health. Preclinical studies suggest that it may help support fibroblast activity, improve vascular response, promote extracellular matrix remodeling, and assist in maintaining mucosal integrity within the gastrointestinal tract. These properties make it of interest in clinical discussions involving musculoskeletal recovery, connective-tissue strain, gut irritation, and post-injury rehabilitation support.",
      "In practice, BPC-157 is often supplied as a lyophilized peptide that is reconstituted with bacteriostatic or sterile water according to clinician-directed protocols. It may be incorporated as part of a broader recovery plan that can include physical therapy, nutrition optimization, sleep support, anti-inflammatory strategies, hormone evaluation, and careful monitoring of symptoms and functional progress.",
    ],
    description:
      "Synthetic pentadecapeptide explored for soft-tissue recovery, tendon and ligament support, and gut integrity.",
    image: "/images/products/bpc-157.webp",
    imageAlt: "Logos RX BPC-157 subcutaneous injection vial",
    concentration: "2.5 mg/mL",
    form: "Injectable",
    size: "4 mL",
    activeIngredient: {
      name: "BPC-157 (Body Protection Compound)",
      description:
        "A synthetic 15-amino-acid peptide derived from a protective sequence identified in human gastric juice; commonly studied in preclinical models of tissue repair.",
    },
    ingredientHighlights: [
      {
        title: "Tissue repair pathways",
        description:
          "Preclinical research suggests BPC-157 may influence fibroblast activity, angiogenesis, and extracellular matrix remodeling.",
      },
      {
        title: "Gut and connective-tissue interest",
        description:
          "Investigated for potential roles in mucosal integrity, tendon strain recovery, and post-injury rehabilitation.",
      },
      {
        title: "Lyophilized for stability",
        description:
          "Supplied as a freeze-dried peptide reconstituted on-site to preserve activity until the moment of use.",
      },
    ],
    howToTake: SUBQ_HOW_TO_TAKE,
    variants: [{ vialTotalMg: "10 mg", concentration: "2.5 mg/mL", ml: "4 mL" }],
    variantColumns: ["vialTotalMg", "concentration", "ml"],
    dosageSchedule: {
      columns: ["weeks", "units", "mg", "ml", "directions"],
      rows: [
        {
          weeks: "1–12",
          units: "25",
          mg: "0.5 mg",
          ml: "0.25 mL",
          directions: "Inject 25 units subcutaneously five times per week (Mon–Fri) on the injured area.",
        },
      ],
    },
    details: [
      { label: "How to Use", content: "Administer subcutaneously per clinician protocol, typically near the area of interest." },
      { label: "Size", content: "4 mL multi-dose vial (10 mg total)" },
      { label: "Concentration", content: "2.5 mg/mL" },
      { label: "Schedule", content: "Typically five days on, two days off." },
      { label: "BUD", content: "Refer to the vial label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "When will BPC-157 be available from Logos RX?",
        a: "BPC-157 is currently listed as Coming Soon. Please contact Logos RX to be notified when the formulation is available for prescribing.",
      },
      {
        q: "Is BPC-157 FDA-approved?",
        a: "BPC-157 is not FDA-approved as a finished drug product. It is offered as a compounded preparation under the prescription of a licensed provider and used per clinician-directed protocols.",
      },
    ],
    relatedSlugs: ["sermorelin", "nad-plus", "glutathione"],
  },

  /* ───── Longevity / Wellness ───── */
  {
    slug: "nad-plus",
    name: "NAD+",
    category: "Longevity",
    categoryKey: "Injectable",
    badge: "Very Popular",
    sku: "364215376135191",
    tagline:
      "A vital coenzyme that supports cellular energy, DNA repair, and mitochondrial performance.",
    heroBullets: [
      "Replenishes age-declining NAD+ levels",
      "Supports energy, focus, and mitochondrial function",
      "Subcutaneous or intramuscular injection",
      "1,000 mg / 10 mL multi-dose vial",
    ],
    descriptionParagraphs: [
      "NAD⁺ (Nicotinamide Adenine Dinucleotide) is a vital coenzyme found in every cell of the body, responsible for energy production, DNA repair, and maintaining optimal cellular function. As we age, NAD⁺ levels naturally decline — leading to fatigue, slower metabolism, and diminished mental performance. NAD⁺ supplementation helps restore these levels, supporting energy metabolism, cellular regeneration, and longevity.",
      "Administered via subcutaneous or intramuscular injection, this formulation promotes enhanced focus, improved recovery, and a balanced metabolic state. Regular use of NAD⁺ therapy supports mitochondrial function, boosts energy, improves cognitive performance, and contributes to overall vitality and well-being.",
    ],
    description:
      "Essential coenzyme that supports cellular energy, DNA repair, and longevity.",
    image: "/images/products/nad-plus.webp",
    imageAlt: "Logos RX NAD+ (Nicotinamide Adenine Dinucleotide) multi-dose vial",
    concentration: "100 mg/mL",
    form: "Injectable",
    size: "10 mL",
    activeIngredient: {
      name: "Nicotinamide Adenine Dinucleotide (NAD+)",
      description:
        "A coenzyme present in every living cell, essential for redox reactions, ATP production, sirtuin activation, and DNA repair.",
    },
    ingredientHighlights: [
      {
        title: "Mitochondrial energy",
        description:
          "NAD+ is the primary electron carrier in mitochondrial respiration — restoring levels supports ATP production and sustained cellular energy.",
      },
      {
        title: "DNA repair and sirtuin activation",
        description:
          "NAD+ is a required substrate for sirtuins and PARP enzymes, both central to DNA repair and longevity pathways.",
      },
      {
        title: "Age-related decline",
        description:
          "Intracellular NAD+ levels drop with age; replenishment is the rationale behind much of the current longevity research interest.",
      },
    ],
    howToTake: SUBQ_HOW_TO_TAKE,
    variants: [{ vialTotalMg: "1,000 mg", concentration: "100 mg/mL", ml: "10 mL" }],
    variantColumns: ["vialTotalMg", "concentration", "ml"],
    dosageSchedule: {
      columns: ["weeks", "units", "mg", "ml", "directions"],
      rows: [
        { weeks: "1–4", units: "50", mg: "50 mg", ml: "0.5 mL", directions: "Inject 50 units (10 mg) subcutaneously or intramuscularly 2–3 times weekly." },
        { weeks: "5–8", units: "50", mg: "50 mg", ml: "0.5 mL", directions: "Inject 75 units (15 mg) subcutaneously or intramuscularly 2–3 times weekly." },
        { weeks: "9+", units: "75", mg: "75 mg", ml: "0.75 mL", directions: "Inject 100 units (20 mg) subcutaneously or intramuscularly 2 times weekly." },
      ],
    },
    details: [
      { label: "How to Use", content: "Administer subcutaneously or intramuscularly as directed by your provider." },
      { label: "Size", content: "10 mL multi-dose vial (1,000 mg)" },
      { label: "Concentration", content: "100 mg/mL" },
      { label: "Schedule", content: "Two to three times weekly, as prescribed." },
      { label: "BUD", content: "Refer to the vial label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "What's the difference between SubQ and IM injection?",
        a: "Subcutaneous injection (into the fatty layer below the skin) is gentler and slower-absorbing; intramuscular delivers faster absorption but with more discomfort. Many patients prefer SubQ for NAD+; your provider will recommend the right route.",
      },
      {
        q: "How long until I notice an effect?",
        a: "Patient experience varies. Some report noticeable energy and focus changes within the first 2–4 weeks; others see more gradual changes over 8–12 weeks.",
      },
    ],
    relatedSlugs: ["glutathione", "sermorelin"],
  },

  {
    slug: "glutathione",
    name: "Glutathione",
    category: "Wellness",
    categoryKey: "Injectable",
    tagline:
      "The body's master intracellular antioxidant — supports detoxification, immunity, and cellular renewal.",
    heroBullets: [
      "Intracellular master antioxidant",
      "Supports liver detoxification and cellular renewal",
      "Brightens skin and supports immune health",
      "1,000 mg / 5 mL multi-dose vial",
    ],
    descriptionParagraphs: [
      "Glutathione is the body's master antioxidant — a tripeptide made of glutamine, cysteine, and glycine that protects cells from oxidative stress and supports liver detoxification. Injectable Glutathione helps restore natural antioxidant defenses, improve skin clarity, reduce inflammation, and boost overall vitality.",
      "By replenishing intracellular glutathione stores, this therapy promotes healthy immune function, improves recovery, and supports brighter, clearer skin through enhanced detoxification and cellular renewal.",
    ],
    description:
      "Master intracellular antioxidant — supports detoxification, immunity, and cellular renewal.",
    image: "/images/products/glutathione.webp",
    imageAlt: "Logos RX Glutathione subcutaneous/intramuscular injection multi-dose vial",
    concentration: "200 mg/mL",
    form: "Injectable",
    size: "5 mL",
    activeIngredient: {
      name: "L-Glutathione (Reduced)",
      description:
        "The biologically active reduced form of glutathione — a tripeptide of glutamine, cysteine, and glycine that neutralizes free radicals and supports phase II hepatic detoxification.",
    },
    ingredientHighlights: [
      {
        title: "Tripeptide antioxidant",
        description:
          "Glutathione is the primary intracellular antioxidant in human cells — its reduced form donates electrons to neutralize free radicals.",
      },
      {
        title: "Detoxification cofactor",
        description:
          "Critical to phase II liver detoxification, supporting clearance of xenobiotics and reactive metabolites.",
      },
      {
        title: "Skin and immune support",
        description:
          "Commonly used in protocols aimed at skin clarity, immune balance, and cellular recovery.",
      },
    ],
    howToTake: SUBQ_HOW_TO_TAKE,
    variants: [{ vialTotalMg: "1,000 mg", concentration: "200 mg/mL", ml: "5 mL" }],
    variantColumns: ["vialTotalMg", "concentration", "ml"],
    dosageSchedule: {
      columns: ["weeks", "units", "mg", "ml", "directions"],
      rows: [
        { weeks: "1–4", units: "25", mg: "50 mg", ml: "0.25 mL", directions: "Inject 25 units (50 mg) subcutaneously or intramuscularly 2–3 times weekly." },
        { weeks: "5–8", units: "50", mg: "100 mg", ml: "0.50 mL", directions: "Inject 50 units (100 mg) subcutaneously or intramuscularly 2–3 times weekly." },
        { weeks: "9+", units: "100", mg: "200 mg", ml: "1 mL", directions: "Inject 100 units (200 mg) subcutaneously or intramuscularly 2–3 times weekly, or as directed by your provider." },
      ],
    },
    details: [
      { label: "How to Use", content: "Administer subcutaneously or intramuscularly as directed by your provider." },
      { label: "Size", content: "5 mL multi-dose vial (1,000 mg)" },
      { label: "Concentration", content: "200 mg/mL" },
      { label: "Schedule", content: "Two to three times weekly, as prescribed." },
      { label: "BUD", content: "Refer to the vial label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "Why injectable glutathione instead of oral?",
        a: "Glutathione is poorly absorbed through the GI tract — oral bioavailability is limited. Injection bypasses GI breakdown and delivers intact glutathione for cellular uptake.",
      },
      {
        q: "Is glutathione safe to combine with other therapies?",
        a: "Glutathione is commonly used alongside NAD+, B-vitamin, and other wellness injectable protocols. Your provider will coordinate dosing across your regimen.",
      },
    ],
    relatedSlugs: ["cyanocobalamin-b12", "nad-plus", "sermorelin"],
  },

  {
    slug: "cyanocobalamin-b12",
    name: "Cyanocobalamin",
    modifier: "Commercially available Vitamin B12",
    modifierStyle: "subtitle",
    category: "Wellness",
    categoryKey: "Injectable",
    badges: [{ label: "Commercial", variant: "commercial" }],
    tagline:
      "A stable, commercially available form of injectable vitamin B12 used to restore and maintain healthy B12 status.",
    heroBullets: [
      "Converted to the active coenzymes methylcobalamin and 5-deoxyadenosylcobalamin",
      "Supports red blood cell formation, DNA synthesis, and CNS function",
      "Restores B12 status in deficiency, malabsorption, or dietary insufficiency",
      "1,000 mcg/mL multi-dose vial",
    ],
    descriptionParagraphs: [
      "Cyanocobalamin is a stable, synthetic form of vitamin B12 that is converted in the body into the active cobalamin coenzymes methylcobalamin and 5-deoxyadenosylcobalamin. Vitamin B12 is essential for healthy red blood cell formation, DNA synthesis, central nervous system function, myelin support, and normal cellular metabolism. Clinically, cyanocobalamin is commonly used to restore and maintain adequate B12 status in patients with deficiency, malabsorption, increased requirements, or dietary insufficiency.",
      "Mechanistically, vitamin B12 serves as a key cofactor for methionine synthase and L-methylmalonyl-CoA mutase. Through these pathways, it supports methylation, homocysteine metabolism, fatty acid metabolism, neurologic integrity, and hematopoiesis. Deficiency can present with fatigue, weakness, glossitis, megaloblastic anemia, numbness or tingling, balance changes, cognitive symptoms, and neurologic findings that may occur even before anemia is obvious.",
      "From a clinical standpoint, cyanocobalamin is especially relevant in patients with pernicious anemia, gastric or intestinal surgery, gastrointestinal malabsorption, long-term metformin or acid-suppressing medication use, vegetarian or vegan dietary patterns, and other conditions that impair B12 intake or absorption. Because absorption of food-bound B12 depends on gastric acid, intrinsic factor, and distal ileal function, injectable or other clinician-directed forms may be preferred when absorption is unreliable.",
    ],
    description:
      "Commercially available injectable vitamin B12 used to restore and maintain healthy B12 status.",
    image: "/images/products/cyanocobalamin-b12.webp",
    imageAlt: "Logos RX Cyanocobalamin Vitamin B12 injection multi-dose vial",
    concentration: "1,000 mcg/mL",
    form: "Injectable",
    size: "10 mL",
    activeIngredient: {
      name: "Cyanocobalamin (Vitamin B12)",
      description:
        "A stable, synthetic form of vitamin B12 converted in the body into the active cobalamin coenzymes methylcobalamin and 5-deoxyadenosylcobalamin — a key cofactor for methionine synthase and L-methylmalonyl-CoA mutase.",
    },
    ingredientHighlights: [
      {
        title: "Essential methylation cofactor",
        description:
          "Serves as a cofactor for methionine synthase and L-methylmalonyl-CoA mutase, supporting methylation, homocysteine metabolism, and fatty acid metabolism.",
      },
      {
        title: "Hematopoiesis and nerve health",
        description:
          "Essential for healthy red blood cell formation, DNA synthesis, myelin support, and neurologic integrity.",
      },
      {
        title: "Reliable when absorption is impaired",
        description:
          "Injectable B12 bypasses dependence on gastric acid, intrinsic factor, and ileal function — preferred when food-bound B12 absorption is unreliable.",
      },
    ],
    howToTake: SUBQ_HOW_TO_TAKE,
    variants: [{ vialTotalMg: "10,000 mcg", concentration: "1,000 mcg/mL", ml: "10 mL" }],
    variantColumns: ["vialTotalMg", "concentration", "ml"],
    dosageSchedule: {
      columns: ["weeks", "units", "mg", "ml", "directions"],
      rows: [
        {
          weeks: "1–4",
          units: "50",
          mg: "500 mcg",
          ml: "0.50 mL",
          directions: "Inject 50 units subcutaneously or intramuscularly once daily, Monday through Friday.",
        },
      ],
    },
    details: [
      { label: "How to Use", content: "Administer subcutaneously or intramuscularly as directed by your provider." },
      { label: "Size", content: "10 mL multi-dose vial (1,000 mcg/mL)" },
      { label: "Concentration", content: "1,000 mcg/mL" },
      { label: "Schedule", content: "Once daily, Monday through Friday, or as prescribed." },
      { label: "BUD", content: "Refer to the vial label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "Why choose injectable B12 over oral supplements?",
        a: "Absorption of food-bound and oral B12 depends on gastric acid, intrinsic factor, and distal ileal function. Injectable cyanocobalamin bypasses these steps, making it preferable when absorption is unreliable — such as in pernicious anemia, after GI surgery, or with long-term metformin or acid-suppressing medication use.",
      },
      {
        q: "Who is most likely to need B12 repletion?",
        a: "Patients with deficiency, malabsorption, increased requirements, or dietary insufficiency — including vegetarian or vegan diets. Deficiency can cause fatigue, weakness, numbness or tingling, and cognitive changes, sometimes before anemia appears.",
      },
    ],
    relatedSlugs: ["glutathione", "nad-plus", "semaglutide-glycine"],
  },

  {
    slug: "low-dose-naltrexone",
    name: "Low-Dose Naltrexone",
    category: "Wellness",
    categoryKey: "Oral Capsules",
    tagline:
      "Compounded low-dose naltrexone (LDN) to support immune balance, inflammation modulation, and well-being.",
    heroBullets: [
      "Compounded ultra-low dose of naltrexone (1.5–4.5 mg)",
      "Used in functional, autoimmune, and metabolic medicine protocols",
      "Modulates immune response and inflammation pathways",
      "Three capsule strengths: 1.5 mg, 3.0 mg, and 4.5 mg",
    ],
    descriptionParagraphs: [
      "Low-Dose Naltrexone (LDN) is a compounded formulation of the opioid receptor antagonist Naltrexone, administered at a fraction of its standard dose to modulate immune function, reduce inflammation, and improve cellular repair.",
      "At low doses (typically 1.5–4.5 mg), Naltrexone temporarily blocks opioid receptors, triggering a rebound increase in the body's production of endorphins and enkephalins. These natural peptides help regulate immune response, reduce chronic inflammation, and improve mood and pain tolerance.",
      "LDN is widely used in functional, autoimmune, and metabolic medicine protocols to support overall wellness, immune balance, and neurological health.",
    ],
    description:
      "Compounded low-dose naltrexone for immune balance, inflammation modulation, and well-being.",
    image: "/images/products/low-dose-naltrexone.webp",
    imageAlt: "Logos RX Low-Dose Naltrexone oral capsules",
    concentration: "1.5 mg / 3.0 mg / 4.5 mg",
    form: "Oral Capsules",
    size: "As prescribed",
    activeIngredient: {
      name: "Naltrexone (Low Dose)",
      description:
        "A pure opioid receptor antagonist compounded at a low dose; the brief receptor blockade is thought to trigger a rebound rise in endogenous endorphins and enkephalins.",
    },
    ingredientHighlights: [
      {
        title: "Endorphin rebound",
        description:
          "Transient receptor blockade at low doses appears to upregulate endogenous opioid production, which may influence immune signaling.",
      },
      {
        title: "Immune modulation",
        description:
          "Often used in functional and integrative protocols for autoimmune balance and chronic inflammation.",
      },
      {
        title: "Bedtime dosing",
        description:
          "Typically taken nightly. Avoid late-day dosing if it disrupts sleep — your provider can adjust timing.",
      },
    ],
    howToTake: ORAL_HOW_TO_TAKE(
      "Take one capsule (1.5 mg) by mouth nightly before bed, then titrate per your provider's instructions. Avoid late-day dosing to prevent insomnia.",
    ),
    variants: [
      { strength: "1.5 mg", form: "Capsules", quantity: "As prescribed" },
      { strength: "3.0 mg", form: "Capsules", quantity: "As prescribed" },
      { strength: "4.5 mg", form: "Capsules", quantity: "As prescribed" },
    ],
    variantColumns: ["strength", "form", "quantity"],
    dosageSchedule: {
      columns: ["weeks", "mg", "directions"],
      rows: [
        { weeks: "1–2", mg: "1.5 mg daily", directions: "Take one capsule (1.5 mg) by mouth nightly before bed." },
        { weeks: "3–4", mg: "3.0 mg daily", directions: "Increase to one capsule (3 mg) nightly as tolerated." },
        { weeks: "5+", mg: "4.5 mg daily", directions: "Maintain one capsule (4.5 mg) nightly before bed, or as directed by provider." },
      ],
      note: "Avoid late-day dosing to prevent insomnia.",
    },
    details: [
      { label: "How to Use", content: "Take orally at bedtime, titrating up as tolerated under provider direction." },
      { label: "Strengths", content: "1.5 mg, 3.0 mg, or 4.5 mg capsules" },
      { label: "Form", content: "Oral capsules" },
      { label: "Schedule", content: "Once nightly, titrated as tolerated." },
      { label: "BUD", content: "Refer to the dispensing label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "How is LDN different from standard-dose naltrexone?",
        a: "Standard naltrexone (50 mg) is used to block opioid effects in addiction medicine. At ultra-low doses, the mechanism shifts toward immune and endorphin modulation rather than full receptor blockade.",
      },
      {
        q: "Why is bedtime dosing recommended?",
        a: "The endogenous endorphin rebound is thought to align best with overnight rest; some patients also report vivid dreams or transient sleep disturbance during titration.",
      },
    ],
    relatedSlugs: ["nad-plus", "glutathione"],
  },

  /* ───── Dermatology / Hair ───── */
  {
    slug: "minoxidil",
    name: "Minoxidil",
    modifier: "Generic Loniten",
    modifierStyle: "generic",
    category: "Dermatology",
    categoryKey: "Oral Tablets",
    tagline:
      "Low-dose oral minoxidil to stimulate hair regrowth and slow the progression of androgenic alopecia.",
    heroBullets: [
      "Vasodilator that promotes hair follicle perfusion",
      "Slows androgenic alopecia in men and women",
      "Improves compliance vs. topical use",
      "Low-dose 2.5 mg oral tablets",
    ],
    descriptionParagraphs: [
      "Minoxidil is a well-established vasodilator used to stimulate hair growth and slow the progression of androgenic alopecia (male and female pattern hair loss). Originally developed as an antihypertensive, it was later discovered to promote new hair growth by increasing blood flow and nutrient delivery to hair follicles and extending the anagen (growth) phase of the hair cycle.",
      "Minoxidil is available in both oral and topical forms, with the topical 5% solution or foam being FDA-approved for hair regrowth. Oral low-dose Minoxidil (LDOM) has emerged as an effective off-label option for patients seeking enhanced results or improved compliance compared to daily topical use.",
    ],
    description:
      "Low-dose oral minoxidil to stimulate hair regrowth and slow hair loss.",
    image: "/images/products/minoxidil.webp",
    imageAlt: "Logos RX Minoxidil oral tablets",
    concentration: "2.5 mg",
    form: "Oral Tablets",
    size: "As prescribed",
    activeIngredient: {
      name: "Minoxidil",
      description:
        "A vasodilator originally used for hypertension that, at low oral doses, extends the anagen phase of the hair cycle and supports follicle health.",
    },
    ingredientHighlights: [
      {
        title: "Extends anagen phase",
        description:
          "Minoxidil lengthens the active growth phase of the hair cycle, increasing the proportion of follicles producing visible hair.",
      },
      {
        title: "Improved compliance",
        description:
          "Oral dosing avoids the daily topical routine that many patients find difficult to maintain — a leading cause of treatment failure with topical minoxidil.",
      },
      {
        title: "Used by men and women",
        description:
          "Low-dose oral minoxidil is prescribed off-label for both male and female pattern hair loss, often as part of a multi-modal regimen.",
      },
    ],
    howToTake: ORAL_HOW_TO_TAKE(
      "Take one tablet (2.5–5 mg) by mouth daily, as prescribed by your provider.",
    ),
    variants: [{ strength: "2.5 mg", form: "Tablets", quantity: "As prescribed" }],
    variantColumns: ["strength", "form", "quantity"],
    dosageSchedule: {
      columns: ["weeks", "mg", "directions"],
      rows: [
        {
          weeks: "Daily",
          mg: "2.5 mg daily",
          directions: "Take one tablet (2.5–5 mg) by mouth daily, as prescribed by provider.",
        },
      ],
    },
    details: [
      { label: "How to Use", content: "Take orally once daily; report any swelling, palpitations, or excessive hair growth to your provider." },
      { label: "Strengths", content: "2.5 mg tablets" },
      { label: "Form", content: "Oral tablets" },
      { label: "Schedule", content: "Once daily, or as prescribed." },
      { label: "BUD", content: "Refer to the dispensing label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "How long until I see results?",
        a: "Most patients notice early changes (reduced shedding, baby-hair regrowth) at 3–6 months. Maximal benefit typically requires 9–12 months of consistent use.",
      },
      {
        q: "Are there side effects I should watch for?",
        a: "Low-dose oral minoxidil is generally well-tolerated. Potential effects include fine body hair growth, mild ankle swelling, palpitations, or lightheadedness — report any of these to your provider.",
      },
    ],
    relatedSlugs: ["finasteride"],
  },

  {
    slug: "finasteride",
    name: "Finasteride",
    modifier: "Commercial",
    modifierStyle: "generic",
    category: "Dermatology",
    categoryKey: "Oral Tablets",
    tagline:
      "A 5-alpha-reductase inhibitor that slows hair loss and preserves existing follicles by lowering DHT.",
    heroBullets: [
      "5-alpha-reductase inhibitor (decreases DHT)",
      "FDA-approved for androgenic alopecia in men",
      "Commercial 1 mg tablet",
      "Frequently paired with low-dose oral minoxidil",
    ],
    descriptionParagraphs: [
      "Finasteride is a 5-alpha-reductase inhibitor that decreases the conversion of testosterone to dihydrotestosterone (DHT), the hormone responsible for male-pattern hair loss (androgenic alopecia). By lowering scalp and serum DHT levels, Finasteride helps slow hair loss, promote regrowth, and preserve existing hair follicles.",
      "This commercially available 1 mg formulation is FDA-approved for androgenic alopecia in men and is frequently prescribed as part of long-term hair restoration programs or in combination with topical therapies for enhanced results.",
    ],
    description:
      "5-alpha-reductase inhibitor that slows hair loss and preserves follicles by lowering DHT.",
    image: "/images/products/finasteride.webp",
    imageAlt: "Logos RX Finasteride 1 mg oral tablets",
    concentration: "1 mg",
    form: "Oral Tablets",
    size: "As prescribed",
    activeIngredient: {
      name: "Finasteride",
      description:
        "A selective Type II 5-alpha-reductase inhibitor that blocks the conversion of testosterone to DHT.",
    },
    ingredientHighlights: [
      {
        title: "DHT suppression",
        description:
          "Finasteride lowers scalp and serum DHT, the primary driver of follicular miniaturization in androgenic alopecia.",
      },
      {
        title: "FDA-approved for hair loss",
        description:
          "The 1 mg dose is FDA-approved for androgenic alopecia in men, with decades of clinical use behind it.",
      },
      {
        title: "Combo-friendly",
        description:
          "Commonly paired with minoxidil for additive effect — different mechanisms address different aspects of the hair cycle.",
      },
    ],
    howToTake: ORAL_HOW_TO_TAKE(
      "Take one tablet (1 mg) by mouth once daily. May be taken with or without food.",
    ),
    variants: [{ strength: "1 mg", form: "Tablets", quantity: "As prescribed" }],
    variantColumns: ["strength", "form", "quantity"],
    dosageSchedule: {
      columns: ["weeks", "mg", "directions"],
      rows: [
        {
          weeks: "Daily",
          mg: "1 mg daily",
          directions: "Take one tablet (1 mg) by mouth once daily. May be taken with or without food.",
        },
      ],
    },
    details: [
      { label: "How to Use", content: "Take orally once daily, with or without food." },
      { label: "Strengths", content: "1 mg tablets" },
      { label: "Form", content: "Oral tablets" },
      { label: "Schedule", content: "Once daily." },
      { label: "BUD", content: "Refer to the dispensing label for the beyond-use date." },
    ],
    faqs: [
      {
        q: "How long should I take finasteride to see results?",
        a: "Most patients see meaningful changes at 6–12 months of consistent daily use. Stopping therapy typically returns the hair cycle to its pre-treatment trajectory within 6–12 months.",
      },
      {
        q: "Can finasteride be combined with minoxidil?",
        a: "Yes — combination therapy is common. The two address different parts of the hair cycle and are often more effective together than either alone.",
      },
    ],
    relatedSlugs: ["minoxidil"],
  },
];

/* ───────────────────────── Selectors ───────────────────────── */

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/**
 * Related products for `/products/[slug]`. Prefers explicit `relatedSlugs`
 * if provided; otherwise falls back to "first three other products in the
 * same therapeutic area, then anything else".
 */
export function getRelatedProducts(currentSlug: string): Product[] {
  const current = getProductBySlug(currentSlug);
  if (!current) return [];

  if (current.relatedSlugs?.length) {
    const explicit = current.relatedSlugs
      .map(getProductBySlug)
      .filter((p): p is Product => Boolean(p));
    if (explicit.length) return explicit.slice(0, 3);
  }

  const sameArea = products.filter(
    (p) => p.slug !== currentSlug && p.category === current.category,
  );
  const others = products.filter(
    (p) => p.slug !== currentSlug && p.category !== current.category,
  );
  return [...sameArea, ...others].slice(0, 3);
}

export function getProductsByCategory(category: Category): Product[] {
  if (category === "All Products") return products;
  return products.filter((p) => p.category === category);
}

/**
 * Slugs surfaced to the *public* (signed-out) homepage. The full catalog is
 * gated behind an approved clinic account, so anonymous visitors only see a
 * curated teaser of three flagship products plus a "view full catalog" CTA
 * that routes them into account creation. Order here drives display order.
 */
export const PUBLIC_FEATURED_SLUGS = [
  "enclomiphene-citrate",
  "nad-plus",
  "sermorelin",
] as const;

/** Resolves `PUBLIC_FEATURED_SLUGS` to full products, preserving order. */
export function getPublicFeaturedProducts(): Product[] {
  return PUBLIC_FEATURED_SLUGS.map(getProductBySlug).filter(
    (p): p is Product => Boolean(p),
  );
}
