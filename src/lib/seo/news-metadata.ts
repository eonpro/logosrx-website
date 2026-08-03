/**
 * Metadata builder for news.logosrx.com — mirrors `buildMetadata` but always
 * canonicalizes against the news origin (never /news-site on www).
 */

import type { Metadata } from "next";
import { NEWS_SITE, NEWS_SITE_URL } from "@/lib/constants";
import { newsAbsoluteUrl } from "@/lib/seo/schema";

export interface BuildNewsMetadataOptions {
  title?: string;
  description?: string;
  /** Public news-host path, e.g. "/" or "/newsroom/slug". */
  path?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}

export function buildNewsMetadata(
  opts: BuildNewsMetadataOptions = {},
): Metadata {
  const {
    title,
    description = NEWS_SITE.description,
    path = "/",
    image,
    type = "website",
    noindex = false,
    publishedTime,
    modifiedTime,
  } = opts;

  const canonical = newsAbsoluteUrl(path);
  const ogTitle = title
    ? `${title} | ${NEWS_SITE.name}`
    : `${NEWS_SITE.name} — ${NEWS_SITE.tagline}`;
  const ogImages = image ? [{ url: newsAbsoluteUrl(image) }] : undefined;

  return {
    ...(title ? { title } : {}),
    description,
    metadataBase: new URL(NEWS_SITE_URL),
    alternates: { canonical },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type,
      url: canonical,
      siteName: NEWS_SITE.name,
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
