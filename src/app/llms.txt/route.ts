import { SITE, CONTACT, HOURS, STATES_SERVED, STATE_NAMES } from "@/lib/constants";
import { products } from "@/data/products";
import { articles } from "@/data/articles";
import { learningArticles } from "@/data/learning";
import { cityLocations } from "@/data/locations";
import { stateLocations, stateSlug } from "@/data/states";
import { pillars, glossaryTerms, PILLAR_BASE } from "@/data/knowledge";
import { services } from "@/data/services";
import { conditions } from "@/data/conditions";

/**
 * `/llms.txt` — the emerging (llmstxt.org) convention for giving AI models a
 * concise, curated, plain-text map of a site. ChatGPT, Claude, Perplexity, and
 * others increasingly look for this to ground answers. We render it from the
 * same data the site renders so facts never drift.
 *
 * Format: a single H1, a blockquote summary, then H2 sections of
 * `[title](url): note` links. Keep it factual, compliant, and link-dense.
 */

export const dynamic = "force-static";

function line(title: string, url: string, note?: string): string {
  return `- [${title}](${url})${note ? `: ${note}` : ""}`;
}

export function GET(): Response {
  const statesList = STATES_SERVED.map((c) => STATE_NAMES[c] ?? c).join(", ");

  const body = `# ${SITE.legalName}

> ${SITE.entityDescription}

Logos RX serves two audiences: licensed providers/clinics who prescribe
compounded medications, and patients who fill and refill those prescriptions.
All compounded (503A) preparations require a valid prescription and are not
FDA-approved; nothing here is medical advice.

## Key facts
- Entity: ${SITE.legalName} (503A compounding pharmacy)
- Headquarters: ${CONTACT.address.full}
- Phone: ${CONTACT.phone} · Fax: ${CONTACT.fax} · Email: ${CONTACT.email}
- Hours: Retail ${HOURS.retail}; Online ${HOURS.online}; Chat ${HOURS.chat}
- Licensed in ${STATES_SERVED.length} U.S. jurisdictions: ${statesList}
- Capabilities: sterile and non-sterile compounding (USP 795/797/800)

## Primary pages
${line("Home", SITE.url, "overview of services and capabilities")}
${line("About Logos RX", `${SITE.url}/about`, "entity, accreditations, USP standards")}
${line("For Providers & Clinics", `${SITE.url}/providers`, "prescribe, onboarding, formulary")}
${line("Locations & service areas", `${SITE.url}/locations`, "Tampa Bay + 25 states served")}
${line("Support & Education Center", `${SITE.url}/support`, "patient + provider help and articles")}
${line("Careers", `${SITE.url}/careers`, "open roles")}
${line("Provider onboarding", `${SITE.url}${SITE.onboarding}`, "create a prescriber account")}

## Compounding services (capabilities)
${line("All services", `${SITE.url}/services`, "service-line overview")}
${services.map((s) => line(s.name, `${SITE.url}/services/${s.slug}`)).join("\n")}

## Conditions & compounding (educational; not medical advice, not FDA-approved)
${line("All conditions", `${SITE.url}/conditions`, "how compounding personalizes care")}
${conditions.map((c) => line(c.name, `${SITE.url}/conditions/${c.slug}`)).join("\n")}

## Service-area locations (Tampa Bay, Florida)
${cityLocations
  .map((c) =>
    line(
      `${c.city}, ${c.state}`,
      `${SITE.url}/locations/fl/${c.slug}`,
      c.isFlagship ? "headquarters" : "service area",
    ),
  )
  .join("\n")}

## States served (licensed jurisdictions)
${stateLocations
  .map((s) =>
    line(`${s.name} compounding pharmacy`, `${SITE.url}/locations/${stateSlug(s.code)}`),
  )
  .join("\n")}

## Compounding guides (topical authority)
${pillars
  .map((p) =>
    line(
      p.title,
      p.slug ? `${SITE.url}${PILLAR_BASE}/${p.slug}` : `${SITE.url}${PILLAR_BASE}`,
    ),
  )
  .join("\n")}
${line("Compounding glossary", `${SITE.url}/glossary`, `${glossaryTerms.length} defined terms`)}

## Educational articles
${articles.map((a) => line(a.title, `${SITE.url}/support/${a.slug}`, a.category)).join("\n")}

## Patient dosage explainers
${learningArticles.map((a) => line(a.title, `${SITE.url}/learn/${a.slug}`, a.drug)).join("\n")}

## Product education (prescription required; not FDA-approved)
${products.map((p) => line(p.name, `${SITE.url}/products/${p.slug}`, p.category)).join("\n")}

## Policies
${line("Privacy Policy", `${SITE.url}/privacy`)}
${line("Terms & Conditions", `${SITE.url}/terms`)}
${line("Accessibility", `${SITE.url}/accessibility`)}

## Contact
For prescriptions, partnerships, or press: ${CONTACT.email} or ${CONTACT.phone}.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
