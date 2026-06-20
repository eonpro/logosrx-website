/**
 * Home-page FAQ — single source of truth for both the rendered accordion
 * (`<FAQ>`) and the `FAQPage` JSON-LD emitted on the home page. Keeping one copy
 * means the structured data AI engines extract is always identical to what users
 * read (Google penalizes FAQ schema that doesn't match visible content).
 *
 * Answers are written answer-first and self-contained so LLMs can lift them
 * verbatim. Keep them factual and compliant — no efficacy/cure claims for
 * compounded (503A, non-FDA-approved) preparations.
 */

export interface Faq {
  question: string;
  answer: string;
}

export const homeFaqs: Faq[] = [
  {
    question: "What is a compounding pharmacy?",
    answer:
      "A compounding pharmacy creates personalized medications tailored to individual patient needs. Unlike mass-produced drugs, compounded medications can be customized in dosage, form, and ingredients — allowing providers to prescribe exactly what their patients need.",
  },
  {
    question: "Do I need a prescription?",
    answer:
      "Yes, all compounded medications require a valid prescription from a licensed healthcare provider. If you're a patient looking for a prescribing provider, contact us and we'll help connect you with one in your area.",
  },
  {
    question: "What states do you serve?",
    answer:
      "Logos RX is a multi-state licensed 503A compounding pharmacy currently serving providers and patients in over 25 states across the U.S., with more states coming soon. Contact us to confirm availability in your state.",
  },
  {
    question: "Does insurance cover compounded medications?",
    answer:
      "Coverage varies by insurance plan. Some plans cover compounded medications, while others may not. However, many compounded medications are competitively priced and may be more affordable than commercial alternatives even without insurance coverage.",
  },
  {
    question: "How fast is shipping?",
    answer:
      "We offer fast, reliable shipping nationwide. Most orders are compounded and shipped within 24–48 hours of receiving the prescription. Expedited shipping options are also available for time-sensitive medications.",
  },
  {
    question: "What quality standards do you follow?",
    answer:
      "Logos RX adheres to the highest compounding standards, including USP 795, 797, and 800 guidelines. Our sterile and non-sterile compounding labs undergo regular third-party testing and audits to ensure potency, sterility, and safety of every formulation.",
  },
  {
    question: "How do I become a prescribing provider?",
    answer:
      "Getting started is simple. Visit our provider onboarding portal to create an account. Our team will guide you through the setup process, and you can start prescribing compounded medications for your patients right away.",
  },
];
