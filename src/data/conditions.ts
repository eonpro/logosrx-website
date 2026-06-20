/**
 * Condition cluster — the most compliance-sensitive content tier.
 *
 * ⚠️ COMPLIANCE POSTURE (read before editing):
 * These pages exist for SEO/AEO discovery ("compounding for menopause") but MUST
 * NOT read as drug advertising or make therapeutic claims. 503A compounded
 * preparations are NOT FDA-approved and we make NO efficacy, safety, superiority,
 * or cure claims. Every page therefore:
 *   - describes the condition NEUTRALLY (what it is) — educational, not promotional;
 *   - frames compounding as CUSTOMIZATION a provider may choose (strength, form,
 *     allergen-free base), never as a treatment that works for the condition;
 *   - attributes all clinical decisions to "your provider";
 *   - carries the standalone <MedicalDisclaimer> on-page.
 * `linkedConditions` in `services.ts` is the inverse mapping. A unit test enforces
 * that every `serviceSlug` resolves to a real service. KEEP THIS LEGAL-REVIEWABLE:
 * if in doubt, weaken the claim.
 */

export interface ConditionFaq {
  question: string;
  answer: string;
}

export interface Condition {
  slug: string;
  /** Display name, e.g. "Menopause & Perimenopause". */
  name: string;
  /** The medical entity name for `MedicalCondition` schema. */
  conditionName: string;
  alternateName?: string;
  /** Service line this condition maps to (for cross-linking). */
  serviceSlug: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  /** Answer-first TL;DR — compliant, capability-framed, AI-extractable. */
  answerFirst: string;
  /** Neutral, educational description of the condition (no product claims). */
  about: string[];
  /** How compounding lets a provider personalize care (capability, not efficacy). */
  personalization: string[];
  /** Dosage forms / approaches a provider MAY prescribe (not recommendations). */
  compoundedOptions: string[];
  faqs: ConditionFaq[];
  related: { label: string; href: string }[];
}

export const conditions: Condition[] = [
  {
    slug: "menopause",
    name: "Menopause & Perimenopause",
    conditionName: "Menopause",
    alternateName: "Perimenopause",
    serviceSlug: "hormone-replacement-therapy",
    metaTitle: "Compounding for Menopause & Perimenopause",
    metaDescription:
      "Learn how compounding lets providers personalize hormone therapy for menopause and perimenopause. Logos RX compounds to prescription — not FDA-approved; consult your provider.",
    headline: "Compounding for Menopause & Perimenopause",
    answerFirst:
      "When a provider prescribes hormone therapy during menopause or perimenopause, a compounding pharmacy like Logos RX can prepare it in a custom strength or dosage form that commercial products may not offer. Compounding personalizes how a prescription is made — it is not a treatment Logos RX recommends, and compounded preparations are not FDA-approved. All therapy decisions are made between a patient and their licensed provider.",
    about: [
      "Menopause is the natural end of menstrual cycles, confirmed after 12 consecutive months without a period; perimenopause is the transition leading up to it. Both are associated with changing hormone levels.",
      "How (and whether) to address symptoms is an individual clinical decision. Many providers prescribe hormone therapy; some patients prefer specific strengths, combinations, or delivery forms that aren't available commercially.",
    ],
    personalization: [
      "Custom hormone strengths specified by the prescriber",
      "Alternative dosage forms (capsules, troches, topical creams)",
      "Dye-free or allergen-conscious bases",
      "Combination formulations where prescribed",
    ],
    compoundedOptions: [
      "Bioidentical hormone formulations (when prescribed)",
      "Topical/transdermal preparations",
      "Sublingual troches",
      "Custom-strength capsules",
    ],
    faqs: [
      {
        question: "Does Logos RX treat menopause?",
        answer:
          "No. Logos RX is a compounding pharmacy — we prepare medications to a provider's prescription. Diagnosis and treatment decisions are made by your licensed provider. Compounded preparations are not FDA-approved.",
      },
      {
        question: "Is compounded hormone therapy better than commercial products?",
        answer:
          "We make no claim that compounded preparations are safer or more effective than FDA-approved products. Compounding is used when a provider wants a strength, form, or combination that isn't commercially available.",
      },
    ],
    related: [
      { label: "Hormone Replacement Therapy (service)", href: "/services/hormone-replacement-therapy" },
      { label: "BHRT (glossary)", href: "/glossary/bhrt" },
      { label: "Guide to HRT (article)", href: "/support/guide-hormone-replacement-therapy" },
    ],
  },
  {
    slug: "low-testosterone",
    name: "Low Testosterone",
    conditionName: "Testosterone Deficiency",
    alternateName: "Hypogonadism",
    serviceSlug: "hormone-replacement-therapy",
    metaTitle: "Compounding for Low Testosterone",
    metaDescription:
      "How compounding lets providers personalize testosterone therapy. Logos RX compounds to prescription — not FDA-approved; therapy decisions are made with your provider.",
    headline: "Compounding for Low Testosterone",
    answerFirst:
      "When a provider prescribes testosterone therapy, Logos RX can compound it in custom strengths or dosage forms to that prescription. Compounding personalizes preparation; it is not a treatment Logos RX recommends, and compounded preparations are not FDA-approved. A licensed provider diagnoses low testosterone and decides on therapy.",
    about: [
      "Low testosterone (sometimes called hypogonadism) refers to testosterone levels below a clinically defined range, diagnosed by a provider using lab testing and symptoms.",
      "Providers who prescribe testosterone therapy sometimes use compounding to tailor the strength or delivery form to an individual patient's plan.",
    ],
    personalization: [
      "Custom-strength injectable formulations (sterile)",
      "Topical preparations where prescribed",
      "Titration-friendly concentrations",
      "Patient-specific vial sizing",
    ],
    compoundedOptions: [
      "Sterile injectable testosterone formulations (when prescribed)",
      "Custom topical preparations",
      "Combination formulations where clinically directed",
    ],
    faqs: [
      {
        question: "Can I get testosterone without a prescription?",
        answer:
          "No. Testosterone is a controlled substance and requires a valid prescription from a licensed provider. Logos RX only compounds against a prescription.",
      },
    ],
    related: [
      { label: "Hormone Replacement Therapy (service)", href: "/services/hormone-replacement-therapy" },
      { label: "Compounding glossary", href: "/glossary" },
      { label: "Sterile compounding (USP <797>)", href: "/compounding-pharmacy/sterile-compounding" },
    ],
  },
  {
    slug: "weight-management",
    name: "Weight Management",
    conditionName: "Overweight and Obesity",
    serviceSlug: "medical-weight-management",
    metaTitle: "Compounding for Weight Management",
    metaDescription:
      "How compounding supports provider-directed weight management plans. Logos RX compounds to prescription — not FDA-approved; therapy is decided with your provider.",
    headline: "Compounding for Weight Management",
    answerFirst:
      "When a provider directs a medical weight-management plan, Logos RX can compound prescribed formulations in custom strengths or combinations. Compounding personalizes preparation; it is not a weight-loss program or a treatment Logos RX recommends, and compounded preparations are not FDA-approved. Eligibility and therapy are determined by a licensed provider.",
    about: [
      "Weight management is a clinical area where providers may prescribe medication alongside diet, activity, and behavioral support. Decisions about candidacy and therapy belong to the provider and patient.",
      "Some providers use compounded formulations to tailor a strength, simplify a regimen, or prepare a patient-specific delivery form.",
    ],
    personalization: [
      "Custom-strength injectable formulations (sterile)",
      "Combinations with supportive ingredients where prescribed",
      "Titration-friendly concentrations",
    ],
    compoundedOptions: [
      "Sterile injectable formulations (when prescribed)",
      "Patient-specific dosing preparations",
    ],
    faqs: [
      {
        question: "Does Logos RX offer a weight-loss program?",
        answer:
          "No. We are a compounding pharmacy, not a weight-loss clinic. A licensed provider determines whether therapy is appropriate and writes the prescription; we compound it.",
      },
      {
        question: "Are these medications FDA-approved?",
        answer:
          "Compounded preparations are not FDA-approved. They are prepared to a provider's prescription when a commercial product doesn't meet the patient's needs.",
      },
    ],
    related: [
      { label: "Medical Weight Management (service)", href: "/services/medical-weight-management" },
      { label: "Exploring GLP-1 (article)", href: "/support/exploring-glp1-weight-management" },
      { label: "What is a compounding pharmacy?", href: "/compounding-pharmacy" },
    ],
  },
  {
    slug: "hormone-imbalance",
    name: "Hormone Imbalance",
    conditionName: "Hormonal Imbalance",
    serviceSlug: "hormone-replacement-therapy",
    metaTitle: "Compounding for Hormone Imbalance",
    metaDescription:
      "How compounding lets providers personalize hormone prescriptions. Logos RX compounds to prescription — not FDA-approved; consult your licensed provider.",
    headline: "Compounding for Hormone Imbalance",
    answerFirst:
      "When a provider prescribes hormone therapy to address an imbalance, Logos RX can compound it in custom strengths and dosage forms. Compounding personalizes preparation; it is not a diagnosis or treatment Logos RX provides, and compounded preparations are not FDA-approved. Testing, diagnosis, and therapy are handled by a licensed provider.",
    about: [
      "\u201CHormone imbalance\u201D is a general term for hormone levels outside an expected range, evaluated by a provider through history, exam, and lab testing.",
      "Providers managing hormone therapy sometimes use compounding to match an individual patient's prescribed strength, form, or combination.",
    ],
    personalization: [
      "Custom strengths specified by the prescriber",
      "Multiple dosage forms (capsules, troches, topicals, injectables)",
      "Allergen-conscious bases",
      "Combination formulations where prescribed",
    ],
    compoundedOptions: [
      "Bioidentical hormone formulations (when prescribed)",
      "Topical and sublingual preparations",
      "Sterile injectables prepared under USP <797>",
    ],
    faqs: [
      {
        question: "Can Logos RX test my hormone levels?",
        answer:
          "No. Lab testing and diagnosis are performed by your provider. Logos RX compounds the medication your provider prescribes.",
      },
    ],
    related: [
      { label: "Hormone Replacement Therapy (service)", href: "/services/hormone-replacement-therapy" },
      { label: "Compounding glossary", href: "/glossary" },
      { label: "What is a compounding pharmacy?", href: "/compounding-pharmacy" },
    ],
  },
  {
    slug: "skin-health",
    name: "Skin Health",
    conditionName: "Dermatologic Conditions",
    serviceSlug: "dermatology",
    metaTitle: "Compounding for Skin Health",
    metaDescription:
      "How compounding lets dermatology providers personalize topical prescriptions. Logos RX compounds to prescription — not FDA-approved; consult your provider.",
    headline: "Compounding for Skin Health",
    answerFirst:
      "When a dermatology provider prescribes a topical preparation, Logos RX can compound it in a custom strength, combination, or base that commercial products may not offer. Compounding personalizes preparation; it is not a treatment Logos RX recommends, and compounded preparations are not FDA-approved. A licensed provider diagnoses and prescribes.",
    about: [
      "Dermatologic care covers a wide range of skin concerns. Providers frequently want a specific active strength, a combination of compatible actives, or a vehicle suited to a particular skin type.",
      "Compounding is a long-standing tool in dermatology for preparing these provider-specified topical formulations.",
    ],
    personalization: [
      "Custom-strength topical creams and gels",
      "Combination topical formulations",
      "Preservative-free / allergen-conscious bases",
      "Specialty vehicles for different skin types",
    ],
    compoundedOptions: [
      "Custom topical preparations (when prescribed)",
      "Combination actives in a single base where directed",
    ],
    faqs: [
      {
        question: "Can you make a custom prescription cream for my skin?",
        answer:
          "When your provider prescribes a specific topical formulation, yes — that's a common non-sterile compounding request prepared under USP <795>. We don't diagnose skin conditions or recommend products.",
      },
    ],
    related: [
      { label: "Dermatology (service)", href: "/services/dermatology" },
      { label: "Non-sterile compounding (USP <795>)", href: "/compounding-pharmacy/non-sterile-compounding" },
      { label: "What is a compounding pharmacy?", href: "/compounding-pharmacy" },
    ],
  },
];

export function getCondition(slug: string): Condition | undefined {
  return conditions.find((c) => c.slug === slug);
}

/** Conditions that map to a given service slug (inverse of `serviceSlug`). */
export function conditionsForService(serviceSlug: string): Condition[] {
  return conditions.filter((c) => c.serviceSlug === serviceSlug);
}
