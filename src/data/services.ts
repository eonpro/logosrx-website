/**
 * Service-line content — the capability tier of the national authority layer.
 *
 * Each service maps to a real product `Category` so the page can render live,
 * cross-linked products from `products.ts` (no duplicated data). Services are
 * framed by CAPABILITY ("we compound X dosage forms for this area"), never by
 * disease-treatment outcome — compounded (503A) preparations are not
 * FDA-approved and we make no efficacy/cure claims. A unit test enforces that
 * every `productCategory` is a valid catalog category.
 */

import type { Category } from "@/data/products";

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface Service {
  slug: string;
  name: string;
  /** Catalog category used to pull related products. */
  productCategory: Category;
  eyebrow: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  /** Answer-first TL;DR — self-contained, AI-extractable. */
  answerFirst: string;
  intro: string[];
  /** Dosage forms / capabilities we compound for this area (compliant framing). */
  whatWeCompound: string[];
  faqs: ServiceFaq[];
  related: { label: string; href: string }[];
}

export const services: Service[] = [
  {
    slug: "hormone-replacement-therapy",
    name: "Hormone Replacement Therapy",
    productCategory: "Hormone Replacement",
    eyebrow: "Service",
    metaTitle: "Compounded Hormone Replacement Therapy (HRT / BHRT)",
    metaDescription:
      "Logos RX compounds personalized hormone replacement therapy — custom strengths and dosage forms prescribed by your provider. 503A compounding in Tampa, shipped nationwide.",
    headline: "Compounded Hormone Replacement Therapy",
    answerFirst:
      "Logos RX compounds personalized hormone replacement therapy (HRT/BHRT) to a provider's prescription, preparing custom strengths and dosage forms — capsules, troches, topical creams, and injectables — that commercial products may not offer. As a 503A pharmacy in Tampa, we compound each preparation per patient and ship within our 25 licensed states. All HRT requires a prescription.",
    intro: [
      "Hormone needs are individual, and a one-size-fits-all commercial product doesn't always match what a provider wants to prescribe. Compounding lets the prescriber specify the exact hormone, strength, and delivery form for each patient — and lets Logos RX prepare it to that specification.",
      "We compound bioidentical hormone formulations in multiple dosage forms so providers can tailor therapy to the patient's preference and clinical plan. Every preparation is made to order under USP standards and requires a valid prescription.",
    ],
    whatWeCompound: [
      "Custom-strength capsules",
      "Sublingual troches",
      "Topical and transdermal creams/gels",
      "Injectable formulations (sterile)",
      "Dye-free / allergen-conscious bases",
      "Combination formulations",
    ],
    faqs: [
      {
        question: "What is compounded BHRT?",
        answer:
          "Compounded bioidentical hormone replacement therapy uses hormones structurally identical to those the body produces, prepared by a compounding pharmacy in custom strengths and forms to a prescriber's specification. It requires a prescription and is not FDA-approved.",
      },
      {
        question: "Do you offer HRT in different forms?",
        answer:
          "Yes. Depending on the prescription, we can compound HRT as capsules, troches, topical creams, or sterile injectables.",
      },
    ],
    related: [
      { label: "What is a compounding pharmacy?", href: "/compounding-pharmacy" },
      { label: "BHRT (glossary)", href: "/glossary/bhrt" },
      { label: "Locations we serve", href: "/locations" },
    ],
  },
  {
    slug: "medical-weight-management",
    name: "Medical Weight Management",
    productCategory: "Weight Loss",
    eyebrow: "Service",
    metaTitle: "Compounded Medical Weight Management Formulations",
    metaDescription:
      "Logos RX compounds personalized weight-management formulations prescribed by your provider — custom strengths and combinations. 503A compounding in Tampa, shipped nationwide.",
    headline: "Compounded Weight Management Formulations",
    answerFirst:
      "Logos RX compounds personalized medical weight-management formulations to a provider's prescription, including custom strengths and combinations prepared per patient. As a 503A pharmacy in Tampa with sterile and non-sterile labs, we prepare each formulation under USP standards and ship within our 25 licensed states. These are prescription-only and not FDA-approved.",
    intro: [
      "Providers managing weight increasingly use compounded formulations to tailor therapy — adjusting strengths, simplifying regimens by combining supportive ingredients, or preparing patient-friendly delivery forms. Logos RX compounds these to the exact prescription.",
      "Weight management is a clinical decision made between a patient and their provider. Our role is to compound the prescribed formulation accurately and safely; we don't provide medical advice or determine therapy.",
    ],
    whatWeCompound: [
      "Custom-strength injectable formulations (sterile)",
      "Combination formulations with supportive ingredients",
      "Titration-friendly concentrations",
      "Patient-specific dosing preparations",
    ],
    faqs: [
      {
        question: "Are compounded weight-management medications FDA-approved?",
        answer:
          "No. Compounded preparations are not FDA-approved. They are prepared by a licensed compounding pharmacy to a prescriber's specification and require a valid prescription.",
      },
      {
        question: "How do I start?",
        answer:
          "Weight-management therapy must be prescribed by a licensed provider. If you have a prescriber, they can send the prescription to Logos RX; if not, contact us and we can help you find one.",
      },
    ],
    related: [
      { label: "Exploring GLP-1 (article)", href: "/support/exploring-glp1-weight-management" },
      { label: "What is a compounding pharmacy?", href: "/compounding-pharmacy" },
      { label: "Locations we serve", href: "/locations" },
    ],
  },
  {
    slug: "peptide-therapy",
    name: "Peptide Therapy",
    productCategory: "Peptide Therapy",
    eyebrow: "Service",
    metaTitle: "Compounded Peptide Therapy Formulations",
    metaDescription:
      "Logos RX compounds personalized peptide formulations prescribed by your provider — sterile injectables prepared under USP <797>. 503A compounding in Tampa, shipped nationwide.",
    headline: "Compounded Peptide Therapy",
    answerFirst:
      "Logos RX compounds personalized peptide formulations to a provider's prescription, typically as sterile injectables prepared under USP <797> in our dedicated sterile lab. As a 503A pharmacy in Tampa, we prepare each peptide preparation per patient and ship within our 25 licensed states. Peptide therapy is prescription-only and not FDA-approved.",
    intro: [
      "Peptides are short chains of amino acids that providers prescribe as part of individualized treatment plans. Because many peptide preparations are injectable, they require sterile compounding — which Logos RX performs in a dedicated USP <797> lab.",
      "We compound peptide formulations to the prescriber's exact specification, with sterility and potency handled under our quality program. A valid prescription is required.",
    ],
    whatWeCompound: [
      "Sterile injectable peptide formulations",
      "Custom concentrations for titration",
      "Combination preparations where prescribed",
      "Patient-specific vial sizing",
    ],
    faqs: [
      {
        question: "Why does peptide therapy require sterile compounding?",
        answer:
          "Most peptide preparations are injected, so they must be free of contaminants. Logos RX prepares them in a USP <797> sterile compounding lab.",
      },
    ],
    related: [
      { label: "Sterile compounding (USP <797>)", href: "/compounding-pharmacy/sterile-compounding" },
      { label: "Peptide therapy (glossary)", href: "/glossary/peptide-therapy" },
      { label: "Sermorelin (article)", href: "/support/sermorelin-growth-hormone-peptide-therapy" },
    ],
  },
  {
    slug: "longevity-wellness",
    name: "Longevity & Wellness",
    productCategory: "Longevity",
    eyebrow: "Service",
    metaTitle: "Compounded Longevity & Wellness Formulations",
    metaDescription:
      "Logos RX compounds personalized longevity and wellness formulations prescribed by your provider — including NAD+ and nutrient injectables. 503A compounding in Tampa.",
    headline: "Compounded Longevity & Wellness Formulations",
    answerFirst:
      "Logos RX compounds personalized longevity and wellness formulations to a provider's prescription — including injectable preparations such as NAD+ and nutrient injections — prepared under USP standards in our Tampa labs. Each preparation is made per patient, requires a prescription, and is not FDA-approved.",
    intro: [
      "Longevity-focused providers prescribe a range of compounded preparations to support individualized wellness plans. Logos RX compounds these to specification, including sterile injectables prepared in our USP <797> lab.",
      "As with all our services, we compound what a provider prescribes; we don't make therapeutic claims about outcomes.",
    ],
    whatWeCompound: [
      "Injectable nutrient and cofactor formulations (sterile)",
      "NAD+ injectable preparations",
      "Custom-strength capsules",
      "Combination wellness formulations",
    ],
    faqs: [
      {
        question: "Do you compound NAD+?",
        answer:
          "Yes, when prescribed. NAD+ is commonly compounded as a sterile injectable and prepared in our USP <797> lab. It requires a prescription and is not FDA-approved.",
      },
    ],
    related: [
      { label: "Understanding NAD+ (article)", href: "/support/understanding-nad-cellular-vitality" },
      { label: "What is a compounding pharmacy?", href: "/compounding-pharmacy" },
      { label: "Locations we serve", href: "/locations" },
    ],
  },
  {
    slug: "dermatology",
    name: "Dermatology & Skin Health",
    productCategory: "Dermatology",
    eyebrow: "Service",
    metaTitle: "Compounded Dermatology Formulations",
    metaDescription:
      "Logos RX compounds personalized dermatology formulations prescribed by your provider — custom topical strengths and combinations. 503A compounding in Tampa, shipped nationwide.",
    headline: "Compounded Dermatology Formulations",
    answerFirst:
      "Logos RX compounds personalized dermatology formulations to a provider's prescription — primarily custom topical preparations in strengths and combinations commercial products may not offer. As a 503A pharmacy in Tampa, we prepare each per patient under USP <795> and ship within our 25 licensed states. Prescription required; not FDA-approved.",
    intro: [
      "Dermatology is a classic use case for compounding: providers frequently want a specific active strength, a combination of actives in one base, or a vehicle suited to a particular skin type — none of which may exist as a commercial product. Logos RX prepares these to the prescription.",
      "Topical dermatology preparations are non-sterile and compounded under USP <795> in our dedicated lab.",
    ],
    whatWeCompound: [
      "Custom-strength topical creams and gels",
      "Combination topical formulations",
      "Allergen-conscious / preservative-free bases",
      "Specialty vehicles for different skin types",
    ],
    faqs: [
      {
        question: "Can you combine multiple actives into one topical?",
        answer:
          "When a provider prescribes it, yes — combining compatible actives into a single base is a common compounded dermatology preparation.",
      },
    ],
    related: [
      { label: "Non-sterile compounding (USP <795>)", href: "/compounding-pharmacy/non-sterile-compounding" },
      { label: "What is a compounding pharmacy?", href: "/compounding-pharmacy" },
      { label: "Locations we serve", href: "/locations" },
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
