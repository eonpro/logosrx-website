/**
 * Geographic landing-page content — the Tier 1 (local) layer of the SEO/GEO
 * architecture. One physical pharmacy in Tampa serves the whole Tampa Bay metro
 * (and 25 states), so this is modeled as a single **service-area business**:
 * the global `LocalBusiness` schema owns the entity, and each city page is a
 * `MedicalWebPage` + `FAQPage` that targets that city's intent.
 *
 * EDITORIAL RULES (read before adding cities):
 *   - Every page must carry GENUINELY UNIQUE copy (answer-first, intro, FAQs).
 *     Boilerplate string-swaps across cities = Google doorway-spam penalty and
 *     zero AI-citation value. Write each city like it's the only one.
 *   - Compliance: compounded (503A) preparations are NOT FDA-approved. No
 *     efficacy/cure/superiority claims. Describe capabilities, not outcomes.
 *   - `answerFirst` is the 2-4 sentence, self-contained block AI engines lift
 *     verbatim — make it factual and quotable.
 *   - Facts (turnaround, states, standards) come from constants/FAQ, not
 *     invention. Coordinates are optional and flagged approximate.
 */

import { CONTACT, STATES_SERVED } from "@/lib/constants";

export interface LocationFaq {
  question: string;
  answer: string;
}

export interface CityLocation {
  /** URL slug under /locations/fl/. */
  slug: string;
  city: string;
  /** USPS state code. */
  state: string;
  stateName: string;
  /** True for the HQ city — gets the deepest treatment + "headquarters" framing. */
  isFlagship?: boolean;
  /** SEO <title> (without site suffix) and meta description. */
  metaTitle: string;
  metaDescription: string;
  /** Page H1. */
  headline: string;
  /** Answer-first TL;DR — self-contained, AI-extractable. */
  answerFirst: string;
  /** Unique body paragraphs for this city. */
  intro: string[];
  /** Neighborhoods / sub-areas served (local relevance signal). */
  neighborhoods: string[];
  /** Relationship of this city to the Tampa facility (distance/serving note). */
  distanceNote: string;
  /** City-specific FAQs (in addition to shared ones rendered by the page). */
  faqs: LocationFaq[];
  /** Optional approximate coordinates (⚠️ verify before relying on a map pin). */
  coordinates?: { latitude: number; longitude: number };
  /** Slugs of nearby cities to cross-link (internal-link mesh). */
  nearby: string[];
}

/** Therapy areas referenced on location pages — compliant, capability-framed. */
export const LOCATION_SERVICES = [
  "Hormone replacement therapy (HRT / BHRT)",
  "Medical weight management",
  "Peptide therapy",
  "Sexual & men's health",
  "Dermatology & aesthetics",
  "Pediatric & flavored formulations",
  "Pain management",
  "Veterinary compounding",
] as const;

/** Shared facts surfaced on every location page (single source of truth). */
export const LOCATION_FACTS = {
  turnaround: "most prescriptions compounded and shipped within 24–48 hours",
  standards: "USP <795>, <797>, and <800>",
  statesCount: STATES_SERVED.length,
  phone: CONTACT.phone,
  address: CONTACT.address.full,
} as const;

export const cityLocations: CityLocation[] = [
  {
    slug: "tampa",
    city: "Tampa",
    state: "FL",
    stateName: "Florida",
    isFlagship: true,
    metaTitle: "Compounding Pharmacy in Tampa, FL",
    metaDescription:
      "Logos RX is a 503A compounding pharmacy in Tampa, Florida, with sterile and non-sterile labs. Personalized HRT, weight management, and peptide compounding — by prescription.",
    headline: "Compounding Pharmacy in Tampa, Florida",
    answerFirst:
      "Logos RX is a 503A compounding pharmacy headquartered in Tampa, Florida at 7543 W. Waters Ave, operating both sterile and non-sterile compounding labs. We prepare personalized, prescription-only medications — including hormone therapy, medical weight management, and peptide formulations — for providers and patients across Tampa Bay, and ship to 25 U.S. jurisdictions.",
    intro: [
      "As a Tampa-based compounding pharmacy, Logos RX prepares medications that aren't available off the shelf: custom strengths, alternative dosage forms, allergen-free bases, and combination formulations a provider tailors to one patient. Our facility on W. Waters Ave houses dedicated sterile (USP <797>) and non-sterile (USP <795>) compounding suites, with hazardous-drug handling under USP <800>.",
      "Tampa patients and clinics work with us two ways. Providers prescribe directly through our portal and we compound and dispatch the preparation; patients who don't yet have a prescriber can contact us and we'll help connect them with a provider who prescribes compounded therapy. Either way, every compounded medication requires a valid prescription.",
      "Because we're local, Tampa Bay providers get fast turnaround and direct pharmacist access for formulation questions — and patients across Hillsborough County receive the same personalized preparations whether they pick the relationship up by courier-area delivery or nationwide shipping.",
    ],
    neighborhoods: [
      "Town 'n' Country",
      "Westchase",
      "South Tampa",
      "Carrollwood",
      "Hyde Park",
      "Brandon",
      "New Tampa",
      "Temple Terrace",
    ],
    distanceNote:
      "Our compounding lab and pharmacist team are based right here in Tampa at 7543 W. Waters Ave (33615), in the Town 'n' Country area off the Veterans Expressway.",
    faqs: [
      {
        question: "Where is Logos RX located in Tampa?",
        answer:
          "Logos RX is at 7543 W. Waters Ave, Tampa, FL 33615, in the Town 'n' Country area of west Tampa. You can reach the pharmacy at 855-564-6779.",
      },
      {
        question: "Can a Tampa provider tour the compounding lab?",
        answer:
          "Yes. Tampa-area providers and clinics can arrange a visit to discuss formulary needs and see our sterile and non-sterile compounding capabilities. Contact us to schedule.",
      },
    ],
    coordinates: { latitude: 28.0297, longitude: -82.5748 },
    nearby: ["st-petersburg", "clearwater", "brandon", "wesley-chapel"],
  },
  {
    slug: "st-petersburg",
    city: "St. Petersburg",
    state: "FL",
    stateName: "Florida",
    metaTitle: "Compounding Pharmacy Serving St. Petersburg, FL",
    metaDescription:
      "Personalized 503A compounded medications for St. Petersburg, FL patients and providers. HRT, weight management, and peptide compounding from Logos RX in Tampa Bay.",
    headline: "Compounding Pharmacy Serving St. Petersburg, Florida",
    answerFirst:
      "Logos RX serves St. Petersburg, Florida from its Tampa Bay compounding labs, preparing prescription-only personalized medications and delivering them across Pinellas County. Providers in St. Pete can prescribe custom HRT, weight-management, and peptide formulations and have them compounded under USP <795>/<797>/<800> standards.",
    intro: [
      "St. Petersburg providers turn to compounding when a commercial product doesn't fit — a patient needs a different strength, a dye-free capsule, a transdermal instead of a tablet, or a combination that simplifies a regimen. Logos RX prepares these to each prescription from our Tampa Bay facility, just across the bay from downtown St. Pete.",
      "For St. Petersburg patients, the workflow is simple: your provider sends the prescription to Logos RX, our pharmacists compound it, and it's shipped to you — typically within 24–48 hours of receipt. If you're looking for a provider who prescribes compounded therapy, we can help point you in the right direction.",
    ],
    neighborhoods: [
      "Downtown St. Pete",
      "Old Northeast",
      "Kenwood",
      "Gulfport",
      "Pinellas Point",
      "Snell Isle",
    ],
    distanceNote:
      "St. Petersburg sits across Tampa Bay from our Tampa lab — close enough for fast Pinellas County turnaround, with nationwide shipping for everyone else.",
    faqs: [
      {
        question: "Do you deliver compounded medications to St. Petersburg?",
        answer:
          "Yes. Prescriptions for St. Petersburg patients are compounded at our Tampa Bay facility and shipped directly, usually within 24–48 hours of receiving the prescription.",
      },
    ],
    nearby: ["clearwater", "largo", "tampa"],
  },
  {
    slug: "clearwater",
    city: "Clearwater",
    state: "FL",
    stateName: "Florida",
    metaTitle: "Compounding Pharmacy Serving Clearwater, FL",
    metaDescription:
      "Logos RX compounds personalized, prescription-only medications for Clearwater, FL. Sterile and non-sterile 503A compounding for Pinellas County providers and patients.",
    headline: "Compounding Pharmacy Serving Clearwater, Florida",
    answerFirst:
      "Logos RX provides 503A compounded medications to Clearwater, Florida from its Tampa Bay labs. Clearwater providers can prescribe custom-strength and custom-form preparations — hormone therapy, weight management, peptides, dermatology — compounded to USP standards and shipped across Pinellas County.",
    intro: [
      "Clearwater clinics use compounding to personalize care: bioidentical hormone strengths titrated to lab work, weight-management formulations matched to a protocol, or topical preparations built on a specific base. Logos RX prepares each one to the prescriber's exact specification.",
      "Patients in Clearwater receive their compounded prescriptions by mail from our nearby Tampa facility, with most orders shipped within 24–48 hours. All compounded medications are prescription-only and prepared per patient.",
    ],
    neighborhoods: [
      "Downtown Clearwater",
      "Clearwater Beach",
      "Countryside",
      "Safety Harbor",
      "Dunedin",
    ],
    distanceNote:
      "Clearwater is a short drive across northern Pinellas from our Tampa lab, so local turnaround is quick.",
    faqs: [
      {
        question: "Is a prescription required for compounded medication in Clearwater?",
        answer:
          "Yes. Like everywhere we serve, Clearwater patients need a valid prescription from a licensed provider. We can help connect you with a prescriber if you don't have one.",
      },
    ],
    nearby: ["st-petersburg", "palm-harbor", "tampa"],
  },
  {
    slug: "brandon",
    city: "Brandon",
    state: "FL",
    stateName: "Florida",
    metaTitle: "Compounding Pharmacy Serving Brandon, FL",
    metaDescription:
      "Personalized 503A compounding for Brandon, FL and east Hillsborough County. Logos RX prepares custom HRT, weight-management, and peptide medications by prescription.",
    headline: "Compounding Pharmacy Serving Brandon, Florida",
    answerFirst:
      "Logos RX serves Brandon, Florida and east Hillsborough County from its Tampa compounding labs, preparing prescription-only personalized medications. Brandon providers can prescribe custom hormone, weight-management, and peptide formulations compounded under USP <795>/<797>/<800>.",
    intro: [
      "Brandon is one of Hillsborough County's largest communities, and its providers prescribe compounded therapy for the same reasons clinics everywhere do — to give patients a strength, form, or combination that commercial manufacturing doesn't offer. Logos RX compounds these just up the road in Tampa.",
      "Brandon patients get their compounded prescriptions shipped from our nearby facility, typically within 24–48 hours of the prescription arriving. Everything is made to order against a valid prescription.",
    ],
    neighborhoods: [
      "Brandon",
      "Valrico",
      "Riverview",
      "Seffner",
      "Lithia",
      "FishHawk",
    ],
    distanceNote:
      "Brandon sits just east of Tampa, minutes from our W. Waters Ave lab via the Selmon Expressway — quick local turnaround.",
    faqs: [
      {
        question: "How do Brandon patients get compounded prescriptions filled?",
        answer:
          "A Brandon provider sends the prescription to Logos RX, our pharmacists compound it in Tampa, and it ships to the patient — usually within 24–48 hours.",
      },
    ],
    nearby: ["riverview", "tampa", "wesley-chapel"],
  },
  {
    slug: "riverview",
    city: "Riverview",
    state: "FL",
    stateName: "Florida",
    metaTitle: "Compounding Pharmacy Serving Riverview, FL",
    metaDescription:
      "Logos RX compounds personalized, prescription-only medications for Riverview, FL. 503A sterile and non-sterile compounding for southeast Hillsborough providers and patients.",
    headline: "Compounding Pharmacy Serving Riverview, Florida",
    answerFirst:
      "Logos RX provides 503A compounded medications to Riverview, Florida from its Tampa labs, shipping personalized prescription preparations across southeast Hillsborough County. Riverview providers can prescribe custom-strength hormone, weight-management, and peptide formulations made to USP standards.",
    intro: [
      "Riverview has grown quickly, and so has demand for personalized medicine there. Logos RX supports Riverview clinics with compounded preparations tailored to each prescription — alternative dosage forms, precise titrations, and allergen-conscious bases.",
      "Patients in Riverview receive their medications by mail from our Tampa facility, most within 24–48 hours of the prescription being received. A valid prescription is required for any compounded preparation.",
    ],
    neighborhoods: [
      "Riverview",
      "Gibsonton",
      "Apollo Beach",
      "Ruskin",
      "Sun City Center",
    ],
    distanceNote:
      "Riverview is a short hop south of Tampa off I-75, keeping local delivery fast.",
    faqs: [
      {
        question: "Does Logos RX serve southeast Hillsborough County?",
        answer:
          "Yes — Riverview, Apollo Beach, Ruskin, and the surrounding southeast Hillsborough communities are all served from our Tampa compounding labs.",
      },
    ],
    nearby: ["brandon", "tampa", "st-petersburg"],
  },
  {
    slug: "wesley-chapel",
    city: "Wesley Chapel",
    state: "FL",
    stateName: "Florida",
    metaTitle: "Compounding Pharmacy Serving Wesley Chapel, FL",
    metaDescription:
      "Personalized 503A compounding for Wesley Chapel, FL and Pasco County. Logos RX prepares custom HRT, weight-management, and peptide medications by prescription.",
    headline: "Compounding Pharmacy Serving Wesley Chapel, Florida",
    answerFirst:
      "Logos RX serves Wesley Chapel, Florida and Pasco County from its Tampa Bay compounding labs, preparing prescription-only personalized medications. Wesley Chapel providers can prescribe custom hormone, weight-management, and peptide formulations compounded under USP <795>/<797>/<800>.",
    intro: [
      "Wesley Chapel's fast-growing medical community prescribes compounded therapy to meet needs commercial products can't — custom strengths, combination formulations, and patient-friendly dosage forms. Logos RX compounds these just south in Tampa.",
      "Wesley Chapel patients receive their compounded prescriptions by mail, typically within 24–48 hours of receipt. Each preparation is made to order and requires a valid prescription.",
    ],
    neighborhoods: [
      "Wesley Chapel",
      "Wiregrass Ranch",
      "Land O' Lakes",
      "Zephyrhills",
      "Lutz",
    ],
    distanceNote:
      "Wesley Chapel is just north of Tampa off I-75/SR-56, well within our fast local-turnaround area.",
    faqs: [
      {
        question: "Do you serve Pasco County from Tampa?",
        answer:
          "Yes. Wesley Chapel, Land O' Lakes, Zephyrhills, and the surrounding Pasco County communities are served from our Tampa compounding facility.",
      },
    ],
    nearby: ["lutz", "tampa", "brandon"],
  },
  {
    slug: "lutz",
    city: "Lutz",
    state: "FL",
    stateName: "Florida",
    metaTitle: "Compounding Pharmacy Serving Lutz, FL",
    metaDescription:
      "Logos RX compounds personalized, prescription-only medications for Lutz, FL. 503A sterile and non-sterile compounding for north Tampa and Pasco-line providers and patients.",
    headline: "Compounding Pharmacy Serving Lutz, Florida",
    answerFirst:
      "Logos RX provides 503A compounded medications to Lutz, Florida from its nearby Tampa labs, preparing personalized prescription medications for the north Tampa and Pasco-line community. Providers in Lutz can prescribe custom-strength and custom-form preparations made to USP standards.",
    intro: [
      "Lutz straddles the Hillsborough–Pasco line just north of Tampa, and its providers rely on compounding to personalize patient care — from bioidentical hormone strengths to flavored or dye-free formulations. Logos RX prepares each to the prescriber's specification.",
      "Patients in Lutz get their compounded prescriptions shipped from our Tampa facility, most within 24–48 hours of receipt. All compounded medications are prescription-only.",
    ],
    neighborhoods: [
      "Lutz",
      "Cheval",
      "Carrollwood",
      "Odessa",
      "Land O' Lakes",
    ],
    distanceNote:
      "Lutz is minutes north of our W. Waters Ave lab, so local turnaround is among our fastest.",
    faqs: [
      {
        question: "Is Logos RX close to Lutz?",
        answer:
          "Yes — our Tampa lab on W. Waters Ave is just south of Lutz, making it one of our closest-served communities.",
      },
    ],
    nearby: ["wesley-chapel", "tampa", "palm-harbor"],
  },
  {
    slug: "palm-harbor",
    city: "Palm Harbor",
    state: "FL",
    stateName: "Florida",
    metaTitle: "Compounding Pharmacy Serving Palm Harbor, FL",
    metaDescription:
      "Personalized 503A compounding for Palm Harbor, FL and north Pinellas. Logos RX prepares custom HRT, weight-management, and peptide medications by prescription.",
    headline: "Compounding Pharmacy Serving Palm Harbor, Florida",
    answerFirst:
      "Logos RX serves Palm Harbor, Florida and north Pinellas County from its Tampa Bay compounding labs, preparing prescription-only personalized medications. Palm Harbor providers can prescribe custom hormone, weight-management, and peptide formulations compounded under USP <795>/<797>/<800>.",
    intro: [
      "Palm Harbor and the north Pinellas communities of Tarpon Springs and Dunedin rely on compounding for personalized therapy — custom strengths, alternative forms, and combination preparations tailored to each patient. Logos RX compounds these across the bay in Tampa.",
      "Palm Harbor patients receive their compounded prescriptions by mail, typically within 24–48 hours of receipt. Every preparation is made to order against a valid prescription.",
    ],
    neighborhoods: [
      "Palm Harbor",
      "Tarpon Springs",
      "Dunedin",
      "Ozona",
      "East Lake",
    ],
    distanceNote:
      "Palm Harbor is served from our Tampa lab with reliable Tampa Bay delivery and nationwide shipping.",
    faqs: [
      {
        question: "Do you serve north Pinellas County?",
        answer:
          "Yes. Palm Harbor, Tarpon Springs, Dunedin, and surrounding north Pinellas communities are served from our Tampa compounding facility.",
      },
    ],
    nearby: ["clearwater", "tampa", "st-petersburg"],
  },
  {
    slug: "largo",
    city: "Largo",
    state: "FL",
    stateName: "Florida",
    metaTitle: "Compounding Pharmacy Serving Largo, FL",
    metaDescription:
      "Logos RX compounds personalized, prescription-only medications for Largo, FL. 503A sterile and non-sterile compounding for central Pinellas providers and patients.",
    headline: "Compounding Pharmacy Serving Largo, Florida",
    answerFirst:
      "Logos RX provides 503A compounded medications to Largo, Florida from its Tampa Bay labs, shipping personalized prescription preparations across central Pinellas County. Largo providers can prescribe custom-strength hormone, weight-management, and peptide formulations made to USP standards.",
    intro: [
      "Largo sits at the heart of Pinellas County, and its providers prescribe compounded medications to give patients options commercial manufacturing doesn't — precise titrations, allergen-free bases, and combination formulations. Logos RX prepares each to prescription.",
      "Patients in Largo receive their compounded prescriptions by mail from our Tampa facility, most within 24–48 hours of receipt. A valid prescription is required for all compounded preparations.",
    ],
    neighborhoods: [
      "Largo",
      "Seminole",
      "Belleair",
      "Indian Rocks Beach",
      "Pinellas Park",
    ],
    distanceNote:
      "Largo is served across Tampa Bay from our Tampa lab, with fast Pinellas delivery and nationwide shipping.",
    faqs: [
      {
        question: "Can Largo clinics set up a provider account?",
        answer:
          "Yes. Largo and central Pinellas providers can create a prescriber account through our onboarding portal and begin prescribing compounded medications.",
      },
    ],
    nearby: ["st-petersburg", "clearwater", "tampa"],
  },
];

export function getCityLocation(slug: string): CityLocation | undefined {
  return cityLocations.find((c) => c.slug === slug);
}

/** Cities grouped by state for the /locations hub. */
export function citiesByState(): Record<string, CityLocation[]> {
  return cityLocations.reduce<Record<string, CityLocation[]>>((acc, c) => {
    (acc[c.state] ??= []).push(c);
    return acc;
  }, {});
}
