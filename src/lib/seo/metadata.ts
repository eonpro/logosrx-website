/**
 * `buildMetadata()` — one call produces a complete, SEO-correct Next.js
 * `Metadata` object: title, description, canonical URL, and matching Open Graph
 * + Twitter cards. Centralizing this guarantees every indexable route ships a
 * self-referencing canonical (canonical hygiene = no duplicate-content dilution)
 * and consistent social cards without per-page boilerplate.
 */

import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo/schema";

export interface BuildMetadataOptions {
  /** Page title (without the site-name suffix — the template appends it). */
  title?: string;
  description?: string;
  /** Site-relative path, e.g. "/locations/fl/tampa". Used for canonical + OG url. */
  path?: string;
  /** Override the social card image (absolute or site-relative). */
  image?: string;
  /** OG type — "website" (default) or "article". */
  type?: "website" | "article";
  /** Set true to keep a page out of the index (e.g. thank-you pages). */
  noindex?: boolean;
  /** Article publish/modify timestamps for OG article cards. */
  publishedTime?: string;
  modifiedTime?: string;
}

export function buildMetadata(opts: BuildMetadataOptions = {}): Metadata {
  const {
    title,
    description = SITE.description,
    path = "/",
    image,
    type = "website",
    noindex = false,
    publishedTime,
    modifiedTime,
  } = opts;

  const canonical = absoluteUrl(path);
  const ogTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const ogImages = image ? [{ url: absoluteUrl(image) }] : undefined;

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type,
      url: canonical,
      siteName: SITE.name,
      title: ogTitle,
      description,
      ...(ogImages ? { images: ogImages } : {}),
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      ...(ogImages ? { images: ogImages.map((i) => i.url) } : {}),
    },
  };
}
