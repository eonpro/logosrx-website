/**
 * National topical-authority content — the Tier 3 (pillar + glossary) layer.
 *
 * These pages establish Logos RX as an entity AI engines cite when asked about
 * compounding pharmacy concepts, regardless of geography. They are written
 * answer-first, with clean heading hierarchy, comparison tables, FAQs, and a
 * `lastReviewed` date — the structure LLMs and Google's helpful-content systems
 * reward.
 *
 * ACCURACY + COMPLIANCE: this is YMYL content. Facts about 503A/503B, USP
 * chapters, and FDA status must stay correct. Compounded (503A) preparations
 * are NOT FDA-approved; never imply otherwise or make efficacy/cure claims.
 * Add a named pharmacist to `REVIEWER` (currently null) to unlock `reviewedBy`
 * E-E-A-T schema — the single biggest trust lever for this content.
 */

/**
 * Reviewing clinician for medical pillar content. STAKEHOLDER-SUPPLIED: leave
 * null until a real named, licensed pharmacist is confirmed. When set, every
 * pillar emits `reviewedBy` in its MedicalWebPage schema.
 */
export const REVIEWER: { name: string; credential: string } | null = null;

export interface PillarSection {
  heading: string;
  body: string[];
  bullets?: string[];
  /** Optional comparison table rendered after the body. */
  table?: { columns: string[]; rows: string[][] };
}

export interface PillarFaq {
  question: string;
  answer: string;
}

export interface Pillar {
  /** URL slug. The hub anchor uses slug "" (renders at /compounding-pharmacy). */
  slug: string;
  eyebrow: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  /** Answer-first TL;DR — the self-contained block AI engines lift verbatim. */
  answerFirst: string;
  /** Scannable key facts (also great for AI extraction). */
  keyTakeaways: string[];
  sections: PillarSection[];
  faqs: PillarFaq[];
  related: { label: string; href: string }[];
  /** ISO date of last content review (freshness + E-E-A-T signal). */
  lastReviewed: string;
}

const REVIEWED = "2026-06-04";

/** The hub anchor page lives at /compounding-pharmacy (slug ""). */
export const PILLAR_BASE = "/compounding-pharmacy";

export const pillars: Pillar[] = [
  {
    slug: "",
    eyebrow: "Compounding 101",
    title: "What Is a Compounding Pharmacy?",
    metaTitle: "What Is a Compounding Pharmacy? A Complete Guide",
    metaDescription:
      "A compounding pharmacy custom-prepares medications to a prescriber's exact specification. Learn how compounding works, who it helps, 503A vs 503B, and quality standards.",
    answerFirst:
      "A compounding pharmacy is a licensed pharmacy that prepares customized medications to fit an individual patient's prescription — adjusting the strength, dosage form, or ingredients in ways mass-manufactured drugs can't. Compounding is used when a commercial product doesn't work for a patient: a different strength, a liquid instead of a pill, an allergen-free version, or a combination of medications. In the U.S., compounding is performed under two regulatory categories — 503A pharmacies (patient-specific prescriptions) and 503B outsourcing facilities (larger-batch) — and follows United States Pharmacopeia (USP) quality standards.",
    keyTakeaways: [
      "Compounding = custom-made medication prepared per prescription, not off-the-shelf.",
      "Common reasons: custom strength, alternative form (liquid, cream, troche), allergen-free base, combined ingredients, or discontinued products.",
      "Two categories: 503A (traditional, patient-specific) and 503B (outsourcing facilities, bulk).",
      "Quality is governed by USP chapters <795> (non-sterile), <797> (sterile), and <800> (hazardous drugs).",
      "Compounded preparations are not FDA-approved and always require a valid prescription.",
    ],
    sections: [
      {
        heading: "What compounding pharmacies do",
        body: [
          "Traditional drug manufacturing makes one product in fixed strengths for the mass market. Compounding works the opposite way: a pharmacist prepares a medication to match what a specific patient needs, exactly as their provider prescribes. That might mean a precise strength between commercial doses, a capsule made without a dye or filler the patient reacts to, a flavored liquid for someone who can't swallow tablets, or two medications combined into a single preparation.",
          "Because each preparation is made to order, compounding gives prescribers flexibility that commercial products can't. It is widely used in hormone therapy, weight management, dermatology, pediatrics, pain management, sexual health, and veterinary medicine.",
        ],
      },
      {
        heading: "When is compounding used?",
        body: [
          "Providers turn to compounding when an FDA-approved product doesn't fit a patient's situation. Common scenarios include:",
        ],
        bullets: [
          "A needed strength isn't manufactured commercially.",
          "The patient is allergic or sensitive to a dye, preservative, or filler in the commercial product.",
          "The patient can't take the available form (e.g., needs a liquid, topical, or troche instead of a tablet).",
          "A commercial medication has been discontinued or is in shortage.",
          "Multiple medications can be combined to simplify a regimen.",
        ],
      },
      {
        heading: "503A vs. 503B: the two regulatory categories",
        body: [
          "U.S. compounding falls under Sections 503A and 503B of the Federal Food, Drug, and Cosmetic Act. 503A pharmacies compound for an identified patient based on a prescription and are regulated primarily by state boards of pharmacy. 503B outsourcing facilities can compound larger batches without a patient-specific prescription, register with the FDA, and must follow current Good Manufacturing Practice (cGMP).",
        ],
        table: {
          columns: ["", "503A pharmacy", "503B outsourcing facility"],
          rows: [
            ["Prescription", "Patient-specific required", "Not always required (bulk)"],
            ["Primary oversight", "State boards of pharmacy", "FDA (cGMP) + registration"],
            ["Typical use", "Individual patient prescriptions", "Office/clinic stock, larger volumes"],
            ["FDA-approved drugs?", "No (compounded)", "No (compounded)"],
          ],
        },
      },
      {
        heading: "Quality and safety standards",
        body: [
          "Reputable compounding pharmacies follow USP standards: <795> for non-sterile preparations (capsules, creams, oral liquids), <797> for sterile preparations (injectables, ophthalmics) made in cleanroom environments, and <800> for safely handling hazardous drugs. Third-party potency and sterility testing, accreditation (such as NABP), and certifications (such as LegitScript) are additional signals of a quality compounding operation.",
        ],
      },
      {
        heading: "How Logos RX fits in",
        body: [
          "Logos RX is a 503A compounding pharmacy in Tampa, Florida, operating both sterile and non-sterile labs and licensed across multiple U.S. states. Providers prescribe through our portal; we compound the preparation to specification and ship it nationwide within our licensed states. Every medication is made to order against a valid prescription.",
        ],
      },
    ],
    faqs: [
      {
        question: "Are compounded medications FDA-approved?",
        answer:
          "No. Compounded preparations are not FDA-approved. They are prepared by licensed pharmacies to a prescriber's specification and follow USP quality standards, but they do not go through the FDA new-drug approval process.",
      },
      {
        question: "Do I need a prescription for compounded medication?",
        answer:
          "Yes. All compounded medications require a valid prescription from a licensed healthcare provider.",
      },
      {
        question: "Is compounding safe?",
        answer:
          "When performed by a licensed pharmacy following USP <795>/<797>/<800> standards with appropriate testing and accreditation, compounding is a well-established practice. Ask whether a pharmacy is state-licensed, accredited, and tests its preparations.",
      },
    ],
    related: [
      { label: "503A vs. 503B compounding", href: "/compounding-pharmacy/503a-vs-503b" },
      { label: "Sterile compounding", href: "/compounding-pharmacy/sterile-compounding" },
      { label: "Non-sterile compounding", href: "/compounding-pharmacy/non-sterile-compounding" },
      { label: "Compounding glossary", href: "/glossary" },
    ],
    lastReviewed: REVIEWED,
  },
  {
    slug: "503a-vs-503b",
    eyebrow: "Compounding 101",
    title: "503A vs. 503B Compounding: What's the Difference?",
    metaTitle: "503A vs. 503B Compounding Pharmacy: Key Differences",
    metaDescription:
      "503A pharmacies compound patient-specific prescriptions under state boards; 503B outsourcing facilities compound in bulk under FDA cGMP. Here's how they compare.",
    answerFirst:
      "The difference between 503A and 503B is who they make medications for and who regulates them. A 503A compounding pharmacy prepares medications for a specific patient based on an individual prescription and is overseen primarily by state boards of pharmacy. A 503B outsourcing facility can compound larger batches without a patient-specific prescription, registers with the FDA, and must follow current Good Manufacturing Practice (cGMP). Neither produces FDA-approved drugs — both compound.",
    keyTakeaways: [
      "503A = patient-specific prescriptions, regulated mainly by state boards of pharmacy.",
      "503B = outsourcing facilities, can batch-compound, FDA-registered, must follow cGMP.",
      "Both compound non-FDA-approved preparations.",
      "Patients typically receive medications from a 503A pharmacy; clinics may stock office-use product from a 503B.",
      "Logos RX is a 503A compounding pharmacy.",
    ],
    sections: [
      {
        heading: "Side-by-side comparison",
        body: [
          "Both 503A and 503B are defined in the Federal Food, Drug, and Cosmetic Act. The practical differences come down to prescriptions, oversight, scale, and typical use:",
        ],
        table: {
          columns: ["Attribute", "503A pharmacy", "503B outsourcing facility"],
          rows: [
            ["Patient-specific prescription", "Required", "Not required (may batch)"],
            ["Primary regulator", "State board of pharmacy", "FDA"],
            ["Manufacturing standard", "USP <795>/<797>/<800>", "cGMP (plus USP)"],
            ["Typical volume", "Per-patient", "Larger batches"],
            ["Common buyer", "Individual patients", "Hospitals, clinics (office use)"],
            ["FDA-approved product", "No", "No"],
          ],
        },
      },
      {
        heading: "Which one do patients use?",
        body: [
          "Most patients receive their personalized medications from a 503A compounding pharmacy, because compounding for an individual is exactly what 503A covers. 503B outsourcing facilities exist mainly to supply healthcare facilities with compounded preparations for office use (for example, clinic-administered injectables), where a patient-specific prescription isn't written in advance.",
          "Logos RX is a 503A pharmacy: we compound each preparation against an individual prescription, whether it's shipped to the patient or coordinated through their provider.",
        ],
      },
      {
        heading: "Does 503A vs. 503B affect quality?",
        body: [
          "Both categories are held to rigorous standards — they're just structured differently. 503A pharmacies follow USP compounding chapters and state board rules; 503B facilities additionally follow FDA cGMP and are subject to FDA inspection. Quality at any compounder is best judged by its licensure, accreditation, testing practices, and track record, not by category alone.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is 503B safer than 503A?",
        answer:
          "Neither category is inherently 'safer.' They serve different purposes — 503A for patient-specific prescriptions, 503B for larger-batch office-use supply — and both are held to strict standards. Evaluate any pharmacy by its licensure, accreditation, and testing.",
      },
      {
        question: "Can a 503A pharmacy compound without a prescription?",
        answer:
          "No. A defining feature of 503A compounding is that it's done for an identified patient based on a valid prescription.",
      },
    ],
    related: [
      { label: "What is a compounding pharmacy?", href: "/compounding-pharmacy" },
      { label: "Sterile compounding", href: "/compounding-pharmacy/sterile-compounding" },
      { label: "Compounding glossary", href: "/glossary" },
    ],
    lastReviewed: REVIEWED,
  },
  {
    slug: "sterile-compounding",
    eyebrow: "Capabilities",
    title: "Sterile Compounding: USP <797> Explained",
    metaTitle: "Sterile Compounding (USP <797>): What It Is",
    metaDescription:
      "Sterile compounding prepares injectables, ophthalmics, and other sterile medications in controlled cleanroom environments under USP <797>. Learn how it works.",
    answerFirst:
      "Sterile compounding is the preparation of medications that must be free of microorganisms — such as injectables, IV admixtures, and ophthalmic (eye) preparations — in a controlled, ISO-classified cleanroom environment. It is governed by USP General Chapter <797>, which sets requirements for facilities, air quality, personnel technique, and beyond-use dating to prevent contamination.",
    keyTakeaways: [
      "Sterile compounding is for medications that bypass the body's natural barriers (injectables, eye drops, IV).",
      "Governed by USP <797> — cleanroom design, air classification, gowning, and testing.",
      "Sterility and potency testing verify each preparation's safety.",
      "Logos RX operates a dedicated sterile compounding lab.",
    ],
    sections: [
      {
        heading: "Why sterility matters",
        body: [
          "Medications injected into the body or applied to the eye bypass the natural defenses that protect us from contamination. If such a preparation carried microorganisms, the consequences could be serious. Sterile compounding exists to ensure these medications are prepared in an environment and with techniques that keep them free of contaminants.",
        ],
      },
      {
        heading: "What USP <797> requires",
        body: [
          "USP <797> is the standard governing sterile compounding in the United States. In practice it addresses:",
        ],
        bullets: [
          "ISO-classified cleanroom environments with controlled airflow.",
          "Personnel training, gowning, and aseptic technique.",
          "Environmental monitoring and equipment certification.",
          "Beyond-use dating based on preparation risk level.",
          "Sterility and potency verification.",
        ],
      },
      {
        heading: "Examples of sterile preparations",
        body: [
          "Common sterile compounded preparations include injectable hormones and peptides, vitamin and nutrient injections, and ophthalmic solutions. At Logos RX, sterile preparations are made in our dedicated <797> lab and prepared to each prescription.",
        ],
      },
    ],
    faqs: [
      {
        question: "What's the difference between sterile and non-sterile compounding?",
        answer:
          "Sterile compounding (USP <797>) prepares medications that must be contaminant-free, like injectables and eye preparations, in cleanrooms. Non-sterile compounding (USP <795>) prepares things like capsules, creams, and oral liquids in a controlled but non-cleanroom setting.",
      },
    ],
    related: [
      { label: "Non-sterile compounding", href: "/compounding-pharmacy/non-sterile-compounding" },
      { label: "What is a compounding pharmacy?", href: "/compounding-pharmacy" },
      { label: "Compounding glossary", href: "/glossary" },
    ],
    lastReviewed: REVIEWED,
  },
  {
    slug: "non-sterile-compounding",
    eyebrow: "Capabilities",
    title: "Non-Sterile Compounding: USP <795> Explained",
    metaTitle: "Non-Sterile Compounding (USP <795>): What It Is",
    metaDescription:
      "Non-sterile compounding prepares capsules, creams, oral liquids, and troches under USP <795>. Learn what it covers and how quality is maintained.",
    answerFirst:
      "Non-sterile compounding is the preparation of medications that don't need to be sterile — such as capsules, creams and ointments, oral suspensions, and troches — in a clean, controlled (but non-cleanroom) environment. It is governed by USP General Chapter <795>, which sets standards for ingredients, equipment, documentation, and beyond-use dating.",
    keyTakeaways: [
      "Non-sterile compounding covers oral, topical, and other non-injected forms.",
      "Governed by USP <795>.",
      "Common forms: capsules, creams/ointments, oral suspensions, troches, suppositories.",
      "Logos RX operates a dedicated non-sterile compounding lab.",
    ],
    sections: [
      {
        heading: "What non-sterile compounding covers",
        body: [
          "Most customized oral and topical medications are non-sterile preparations. Because they aren't injected or applied to the eye, they don't require a cleanroom — but they still demand careful technique, quality ingredients, and documentation under USP <795>.",
        ],
        bullets: [
          "Capsules in custom strengths or dye/filler-free bases.",
          "Topical creams, gels, and ointments.",
          "Oral suspensions and solutions (often flavored).",
          "Troches and lozenges.",
          "Suppositories.",
        ],
      },
      {
        heading: "How quality is maintained",
        body: [
          "USP <795> addresses ingredient sourcing and identity, equipment cleaning, master formulation and compounding records, and beyond-use dating so that each non-sterile preparation is consistent and safe. Logos RX prepares non-sterile medications to each prescription in a dedicated <795> lab.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can non-sterile compounded medications be flavored?",
        answer:
          "Yes. Flavoring oral suspensions and liquids is a common non-sterile compounding service, especially for pediatric and veterinary patients who won't take an unflavored medication.",
      },
    ],
    related: [
      { label: "Sterile compounding", href: "/compounding-pharmacy/sterile-compounding" },
      { label: "What is a compounding pharmacy?", href: "/compounding-pharmacy" },
      { label: "Compounding glossary", href: "/glossary" },
    ],
    lastReviewed: REVIEWED,
  },
];

export function getPillar(slug: string): Pillar | undefined {
  return pillars.find((p) => p.slug === slug);
}

/** Sub-pillars (everything except the hub anchor). Used for static params + index. */
export function subPillars(): Pillar[] {
  return pillars.filter((p) => p.slug !== "");
}

/* ───────────────────────── Glossary ───────────────────────── */

export interface GlossaryTerm {
  slug: string;
  term: string;
  /** Short acronym/alt label shown as eyebrow, optional. */
  abbr?: string;
  /** One-sentence definition (answer-first; AI engines lift this). */
  definition: string;
  /** Optional expanded explanation paragraphs. */
  details?: string[];
  /** Cross-links to related terms or pillars. */
  related?: { label: string; href: string }[];
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    slug: "compounding",
    term: "Compounding",
    definition:
      "Compounding is the practice of preparing a customized medication to fit an individual patient's prescription — adjusting strength, dosage form, or ingredients beyond what commercial products offer.",
    related: [{ label: "What is a compounding pharmacy?", href: "/compounding-pharmacy" }],
  },
  {
    slug: "503a",
    term: "503A Compounding Pharmacy",
    abbr: "503A",
    definition:
      "A 503A compounding pharmacy prepares medications for a specific patient based on an individual prescription, regulated primarily by state boards of pharmacy under Section 503A of the Federal Food, Drug, and Cosmetic Act.",
    related: [{ label: "503A vs. 503B", href: "/compounding-pharmacy/503a-vs-503b" }],
  },
  {
    slug: "503b",
    term: "503B Outsourcing Facility",
    abbr: "503B",
    definition:
      "A 503B outsourcing facility compounds medications in larger batches, often without a patient-specific prescription, registers with the FDA, and must follow current Good Manufacturing Practice (cGMP).",
    related: [{ label: "503A vs. 503B", href: "/compounding-pharmacy/503a-vs-503b" }],
  },
  {
    slug: "sterile-compounding",
    term: "Sterile Compounding",
    definition:
      "Sterile compounding prepares contaminant-free medications — such as injectables and ophthalmics — in ISO-classified cleanrooms under USP <797>.",
    related: [{ label: "Sterile compounding (USP <797>)", href: "/compounding-pharmacy/sterile-compounding" }],
  },
  {
    slug: "non-sterile-compounding",
    term: "Non-Sterile Compounding",
    definition:
      "Non-sterile compounding prepares medications that don't need to be sterile — capsules, creams, oral liquids, troches — under USP <795>.",
    related: [{ label: "Non-sterile compounding (USP <795>)", href: "/compounding-pharmacy/non-sterile-compounding" }],
  },
  {
    slug: "usp-795",
    term: "USP <795>",
    abbr: "USP <795>",
    definition:
      "USP General Chapter <795> is the United States Pharmacopeia standard governing non-sterile compounding, covering ingredients, equipment, documentation, and beyond-use dating.",
  },
  {
    slug: "usp-797",
    term: "USP <797>",
    abbr: "USP <797>",
    definition:
      "USP General Chapter <797> is the standard governing sterile compounding, setting requirements for cleanroom environments, aseptic technique, and sterility assurance.",
  },
  {
    slug: "usp-800",
    term: "USP <800>",
    abbr: "USP <800>",
    definition:
      "USP General Chapter <800> sets standards for safely handling hazardous drugs in healthcare settings to protect personnel, patients, and the environment.",
  },
  {
    slug: "bhrt",
    term: "Bioidentical Hormone Replacement Therapy",
    abbr: "BHRT",
    definition:
      "BHRT uses hormones that are structurally identical to those the human body produces; compounding pharmacies can prepare them in custom strengths and forms to a prescriber's specification.",
  },
  {
    slug: "api",
    term: "Active Pharmaceutical Ingredient",
    abbr: "API",
    definition:
      "An active pharmaceutical ingredient (API) is the component of a medication that produces its intended therapeutic effect, as distinct from inactive excipients.",
    related: [{ label: "Excipient", href: "/glossary/excipient" }],
  },
  {
    slug: "excipient",
    term: "Excipient",
    definition:
      "An excipient is an inactive ingredient — such as a filler, binder, preservative, or flavoring — used to formulate a medication. Compounding can omit specific excipients for patients with sensitivities.",
    related: [{ label: "Active Pharmaceutical Ingredient", href: "/glossary/api" }],
  },
  {
    slug: "titration",
    term: "Titration",
    definition:
      "Titration is the gradual adjustment of a medication's dose — up or down — to reach the level that works best for a patient. Compounding supports titration with custom intermediate strengths.",
  },
  {
    slug: "troche",
    term: "Troche",
    definition:
      "A troche is a small, dissolvable lozenge that delivers medication through the tissues of the mouth — a common non-sterile compounded dosage form.",
  },
  {
    slug: "peptide-therapy",
    term: "Peptide Therapy",
    definition:
      "Peptide therapy uses short chains of amino acids, prescribed by a provider, that can be compounded into injectable or other forms for individualized treatment plans.",
  },
  {
    slug: "cgmp",
    term: "Current Good Manufacturing Practice",
    abbr: "cGMP",
    definition:
      "cGMP is the FDA's system of regulations for manufacturing quality; 503B outsourcing facilities must comply with cGMP, while 503A pharmacies follow USP compounding standards.",
    related: [{ label: "503A vs. 503B", href: "/compounding-pharmacy/503a-vs-503b" }],
  },
  {
    slug: "beyond-use-date",
    term: "Beyond-Use Date",
    abbr: "BUD",
    definition:
      "A beyond-use date (BUD) is the date after which a compounded preparation should not be used, assigned based on USP standards, formulation, and storage conditions.",
  },
];

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((t) => t.slug === slug);
}
