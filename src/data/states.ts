/**
 * Per-state landing-page content — the Tier 2 (state) layer of the SEO/GEO
 * architecture, targeting "compounding pharmacy that ships to [state]" intent
 * for all 25 licensed jurisdictions.
 *
 * Logos RX is ONE pharmacy in Tampa shipping nationwide within its licensed
 * states — a service-area model. So each state page is a `MedicalWebPage` +
 * `Service` (areaServed = the State), NOT a separate `LocalBusiness` (multiple
 * fake business records = Google spam signal).
 *
 * ANTI-DOORWAY RULE: every state carries unique, fact-based copy. Uniqueness
 * comes from real per-state variables — `region`, `majorCities`, and a
 * hand-written `note` — not string-swapped boilerplate. A unit test enforces
 * unique `answerFirst` + `metaDescription`. Compliance: compounded (503A)
 * preparations are not FDA-approved; no efficacy/cure claims.
 */

import { STATES_SERVED, STATE_NAMES } from "@/lib/constants";

export interface StateFaq {
  question: string;
  answer: string;
}

export interface StateLocation {
  /** USPS code (also the URL slug, lower-cased). */
  code: string;
  name: string;
  region: string;
  /** Real major cities/metros — drives local relevance + page uniqueness. */
  majorCities: string[];
  metaTitle: string;
  metaDescription: string;
  headline: string;
  /** Answer-first TL;DR — unique, AI-extractable. */
  answerFirst: string;
  /** One hand-written, genuinely state-specific sentence woven into the intro. */
  note: string;
  /** State-specific FAQs appended to the shared shipping FAQ. */
  faqs: StateFaq[];
}

/** Lower-cased URL slug for a state code. */
export function stateSlug(code: string): string {
  return code.toLowerCase();
}

export const stateLocations: StateLocation[] = [
  {
    code: "FL",
    name: "Florida",
    region: "the Southeast",
    majorCities: ["Tampa", "Miami", "Orlando", "Jacksonville", "St. Petersburg", "Fort Lauderdale"],
    metaTitle: "Compounding Pharmacy in Florida",
    metaDescription:
      "Logos RX is a Florida-based 503A compounding pharmacy in Tampa, shipping personalized prescription medications statewide — Miami, Orlando, Jacksonville, and beyond.",
    headline: "Compounding Pharmacy in Florida",
    answerFirst:
      "Logos RX is a Florida 503A compounding pharmacy headquartered in Tampa, preparing personalized, prescription-only medications and shipping them statewide — from Miami and Fort Lauderdale to Orlando and Jacksonville. As an in-state pharmacy, Florida providers and patients get fast turnaround on custom HRT, weight-management, and peptide formulations.",
    note:
      "Because our labs are in Tampa, Florida is our home market — we serve the Tampa Bay metro directly and ship to every other Florida county.",
    faqs: [
      {
        question: "Is Logos RX licensed in Florida?",
        answer:
          "Yes. Logos RX is a Florida-licensed 503A compounding pharmacy with its labs in Tampa, serving providers and patients across the state.",
      },
    ],
  },
  {
    code: "AZ",
    name: "Arizona",
    region: "the Southwest",
    majorCities: ["Phoenix", "Tucson", "Mesa", "Scottsdale", "Chandler", "Gilbert"],
    metaTitle: "Compounding Pharmacy Serving Arizona",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Arizona — Phoenix, Tucson, Mesa, Scottsdale. Custom HRT, weight management, and peptide formulations by prescription.",
    headline: "Compounding Pharmacy Serving Arizona",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to Arizona, reaching providers and patients in Phoenix, Tucson, Mesa, Scottsdale, and across the state from its Tampa, Florida labs.",
    note:
      "Arizona's large network of integrative and hormone-focused clinics relies on compounding to tailor therapy to each patient.",
    faqs: [
      {
        question: "How long does shipping to Arizona take?",
        answer:
          "Most prescriptions are compounded and shipped within 24–48 hours of receipt, then travel to Arizona by standard or expedited carrier.",
      },
    ],
  },
  {
    code: "CO",
    name: "Colorado",
    region: "the Mountain West",
    majorCities: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Boulder", "Lakewood"],
    metaTitle: "Compounding Pharmacy Serving Colorado",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Colorado — Denver, Colorado Springs, Boulder, Fort Collins. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving Colorado",
    answerFirst:
      "Logos RX compounds and ships personalized, prescription-only medications to Colorado, serving providers and patients in Denver, Colorado Springs, Boulder, Fort Collins, and statewide from its Tampa, Florida labs.",
    note:
      "Colorado's strong wellness and longevity provider community frequently prescribes peptide and hormone compounding.",
    faqs: [
      {
        question: "Can Colorado providers prescribe through Logos RX?",
        answer:
          "Yes. Colorado-licensed providers can create an account through our onboarding portal and prescribe compounded medications for their patients.",
      },
    ],
  },
  {
    code: "DE",
    name: "Delaware",
    region: "the Mid-Atlantic",
    majorCities: ["Wilmington", "Dover", "Newark", "Middletown"],
    metaTitle: "Compounding Pharmacy Serving Delaware",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Delaware — Wilmington, Dover, Newark. Custom HRT, weight management, and peptide formulations by prescription.",
    headline: "Compounding Pharmacy Serving Delaware",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to Delaware, reaching providers and patients in Wilmington, Dover, Newark, and across the state from its Tampa, Florida labs.",
    note:
      "Delaware patients benefit from access to a national compounding pharmacy without sacrificing the personalization of a local one.",
    faqs: [
      {
        question: "Do you ship to all of Delaware?",
        answer:
          "Yes — we ship compounded prescriptions to patients throughout Delaware, from Wilmington to the southern coastal counties.",
      },
    ],
  },
  {
    code: "GA",
    name: "Georgia",
    region: "the Southeast",
    majorCities: ["Atlanta", "Savannah", "Augusta", "Columbus", "Athens", "Macon"],
    metaTitle: "Compounding Pharmacy Serving Georgia",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Georgia — Atlanta, Savannah, Augusta, Athens. Custom formulations by prescription from neighboring Florida.",
    headline: "Compounding Pharmacy Serving Georgia",
    answerFirst:
      "Logos RX compounds and ships personalized, prescription-only medications to Georgia, serving providers and patients in Atlanta, Savannah, Augusta, Athens, and statewide from its nearby Tampa, Florida labs.",
    note:
      "As a neighboring-state pharmacy, Logos RX reaches much of Georgia quickly, which matters for time-sensitive preparations.",
    faqs: [
      {
        question: "Is Logos RX close to Georgia?",
        answer:
          "Our Tampa labs are a short carrier hop from Georgia, so Atlanta and much of the state see fast transit on shipped prescriptions.",
      },
    ],
  },
  {
    code: "HI",
    name: "Hawaii",
    region: "the Pacific",
    majorCities: ["Honolulu", "Hilo", "Kailua", "Kapolei", "Pearl City"],
    metaTitle: "Compounding Pharmacy Serving Hawaii",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Hawaii — Honolulu, Hilo, and the islands. Custom HRT, weight management, and peptide formulations by prescription.",
    headline: "Compounding Pharmacy Serving Hawaii",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to Hawaii, reaching providers and patients in Honolulu, Hilo, and across the islands from its Tampa, Florida labs.",
    note:
      "For island patients with limited local compounding options, mail-order access to a full-service compounding pharmacy is especially valuable.",
    faqs: [
      {
        question: "Can you ship compounded medications to the Hawaiian Islands?",
        answer:
          "Yes. We ship to Oahu, Maui, the Big Island, Kauai, and the other islands; transit times are longer than the mainland, so plan refills ahead.",
      },
    ],
  },
  {
    code: "ID",
    name: "Idaho",
    region: "the Mountain West",
    majorCities: ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello", "Coeur d'Alene"],
    metaTitle: "Compounding Pharmacy Serving Idaho",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Idaho — Boise, Meridian, Nampa, Idaho Falls. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving Idaho",
    answerFirst:
      "Logos RX compounds and ships personalized, prescription-only medications to Idaho, serving providers and patients in Boise, Meridian, Nampa, Idaho Falls, and statewide from its Tampa, Florida labs.",
    note:
      "Idaho's growing Treasure Valley medical community increasingly turns to compounding for individualized therapy.",
    faqs: [
      {
        question: "Do you serve rural Idaho?",
        answer:
          "Yes. Because we ship statewide, patients in rural Idaho get the same access to compounded medications as those in Boise.",
      },
    ],
  },
  {
    code: "IL",
    name: "Illinois",
    region: "the Midwest",
    majorCities: ["Chicago", "Aurora", "Naperville", "Springfield", "Rockford", "Peoria"],
    metaTitle: "Compounding Pharmacy Serving Illinois",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Illinois — Chicago, Aurora, Naperville, Springfield. Custom HRT, weight management, peptides by prescription.",
    headline: "Compounding Pharmacy Serving Illinois",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to Illinois, reaching providers and patients in Chicago, Aurora, Naperville, Springfield, and across the state from its Tampa, Florida labs.",
    note:
      "From the Chicago metro to downstate Illinois, providers use compounding to fill gaps commercial manufacturing leaves.",
    faqs: [
      {
        question: "Does Logos RX serve the Chicago metro?",
        answer:
          "Yes — Chicago and its suburbs (Aurora, Naperville, Joliet, and more) are all served by shipped compounded prescriptions.",
      },
    ],
  },
  {
    code: "MN",
    name: "Minnesota",
    region: "the Upper Midwest",
    majorCities: ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington"],
    metaTitle: "Compounding Pharmacy Serving Minnesota",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Minnesota — Minneapolis, St. Paul, Rochester, Duluth. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving Minnesota",
    answerFirst:
      "Logos RX compounds and ships personalized, prescription-only medications to Minnesota, serving providers and patients in Minneapolis, St. Paul, Rochester, Duluth, and statewide from its Tampa, Florida labs.",
    note:
      "Minnesota's Twin Cities and Rochester medical corridors prescribe compounded therapy across many specialties.",
    faqs: [
      {
        question: "How do Minnesota patients refill compounded prescriptions?",
        answer:
          "Refills are coordinated through your provider; once authorized, we compound and ship to your Minnesota address, typically within 24–48 hours.",
      },
    ],
  },
  {
    code: "MO",
    name: "Missouri",
    region: "the Midwest",
    majorCities: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence"],
    metaTitle: "Compounding Pharmacy Serving Missouri",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Missouri — Kansas City, St. Louis, Springfield, Columbia. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving Missouri",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to Missouri, reaching providers and patients in Kansas City, St. Louis, Springfield, Columbia, and across the state from its Tampa, Florida labs.",
    note:
      "Missouri spans two major metros — Kansas City and St. Louis — both with active compounding-prescribing communities.",
    faqs: [
      {
        question: "Can Missouri clinics open a provider account?",
        answer:
          "Yes. Missouri-licensed providers can register through our onboarding portal to begin prescribing compounded medications.",
      },
    ],
  },
  {
    code: "MT",
    name: "Montana",
    region: "the Mountain West",
    majorCities: ["Billings", "Missoula", "Bozeman", "Helena", "Great Falls", "Kalispell"],
    metaTitle: "Compounding Pharmacy Serving Montana",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Montana — Billings, Missoula, Bozeman, Helena. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving Montana",
    answerFirst:
      "Logos RX compounds and ships personalized, prescription-only medications to Montana, serving providers and patients in Billings, Missoula, Bozeman, Helena, and statewide from its Tampa, Florida labs.",
    note:
      "Across Montana's wide geography, mail-order compounding gives patients access regardless of distance from a major city.",
    faqs: [
      {
        question: "Do you ship to remote parts of Montana?",
        answer:
          "Yes. We ship compounded prescriptions statewide; remote addresses may see slightly longer carrier transit times.",
      },
    ],
  },
  {
    code: "NH",
    name: "New Hampshire",
    region: "New England",
    majorCities: ["Manchester", "Nashua", "Concord", "Derry", "Dover"],
    metaTitle: "Compounding Pharmacy Serving New Hampshire",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to New Hampshire — Manchester, Nashua, Concord. Custom HRT, weight management, peptides by prescription.",
    headline: "Compounding Pharmacy Serving New Hampshire",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to New Hampshire, reaching providers and patients in Manchester, Nashua, Concord, and across the state from its Tampa, Florida labs.",
    note:
      "New Hampshire patients gain access to specialized compounding that smaller local pharmacies may not offer in-house.",
    faqs: [
      {
        question: "Is a New Hampshire prescription required?",
        answer:
          "Yes. A valid prescription from a licensed provider is required for every compounded medication shipped to New Hampshire.",
      },
    ],
  },
  {
    code: "NJ",
    name: "New Jersey",
    region: "the Northeast",
    majorCities: ["Newark", "Jersey City", "Paterson", "Edison", "Trenton", "Toms River"],
    metaTitle: "Compounding Pharmacy Serving New Jersey",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to New Jersey — Newark, Jersey City, Edison, Trenton. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving New Jersey",
    answerFirst:
      "Logos RX compounds and ships personalized, prescription-only medications to New Jersey, serving providers and patients in Newark, Jersey City, Edison, Trenton, and statewide from its Tampa, Florida labs.",
    note:
      "Within the dense New York–New Jersey metro, compounding lets providers fine-tune therapy for a diverse patient population.",
    faqs: [
      {
        question: "Do you serve the whole state of New Jersey?",
        answer:
          "Yes — from North Jersey's metro corridor to the Shore and South Jersey, we ship compounded prescriptions statewide.",
      },
    ],
  },
  {
    code: "NM",
    name: "New Mexico",
    region: "the Southwest",
    majorCities: ["Albuquerque", "Las Cruces", "Santa Fe", "Rio Rancho", "Roswell"],
    metaTitle: "Compounding Pharmacy Serving New Mexico",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to New Mexico — Albuquerque, Las Cruces, Santa Fe, Rio Rancho. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving New Mexico",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to New Mexico, reaching providers and patients in Albuquerque, Las Cruces, Santa Fe, Rio Rancho, and across the state from its Tampa, Florida labs.",
    note:
      "New Mexico's mix of urban and rural communities makes reliable mail-order compounding a practical option statewide.",
    faqs: [
      {
        question: "How fast can New Mexico patients get refills?",
        answer:
          "Once a refill is authorized, we compound and ship promptly — usually within 24–48 hours — to your New Mexico address.",
      },
    ],
  },
  {
    code: "NY",
    name: "New York",
    region: "the Northeast",
    majorCities: ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse", "Yonkers"],
    metaTitle: "Compounding Pharmacy Serving New York",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to New York — NYC, Buffalo, Rochester, Albany. Custom HRT, weight management, peptides by prescription.",
    headline: "Compounding Pharmacy Serving New York",
    answerFirst:
      "Logos RX compounds and ships personalized, prescription-only medications to New York, serving providers and patients in New York City, Buffalo, Rochester, Albany, and across the state from its Tampa, Florida labs.",
    note:
      "From Manhattan to upstate New York, providers use compounding to deliver precise, individualized formulations.",
    faqs: [
      {
        question: "Does Logos RX serve New York City and upstate?",
        answer:
          "Yes — we ship to the five boroughs, Long Island, and all of upstate New York, from Buffalo to Albany.",
      },
    ],
  },
  {
    code: "ND",
    name: "North Dakota",
    region: "the Northern Plains",
    majorCities: ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo"],
    metaTitle: "Compounding Pharmacy Serving North Dakota",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to North Dakota — Fargo, Bismarck, Grand Forks, Minot. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving North Dakota",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to North Dakota, reaching providers and patients in Fargo, Bismarck, Grand Forks, Minot, and across the state from its Tampa, Florida labs.",
    note:
      "For North Dakota's spread-out communities, shipped compounding ensures access without long drives to a specialty pharmacy.",
    faqs: [
      {
        question: "Do you ship across North Dakota?",
        answer:
          "Yes. We ship compounded prescriptions statewide, from the Red River Valley to the western counties.",
      },
    ],
  },
  {
    code: "OH",
    name: "Ohio",
    region: "the Midwest",
    majorCities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"],
    metaTitle: "Compounding Pharmacy Serving Ohio",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Ohio — Columbus, Cleveland, Cincinnati, Toledo. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving Ohio",
    answerFirst:
      "Logos RX compounds and ships personalized, prescription-only medications to Ohio, serving providers and patients in Columbus, Cleveland, Cincinnati, Toledo, and statewide from its Tampa, Florida labs.",
    note:
      "Ohio's three-C corridor — Columbus, Cleveland, Cincinnati — anchors a large base of compounding-prescribing providers.",
    faqs: [
      {
        question: "Can Ohio providers prescribe compounded medications through Logos RX?",
        answer:
          "Yes. Ohio-licensed providers can register through our portal and prescribe compounded formulations for their patients.",
      },
    ],
  },
  {
    code: "PA",
    name: "Pennsylvania",
    region: "the Mid-Atlantic",
    majorCities: ["Philadelphia", "Pittsburgh", "Allentown", "Harrisburg", "Erie", "Reading"],
    metaTitle: "Compounding Pharmacy Serving Pennsylvania",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Pennsylvania — Philadelphia, Pittsburgh, Allentown, Harrisburg. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving Pennsylvania",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to Pennsylvania, reaching providers and patients in Philadelphia, Pittsburgh, Allentown, Harrisburg, and across the state from its Tampa, Florida labs.",
    note:
      "From Philadelphia to Pittsburgh, Pennsylvania providers prescribe compounding across hormone, weight, and wellness specialties.",
    faqs: [
      {
        question: "Do you serve both Philadelphia and Pittsburgh?",
        answer:
          "Yes — we ship compounded prescriptions statewide, including both major metros and the communities between them.",
      },
    ],
  },
  {
    code: "RI",
    name: "Rhode Island",
    region: "New England",
    majorCities: ["Providence", "Warwick", "Cranston", "Pawtucket", "Newport"],
    metaTitle: "Compounding Pharmacy Serving Rhode Island",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Rhode Island — Providence, Warwick, Cranston. Custom HRT, weight management, peptides by prescription.",
    headline: "Compounding Pharmacy Serving Rhode Island",
    answerFirst:
      "Logos RX compounds and ships personalized, prescription-only medications to Rhode Island, serving providers and patients in Providence, Warwick, Cranston, and statewide from its Tampa, Florida labs.",
    note:
      "Even in the nation's smallest state, patients gain access to a full national compounding formulary by mail.",
    faqs: [
      {
        question: "Is a prescription needed in Rhode Island?",
        answer:
          "Yes. All compounded medications shipped to Rhode Island require a valid prescription from a licensed provider.",
      },
    ],
  },
  {
    code: "SD",
    name: "South Dakota",
    region: "the Northern Plains",
    majorCities: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown"],
    metaTitle: "Compounding Pharmacy Serving South Dakota",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to South Dakota — Sioux Falls, Rapid City, Aberdeen. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving South Dakota",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to South Dakota, reaching providers and patients in Sioux Falls, Rapid City, Aberdeen, and across the state from its Tampa, Florida labs.",
    note:
      "From Sioux Falls to the Black Hills, mail-order compounding bridges South Dakota's long distances.",
    faqs: [
      {
        question: "Do you ship to western South Dakota?",
        answer:
          "Yes — Rapid City and the western Black Hills region are served alongside the rest of the state.",
      },
    ],
  },
  {
    code: "UT",
    name: "Utah",
    region: "the Mountain West",
    majorCities: ["Salt Lake City", "West Valley City", "Provo", "Ogden", "St. George", "Lehi"],
    metaTitle: "Compounding Pharmacy Serving Utah",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Utah — Salt Lake City, Provo, Ogden, St. George. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving Utah",
    answerFirst:
      "Logos RX compounds and ships personalized, prescription-only medications to Utah, serving providers and patients in Salt Lake City, Provo, Ogden, St. George, and statewide from its Tampa, Florida labs.",
    note:
      "Utah's Wasatch Front has a dense, fast-growing wellness and longevity provider community that prescribes compounding heavily.",
    faqs: [
      {
        question: "How fast does shipping to Utah take?",
        answer:
          "Prescriptions are compounded and shipped within 24–48 hours of receipt, then travel to Utah by standard or expedited carrier.",
      },
    ],
  },
  {
    code: "WV",
    name: "West Virginia",
    region: "Appalachia",
    majorCities: ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling"],
    metaTitle: "Compounding Pharmacy Serving West Virginia",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to West Virginia — Charleston, Huntington, Morgantown. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving West Virginia",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to West Virginia, reaching providers and patients in Charleston, Huntington, Morgantown, and across the state from its Tampa, Florida labs.",
    note:
      "Across West Virginia's mountainous terrain, shipped compounding extends specialty access to rural communities.",
    faqs: [
      {
        question: "Do you serve rural West Virginia?",
        answer:
          "Yes. Because we ship statewide, patients throughout West Virginia's rural counties can access compounded medications.",
      },
    ],
  },
  {
    code: "WI",
    name: "Wisconsin",
    region: "the Upper Midwest",
    majorCities: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton"],
    metaTitle: "Compounding Pharmacy Serving Wisconsin",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Wisconsin — Milwaukee, Madison, Green Bay, Kenosha. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving Wisconsin",
    answerFirst:
      "Logos RX compounds and ships personalized, prescription-only medications to Wisconsin, serving providers and patients in Milwaukee, Madison, Green Bay, Kenosha, and statewide from its Tampa, Florida labs.",
    note:
      "Wisconsin's Milwaukee and Madison medical communities prescribe compounding across many therapeutic areas.",
    faqs: [
      {
        question: "Can Wisconsin patients get compounded medications by mail?",
        answer:
          "Yes. Once your provider sends the prescription, we compound and ship it to your Wisconsin address, typically within 24–48 hours.",
      },
    ],
  },
  {
    code: "WY",
    name: "Wyoming",
    region: "the Mountain West",
    majorCities: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs"],
    metaTitle: "Compounding Pharmacy Serving Wyoming",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Wyoming — Cheyenne, Casper, Laramie, Gillette. Custom formulations by prescription.",
    headline: "Compounding Pharmacy Serving Wyoming",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to Wyoming, reaching providers and patients in Cheyenne, Casper, Laramie, Gillette, and across the state from its Tampa, Florida labs.",
    note:
      "In the least-populous state, mail-order compounding ensures Wyoming patients aren't limited by local pharmacy capacity.",
    faqs: [
      {
        question: "Do you ship to all of Wyoming?",
        answer:
          "Yes — we ship compounded prescriptions statewide; more remote addresses may see slightly longer transit times.",
      },
    ],
  },
  {
    code: "DC",
    name: "District of Columbia",
    region: "the Mid-Atlantic",
    majorCities: ["Washington"],
    metaTitle: "Compounding Pharmacy Serving Washington, D.C.",
    metaDescription:
      "Logos RX ships personalized 503A compounded medications to Washington, D.C. Custom HRT, weight management, and peptide formulations by prescription.",
    headline: "Compounding Pharmacy Serving Washington, D.C.",
    answerFirst:
      "Logos RX is licensed to compound and ship personalized, prescription-only medications to Washington, D.C., serving providers and patients throughout the District from its Tampa, Florida labs.",
    note:
      "The D.C. metro's concentration of providers and patients makes reliable, fast-shipping compounding a strong fit.",
    faqs: [
      {
        question: "Do you serve the Washington, D.C. area?",
        answer:
          "Yes. We ship compounded prescriptions to addresses within the District of Columbia for patients with a valid prescription.",
      },
    ],
  },
];

export function getStateLocation(slug: string): StateLocation | undefined {
  const code = slug.toUpperCase();
  return stateLocations.find((s) => s.code === code);
}

/**
 * Guard: the page set must exactly match the canonical `STATES_SERVED` list in
 * constants. A mismatch means we'd publish a page for a state we don't serve
 * (false claim) or omit one we do (lost coverage). The unit test asserts this.
 */
export function statesMatchServed(): boolean {
  const pageSet = new Set(stateLocations.map((s) => s.code));
  const servedSet = new Set<string>(STATES_SERVED);
  if (pageSet.size !== servedSet.size) return false;
  for (const code of servedSet) {
    if (!pageSet.has(code)) return false;
    // every served state must have a known full name too
    if (!STATE_NAMES[code]) return false;
  }
  return true;
}
