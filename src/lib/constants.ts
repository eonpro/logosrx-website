export const SITE = {
  name: "Logos RX",
  tagline: "Compounding Excellence, Personalized.",
  description:
    "Logos RX is a multi-state licensed 503A compounding pharmacy with sterile and non-sterile compounding labs, dedicated to improving patient outcomes through personalized compounding.",
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

export const NAV_LINKS = [
  { label: "Services", href: "/#services" },
  { label: "Products", href: "/#products" },
  { label: "About Us", href: "/#about" },
  { label: "Support", href: "/support" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/#contact" },
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
  "AZ", "CO", "DE", "FL", "GA", "HI", "ID", "IL",
  "MN", "MO", "MT", "NH", "NJ", "NM", "NY", "ND",
  "OH", "PA", "RI", "SD", "UT", "WV", "WI", "WY", "DC",
] as const;
