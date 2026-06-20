/**
 * Typed JSON-LD builders — single source of truth for structured data.
 *
 * Every schema the site emits is produced here so that NAP (name/address/phone),
 * geo, credentials, and entity naming stay byte-identical across pages. Consistent
 * structured data is the foundation of both local SEO (Google local pack) and
 * GEO/AEO (AI engines cross-verifying our entity before citing it).
 *
 * Builders return plain objects; the `<JsonLd>` renderer serializes them. Keep
 * everything `@graph`-friendly with stable `@id`s so multiple schemas on one page
 * reference the same entity instead of duplicating it (which triggers
 * "duplicate entity" validator warnings and confuses extractors).
 */

import {
  SITE,
  CONTACT,
  HOURS,
  GEO,
  SAME_AS,
  CREDENTIALS,
  STATES_SERVED,
  STATE_NAMES,
} from "@/lib/constants";

/** A JSON-LD node. Loose by design — schema.org is open-world. */
export type JsonLdObject = Record<string, unknown>;

/** Stable entity `@id`s so cross-references resolve within a page's `@graph`. */
export const ENTITY_IDS = {
  organization: `${SITE.url}/#organization`,
  website: `${SITE.url}/#website`,
  pharmacy: `${SITE.url}/#pharmacy`,
} as const;

/** Compose an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  return new URL(path, SITE.url).toString();
}

function postalAddress(): JsonLdObject {
  return {
    "@type": "PostalAddress",
    streetAddress: CONTACT.address.street,
    addressLocality: CONTACT.address.city,
    addressRegion: CONTACT.address.state,
    postalCode: CONTACT.address.zip,
    addressCountry: "US",
  };
}

/** `areaServed` as explicit State entities — better than a flat "United States". */
function areaServedStates(): JsonLdObject[] {
  return STATES_SERVED.map((code) => ({
    "@type": "State",
    name: STATE_NAMES[code] ?? code,
    ...(code !== "DC" ? { alternateName: code } : {}),
  }));
}

function credentials(): JsonLdObject[] {
  return CREDENTIALS.map((c) => ({
    "@type": "EducationalOccupationalCredential",
    credentialCategory: c.category,
    name: c.name,
  }));
}

/**
 * Organization — the brand entity. Anchors `sameAs` and is referenced by every
 * other node via `@id`. Omits `sameAs` when no verified profiles are configured
 * so we never emit fabricated links.
 */
export function organizationSchema(): JsonLdObject {
  return {
    "@type": "Organization",
    "@id": ENTITY_IDS.organization,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    description: SITE.entityDescription,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/images/logo.svg"),
    },
    image: absoluteUrl("/images/facility-tampa.png"),
    telephone: CONTACT.phone,
    email: CONTACT.email,
    faxNumber: CONTACT.fax,
    address: postalAddress(),
    hasCredential: credentials(),
    ...(SAME_AS.length > 0 ? { sameAs: [...SAME_AS] } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: CONTACT.phone,
      email: CONTACT.email,
      contactType: "Customer Service",
      areaServed: "US",
      availableLanguage: "English",
    },
  };
}

/**
 * WebSite + SearchAction — names the site entity and enables the sitelinks
 * search box. The `target` points at a future `/search?q=` route; harmless if
 * that route doesn't exist yet (Google simply won't show the box).
 */
export function webSiteSchema(): JsonLdObject {
  return {
    "@type": "WebSite",
    "@id": ENTITY_IDS.website,
    url: SITE.url,
    name: SITE.name,
    description: SITE.entityDescription,
    publisher: { "@id": ENTITY_IDS.organization },
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Pharmacy + LocalBusiness — the physical/local entity that drives the local
 * pack. Enriched with geo, hours, map, area served, and credentials. Pass a
 * verified `aggregateRating` ONLY when real review data exists.
 */
export function localBusinessSchema(opts?: {
  aggregateRating?: { ratingValue: number; reviewCount: number };
}): JsonLdObject {
  return {
    "@type": ["Pharmacy", "LocalBusiness", "MedicalBusiness"],
    "@id": ENTITY_IDS.pharmacy,
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    parentOrganization: { "@id": ENTITY_IDS.organization },
    telephone: CONTACT.phone,
    email: CONTACT.email,
    faxNumber: CONTACT.fax,
    image: absoluteUrl("/images/facility-tampa.png"),
    priceRange: "$$",
    currenciesAccepted: "USD",
    address: postalAddress(),
    geo: {
      "@type": "GeoCoordinates",
      latitude: GEO.latitude,
      longitude: GEO.longitude,
    },
    hasMap: GEO.mapUrl,
    areaServed: areaServedStates(),
    slogan: SITE.tagline,
    knowsAbout: [
      "503A Compounding Pharmacy",
      "Sterile Compounding",
      "Non-Sterile Compounding",
      "Personalized Medication",
      "Hormone Replacement Therapy",
      "Peptide Therapy",
      "Weight Management Compounding",
    ],
    hasCredential: credentials(),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: CONTACT.phone,
      email: CONTACT.email,
      contactType: "Customer Service",
      availableLanguage: "English",
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday", "Tuesday", "Wednesday", "Thursday",
          "Friday", "Saturday", "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
        description: `Chat Support: ${HOURS.chat}`,
      },
    },
    ...(opts?.aggregateRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: opts.aggregateRating.ratingValue,
            reviewCount: opts.aggregateRating.reviewCount,
          },
        }
      : {}),
  };
}

/** BreadcrumbList from an ordered list of {name, path} crumbs. */
export function breadcrumbSchema(
  items: ReadonlyArray<{ name: string; path: string }>,
): JsonLdObject {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** FAQPage from question/answer pairs. Drives AI answers + FAQ rich results. */
export function faqPageSchema(
  faqs: ReadonlyArray<{ question: string; answer: string }>,
): JsonLdObject {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/**
 * MedicalWebPage with author/reviewer + lastReviewed — the single biggest
 * E-E-A-T + AEO lever for YMYL pharmacy content. Pass a named, credentialed
 * reviewer once stakeholder supplies one.
 */
export function medicalWebPageSchema(opts: {
  name: string;
  description: string;
  path: string;
  lastReviewed?: string;
  reviewer?: { name: string; credential?: string };
  /** Medical entity this page is about (drives MedicalWebPage.about). */
  about?: { name: string; alternateName?: string };
}): JsonLdObject {
  return {
    "@type": "MedicalWebPage",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    isPartOf: { "@id": ENTITY_IDS.website },
    publisher: { "@id": ENTITY_IDS.organization },
    inLanguage: "en-US",
    ...(opts.about
      ? {
          about: {
            "@type": "MedicalCondition",
            name: opts.about.name,
            ...(opts.about.alternateName
              ? { alternateName: opts.about.alternateName }
              : {}),
          },
        }
      : {}),
    ...(opts.lastReviewed ? { lastReviewed: opts.lastReviewed } : {}),
    ...(opts.reviewer
      ? {
          reviewedBy: {
            "@type": "Person",
            name: opts.reviewer.name,
            ...(opts.reviewer.credential
              ? { honorificSuffix: opts.reviewer.credential }
              : {}),
          },
        }
      : {}),
  };
}

/**
 * Service node for a location page — models the pharmacy as a service-area
 * business serving a specific city. References the single `LocalBusiness`
 * entity via `@id` (so we never emit duplicate business records per city, which
 * Google reads as spam) and attaches an explicit `City`/`State` `areaServed`.
 */
export function localServiceSchema(opts: {
  city: string;
  stateName: string;
  path: string;
}): JsonLdObject {
  return {
    "@type": "Service",
    serviceType: "Compounding pharmacy",
    name: `Compounding pharmacy serving ${opts.city}, ${opts.stateName}`,
    provider: { "@id": ENTITY_IDS.pharmacy },
    url: absoluteUrl(opts.path),
    areaServed: {
      "@type": "City",
      name: opts.city,
      containedInPlace: { "@type": "State", name: opts.stateName },
    },
  };
}

/**
 * Service node for a state landing page — same service-area model as
 * `localServiceSchema`, but `areaServed` is the whole `State`. References the
 * single `LocalBusiness` entity via `@id` so we never duplicate the business.
 */
export function stateServiceSchema(opts: {
  stateName: string;
  path: string;
}): JsonLdObject {
  return {
    "@type": "Service",
    serviceType: "Compounding pharmacy",
    name: `Compounding pharmacy serving ${opts.stateName}`,
    provider: { "@id": ENTITY_IDS.pharmacy },
    url: absoluteUrl(opts.path),
    areaServed: {
      "@type": "State",
      name: opts.stateName,
      containedInPlace: { "@type": "Country", name: "United States" },
    },
  };
}

/** Article schema for editorial/educational content. */
export function articleSchema(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
  section?: string;
}): JsonLdObject {
  return {
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    url: absoluteUrl(opts.path),
    mainEntityOfPage: absoluteUrl(opts.path),
    inLanguage: "en-US",
    publisher: { "@id": ENTITY_IDS.organization },
    author: { "@id": ENTITY_IDS.organization },
    ...(opts.section ? { articleSection: opts.section } : {}),
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    ...(opts.dateModified ?? opts.datePublished
      ? { dateModified: opts.dateModified ?? opts.datePublished }
      : {}),
    ...(opts.image ? { image: absoluteUrl(opts.image) } : {}),
  };
}

/** A single DefinedTerm — glossary entry as a machine-readable entity. */
export function definedTermSchema(opts: {
  term: string;
  definition: string;
  path: string;
  setName?: string;
}): JsonLdObject {
  return {
    "@type": "DefinedTerm",
    name: opts.term,
    description: opts.definition,
    url: absoluteUrl(opts.path),
    ...(opts.setName
      ? {
          inDefinedTermSet: {
            "@type": "DefinedTermSet",
            name: opts.setName,
            url: absoluteUrl("/glossary"),
          },
        }
      : {}),
  };
}

/** DefinedTermSet for the glossary index — an entity dictionary for LLMs. */
export function definedTermSetSchema(opts: {
  name: string;
  path: string;
  terms: ReadonlyArray<{ term: string; definition: string; path: string }>;
}): JsonLdObject {
  return {
    "@type": "DefinedTermSet",
    name: opts.name,
    url: absoluteUrl(opts.path),
    hasDefinedTerm: opts.terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.definition,
      url: absoluteUrl(t.path),
    })),
  };
}

/**
 * Wrap one or more schema nodes in a `@graph` document with a single shared
 * `@context`. This is the canonical multi-entity JSON-LD shape.
 */
export function graph(...nodes: JsonLdObject[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
