import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { CATALOG_CONFIG } from "@/data/catalog";

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    // Admin, API, and auth surfaces should never be indexed even if a stray
    // backlink leaks. `X-Robots-Tag: noindex` on those routes (set in
    // `next.config.ts`) is the defense-in-depth header equivalent.
    "/admin",
    "/admin/",
    "/api",
    "/api/",
    "/sign-in",
    "/sign-up",
  ];

  // The catalog is competitive pricing intel; keep it out of search indexes
  // unless the operator has explicitly opted in via `CATALOG_CONFIG.indexable`.
  // The route itself also emits a `robots: { index: false }` meta tag, so a
  // toggle here only governs crawl behavior; humans following a direct link
  // still see the page.
  if (!CATALOG_CONFIG.indexable) {
    disallow.push("/catalog", "/catalog/");
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
