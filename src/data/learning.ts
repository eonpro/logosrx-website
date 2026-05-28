/**
 * Patient-facing learning articles surfaced at `/learn/[slug]`.
 *
 * Each entry maps to a printed catalog "dosage explainer" sheet — a chart
 * that converts vial concentration (mg / mL) into the corresponding insulin
 * syringe units (1 unit = 0.01 mL). Patients receive the print sheet with
 * their first shipment; this URL is the digital counterpart.
 *
 * To add a new explainer: append an entry below with a `slug`, hero copy,
 * the body paragraphs, and an array of `DosageChartRow` entries — the
 * renderer pairs them with a centered insulin-syringe SVG.
 */

export interface DosageChartRow {
  /** Left-column milligram amount. */
  mg: string;
  /** Right-column milliliter amount (matches the unit tick on the syringe). */
  ml: string;
  /**
   * When true, the row is highlighted as the "reference" example called
   * out in the body copy (typically the maintenance dose).
   */
  emphasis?: boolean;
}

export interface LearningArticle {
  slug: string;
  title: string;
  drug: string;
  subtitle: string;
  /** Eyebrow above the title. */
  eyebrow: string;
  /** Drug concentration this chart targets (e.g. "2.5 mg / 20 mg/mL"). */
  concentrationLabel: string;
  /** Long-form description paragraphs (verbatim from the print sheet). */
  paragraphs: string[];
  /**
   * Reference equivalence sentence shown beneath the chart, e.g.
   * `"2.5 mg/mL = 2.5 mg of Semaglutide in 1.0 mL of liquid, or 100 units on an insulin syringe."`.
   */
  referenceEquivalence: string;
  /** Each row maps a mg value to its mL counterpart on a 100-unit syringe. */
  chartRows: DosageChartRow[];
  /** Slug of the related product (links the patient back to the product page). */
  relatedProductSlug: string;
  /** Body-link learn-more CTA text. */
  ctaLabel: string;
}

export const learningArticles: LearningArticle[] = [
  {
    slug: "semaglutide-dosage",
    drug: "Semaglutide",
    title: "Semaglutide Dosage",
    subtitle:
      "How to read the dosing scale for Semaglutide + Glycine using an insulin syringe.",
    eyebrow: "Learning",
    concentrationLabel: "2.5 mg / 20 mg/mL",
    paragraphs: [
      "Semaglutide + Glycine is administered as a subcutaneous injection using an insulin syringe. These syringes are measured in Units, not milliliters (mL), making it easier to deliver small, precise doses — ideal for medications such as Semaglutide.",
      "Although the syringe measures in Units, the medication strength is expressed in milligrams (mg) per milliliter (mL). Milligrams indicate the amount of active drug contained in the liquid, not the total volume of fluid.",
      "The dosage you receive will depend on the concentration of the vial.",
      "Always follow the specific dosing and titration instructions provided by your healthcare provider. Use only the correct insulin syringe to ensure accurate and consistent dosing.",
    ],
    referenceEquivalence:
      "2.5 mg/mL = 2.5 mg of Semaglutide in 1.0 mL of liquid, or 100 Units on an insulin syringe.",
    chartRows: [
      { mg: "0.25 mg", ml: "0.1 mL" },
      { mg: "0.50 mg", ml: "0.2 mL" },
      { mg: "0.75 mg", ml: "0.3 mL" },
      { mg: "1 mg", ml: "0.4 mL" },
      { mg: "1.25 mg", ml: "0.5 mL" },
      { mg: "1.5 mg", ml: "0.6 mL" },
      { mg: "1.75 mg", ml: "0.7 mL" },
      { mg: "2 mg", ml: "0.8 mL" },
      { mg: "2.25 mg", ml: "0.9 mL" },
      { mg: "2.5 mg", ml: "1 mL", emphasis: true },
    ],
    relatedProductSlug: "semaglutide-glycine",
    ctaLabel: "Learn more about Semaglutide + Glycine",
  },
  {
    slug: "tirzepatide-dosage",
    drug: "Tirzepatide",
    title: "Tirzepatide Dosage",
    subtitle:
      "How to read the dosing scale for Tirzepatide + Glycine using an insulin syringe.",
    eyebrow: "Learning",
    concentrationLabel: "10 mg / 20 mg/mL",
    paragraphs: [
      "Tirzepatide + Glycine is administered as a subcutaneous injection using an insulin syringe. These syringes are measured in Units, not milliliters (mL), making it easier to deliver small, precise doses — ideal for medications such as Tirzepatide.",
      "Although the syringe measures in Units, the medication strength is expressed in milligrams (mg) per milliliter (mL). Milligrams indicate the amount of active drug contained in the liquid, not the total volume of fluid.",
      "The dosage you receive will depend on the concentration of the vial.",
      "Always follow the specific dosing and titration instructions provided by your healthcare provider. Use only the correct insulin syringe to ensure accurate and consistent dosing.",
    ],
    referenceEquivalence:
      "10 mg/mL = 10 mg of Tirzepatide in 1.0 mL of liquid, or 100 Units on an insulin syringe.",
    chartRows: [
      { mg: "2.5 mg", ml: "0.25 mL" },
      { mg: "5 mg", ml: "0.5 mL" },
      { mg: "7.5 mg", ml: "0.75 mL" },
      { mg: "10 mg", ml: "1 mL", emphasis: true },
    ],
    relatedProductSlug: "tirzepatide-glycine",
    ctaLabel: "Learn more about Tirzepatide + Glycine",
  },
];

export function getLearningArticle(slug: string): LearningArticle | undefined {
  return learningArticles.find((a) => a.slug === slug);
}
