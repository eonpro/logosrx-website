export const SITE = {
  name: "Logos RX",
  /**
   * Canonical legal/entity name. Use this in JSON-LD `legalName` and anywhere a
   * single unambiguous entity string helps AI engines disambiguate the brand.
   */
  legalName: "Logos RX Compounding Pharmacy",
  tagline: "Compounding Excellence, Personalized.",
  description:
    "Logos RX is a multi-state licensed 503A compounding pharmacy with sterile and non-sterile compounding labs, dedicated to improving patient outcomes through personalized compounding.",
  /**
   * Canonical one-sentence entity description optimized for AI answer engines
   * (ChatGPT, Claude, Perplexity, AI Overviews). Keep it factual, self-contained,
   * and consistent everywhere it appears — entity consistency is how LLMs build
   * confidence to cite us. Read by `llms.txt`, schema, and answer-first blocks.
   */
  entityDescription:
    "Logos RX is a 503A compounding pharmacy headquartered in Tampa, Florida, licensed across multiple U.S. states, operating sterile and non-sterile compounding labs to prepare personalized medications prescribed by licensed providers.",
  url: "https://www.logosrx.com",
  // Internal provider intake. "New Provider" CTAs point here. The wizard itself
  // creates the clinic's account from the submitted info on the final step.
  onboarding: "/onboarding",
  // External LifeFile provider portal. "Prescribe" actions in the clinic
  // storefront and the "Existing Provider" CTA hand off to this login — Logos
  // RX processes all prescriptions through LifeFile.
  lifefilePortal: "https://host4.lifefile.net/logospharmacy/doctor",
} as const;

/**
 * Absolute origin for links in emails, Slack messages, and referral URLs.
 * Prefers the deploy-specific env var (preview deployments) and falls back to
 * the canonical production URL.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? SITE.url;

export const CONTACT = {
  address: {
    street: "7543 W. Waters Ave",
    city: "Tampa",
    state: "FL",
    zip: "33615",
    full: "7543 W. Waters Ave, Tampa, FL 33615",
  },
  phone: "855-564-6779",
  phoneHref: "tel:+18555646779",
  fax: "813-886-2822",
  email: "support@logosrx.com",
  emailHref: "mailto:support@logosrx.com",
} as const;

export const HOURS = {
  retail: "Mon-Fri 9:00am - 5:00pm",
  online: "Mon-Sat 8:00am - 7:00pm EST",
  chat: "24/7",
} as const;

/**
 * Geo-coordinates of the Tampa facility, used for `LocalBusiness.geo`, map
 * embeds, and local-pack alignment.
 *
 * ⚠️ APPROXIMATE — derived from the 33615 ZIP centroid near W. Waters Ave, NOT
 * a surveyed rooftop fix. Replace with the exact Google Business Profile
 * lat/lng before relying on these for the local map pin. Slightly-off coords
 * are not a factual claim, but precise ones strengthen local ranking.
 */
export const GEO = {
  latitude: 28.0297,
  longitude: -82.5748,
  /** Google Maps place URL — replace with the canonical GBP "share" link. */
  mapUrl: "https://www.google.com/maps/search/?api=1&query=7543+W+Waters+Ave+Tampa+FL+33615",
  verified: false,
} as const;

/**
 * Authoritative external profiles for JSON-LD `sameAs`. These let AI engines and
 * search crawlers cross-verify that the on-site entity matches off-site records
 * (NPI, NABP/.pharmacy, LegitScript, GBP, socials) — a core GEO trust signal.
 *
 * ⚠️ STAKEHOLDER-SUPPLIED ONLY. Leave entries commented/empty until the real
 * URLs are confirmed; the schema builder omits `sameAs` entirely when empty so
 * we never emit fabricated profile links (a Google + AI-trust penalty risk).
 */
export const SAME_AS: readonly string[] = [
  // "https://www.google.com/maps/place/...",          // Google Business Profile
  // "https://legitscript.com/pharmacy/logosrx.com",   // LegitScript
  // "https://npiregistry.cms.hhs.gov/provider-view/...", // NPI registry
  // "https://www.linkedin.com/company/logos-rx",       // LinkedIn
  // "https://www.facebook.com/logosrx",                // Facebook
  // "https://www.instagram.com/logosrx",               // Instagram
] as const;

/**
 * Accreditations / credentials shown as E-E-A-T trust signals and emitted as
 * `hasCredential` in Organization/Pharmacy schema. Only list what is genuinely
 * held; unverifiable claims poison both SEO and AI trust.
 */
export const CREDENTIALS = [
  { name: "LegitScript Certified", category: "Pharmacy Certification" },
  { name: "NABP Accredited", category: "Pharmacy Accreditation" },
  { name: "USP 795 / 797 / 800 Compliant", category: "Compounding Standards" },
] as const;

/**
 * Full names of the served jurisdictions, keyed by USPS code. Drives state
 * landing pages (Phase 2), `areaServed` schema entities, and human-readable
 * copy. `STATES_SERVED` (codes) remains the canonical served-list; this is the
 * display layer over it.
 */
export const STATE_NAMES: Record<string, string> = {
  AZ: "Arizona", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", IA: "Iowa",
  ID: "Idaho", IL: "Illinois", ME: "Maine", MN: "Minnesota",
  MO: "Missouri", MT: "Montana", ND: "North Dakota", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NV: "Nevada", NY: "New York",
  OH: "Ohio", PA: "Pennsylvania", RI: "Rhode Island", SD: "South Dakota",
  UT: "Utah", VT: "Vermont", WA: "Washington", WI: "Wisconsin",
  WY: "Wyoming", DC: "District of Columbia",
} as const;

export const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Products", href: "/#products" },
  { label: "Providers", href: "/providers" },
  { label: "Locations", href: "/locations" },
  { label: "About Us", href: "/about" },
  { label: "Support", href: "/support" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/#contact" },
] as const;

/* ───────────────────────── Desktop mega menu ─────────────────────────
 * Drives the desktop header's hover/focus mega-menu (see DesktopNav).
 * Every `href` MUST resolve to a real route — invented links erode trust
 * and create 404s. Cards reuse existing imagery in /public/images.
 * The mobile menu keeps using the flat NAV_LINKS above.
 */

export interface MegaMenuLink {
  label: string;
  href: string;
  /** Opens in a new tab (external portals). */
  newTab?: boolean;
}

export interface MegaMenuColumn {
  title: string;
  links: readonly MegaMenuLink[];
}

export interface MegaMenuCard {
  label: string;
  href: string;
  /** Path under /public, e.g. "/images/hand-vial.webp". */
  image: string;
  newTab?: boolean;
}

export interface NavGroup {
  label: string;
  /** Top-level destination (also the mega panel's implicit "view all"). */
  href: string;
  columns?: readonly MegaMenuColumn[];
  cards?: readonly MegaMenuCard[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "Services",
    href: "/services",
    columns: [
      {
        title: "Our Services",
        links: [
          { label: "Hormone Replacement Therapy", href: "/services/hormone-replacement-therapy" },
          { label: "Medical Weight Management", href: "/services/medical-weight-management" },
          { label: "Peptide Therapy", href: "/services/peptide-therapy" },
          { label: "Longevity & Wellness", href: "/services/longevity-wellness" },
          { label: "Dermatology & Skin Health", href: "/services/dermatology" },
          { label: "View All Services", href: "/services" },
        ],
      },
      {
        title: "Explore",
        links: [
          { label: "Conditions We Support", href: "/conditions" },
          { label: "How Compounding Works", href: "/compounding-pharmacy" },
          { label: "Locations We Serve", href: "/locations" },
        ],
      },
    ],
    cards: [
      { label: "Become a Provider", href: "/onboarding", image: "/images/how-it-works/provider.png" },
      { label: "View All Services", href: "/services", image: "/images/hand-vial.webp" },
      { label: "Conditions We Support", href: "/conditions", image: "/images/building-trust-bg.webp" },
    ],
  },
  {
    label: "Products",
    href: "/#products",
    columns: [
      {
        title: "Browse",
        links: [
          { label: "Full Catalog", href: "/catalog" },
          { label: "Featured Medications", href: "/#products" },
        ],
      },
      {
        title: "Popular",
        links: [
          { label: "Semaglutide", href: "/products/semaglutide-glycine" },
          { label: "Tirzepatide", href: "/products/tirzepatide-glycine" },
          { label: "Testosterone Cypionate", href: "/products/testosterone-cypionate" },
          { label: "NAD+", href: "/products/nad-plus" },
        ],
      },
    ],
    cards: [
      { label: "Medications", href: "/catalog", image: "/images/products/tirzepatide-40mg.webp" },
      { label: "Get Started", href: "/onboarding", image: "/images/products/semaglutide-5mg.webp" },
    ],
  },
  {
    label: "Providers",
    href: "/providers",
    columns: [
      {
        title: "For Providers",
        links: [
          { label: "Why Logos RX", href: "/providers" },
          { label: "Become a Provider", href: "/onboarding" },
          { label: "Provider Portal", href: SITE.lifefilePortal, newTab: true },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "How Compounding Works", href: "/compounding-pharmacy" },
          { label: "Our Services", href: "/services" },
          { label: "Locations We Serve", href: "/locations" },
        ],
      },
    ],
    cards: [
      { label: "Become a Provider", href: "/onboarding", image: "/images/how-it-works/provider.png" },
      { label: "Provider Login", href: SITE.lifefilePortal, image: "/images/trusted-providers.webp", newTab: true },
    ],
  },
  {
    label: "Resources",
    href: "/support",
    columns: [
      {
        title: "Compounding 101",
        links: [
          { label: "What Is a Compounding Pharmacy?", href: "/compounding-pharmacy" },
          { label: "503A vs. 503B", href: "/compounding-pharmacy/503a-vs-503b" },
          { label: "Sterile Compounding (USP <797>)", href: "/compounding-pharmacy/sterile-compounding" },
          { label: "Non-Sterile Compounding (USP <795>)", href: "/compounding-pharmacy/non-sterile-compounding" },
        ],
      },
      {
        title: "Learn & Support",
        links: [
          { label: "Support Center", href: "/support" },
          { label: "Glossary", href: "/glossary" },
          { label: "Conditions", href: "/conditions" },
        ],
      },
    ],
    cards: [
      { label: "Support Center", href: "/support", image: "/images/patient-refill-box.webp" },
      { label: "Glossary", href: "/glossary", image: "/images/building-trust-bg.webp" },
    ],
  },
  {
    label: "Company",
    href: "/about",
    columns: [
      {
        title: "Company",
        links: [
          { label: "Our Story", href: "/about" },
          { label: "Careers", href: "/careers" },
          { label: "Locations", href: "/locations" },
          { label: "Contact", href: "/#contact" },
        ],
      },
      {
        title: "Trust & Legal",
        links: [
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms & Conditions", href: "/terms" },
          { label: "Accessibility", href: "/accessibility" },
        ],
      },
    ],
    cards: [
      { label: "View Open Positions", href: "/careers", image: "/images/facility-tampa.png" },
      { label: "Our Locations", href: "/locations", image: "/images/trusted-providers.webp" },
    ],
  },
] as const;

export const LEGAL_LINKS = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Accessibility Statement", href: "/accessibility" },
] as const;

/**
 * Max rows an admin list page renders in one pass. The header still shows the
 * true total (via a cheap COUNT), and a notice appears when the total exceeds
 * this cap, so nothing is silently hidden. Keeps a runaway table from shipping
 * thousands of rows of HTML to the browser.
 */
export const ADMIN_LIST_LIMIT = 500;

export const STATES_SERVED = [
  "AZ", "CO", "CT", "DE", "FL", "GA", "HI", "IA",
  "ID", "IL", "ME", "MN", "MO", "MT", "ND", "NH",
  "NJ", "NM", "NV", "NY", "OH", "PA", "RI", "SD",
  "UT", "VT", "WA", "WI", "WY", "DC",
] as const;
