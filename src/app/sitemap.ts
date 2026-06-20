import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { products } from "@/data/products";
import { articles } from "@/data/articles";
import { productInserts } from "@/data/product-inserts";
import { learningArticles } from "@/data/learning";
import { cityLocations } from "@/data/locations";
import { stateLocations, stateSlug } from "@/data/states";
import { pillars, glossaryTerms, PILLAR_BASE } from "@/data/knowledge";
import { services } from "@/data/services";
import { conditions } from "@/data/conditions";

/**
 * Stable "content last meaningfully changed" date for pages that don't carry
 * their own timestamp. Using a fixed date instead of `new Date()` avoids the
 * "every URL changed today" anti-pattern that trains crawlers to ignore our
 * `lastModified` signal. Bump this when the static surface materially changes.
 */
const CONTENT_UPDATED = new Date("2026-06-04");

/** Parse a data `date` string, falling back to the content-updated baseline. */
function modified(date?: string): Date {
  if (!date) return CONTENT_UPDATED;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? CONTENT_UPDATED : parsed;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE.url}/support`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE.url}/about`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE.url}/providers`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Service-line cluster (capability tier).
    {
      url: `${SITE.url}/services`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...services.map((s) => ({
      url: `${SITE.url}/services/${s.slug}`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Condition cluster (educational, compliance-reviewed).
    {
      url: `${SITE.url}/conditions`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...conditions.map((c) => ({
      url: `${SITE.url}/conditions/${c.slug}`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // National authority pillars — high priority for topical/AI authority.
    ...pillars.map((p) => ({
      url: p.slug ? `${SITE.url}${PILLAR_BASE}/${p.slug}` : `${SITE.url}${PILLAR_BASE}`,
      lastModified: modified(p.lastReviewed),
      changeFrequency: "monthly" as const,
      priority: p.slug === "" ? 0.9 : 0.8,
    })),
    {
      url: `${SITE.url}/glossary`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...glossaryTerms.map((t) => ({
      url: `${SITE.url}/glossary/${t.slug}`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
    {
      url: `${SITE.url}/locations`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...stateLocations.map((s) => ({
      url: `${SITE.url}/locations/${stateSlug(s.code)}`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly" as const,
      // Florida is the home state — highest of the state tier.
      priority: s.code === "FL" ? 0.9 : 0.7,
    })),
    ...cityLocations.map((c) => ({
      url: `${SITE.url}/locations/fl/${c.slug}`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly" as const,
      // The Tampa HQ flagship is our top local page; metro cities just below.
      priority: c.isFlagship ? 0.9 : 0.8,
    })),
    {
      url: `${SITE.url}/careers`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE.url}/terms`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE.url}/privacy`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE.url}/accessibility`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...articles.map((article) => ({
      url: `${SITE.url}/support/${article.slug}`,
      lastModified: modified(article.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...products.map((product) => ({
      url: `${SITE.url}/products/${product.slug}`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...productInserts.map((insert) => ({
      url: `${SITE.url}/product-insert/${insert.slug}`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    ...learningArticles.map((article) => ({
      url: `${SITE.url}/learn/${article.slug}`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
