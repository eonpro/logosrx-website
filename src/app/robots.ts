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
    // Private licensure share page — noindex meta on the route; disallow here
    // keeps crawlers from even fetching it.
    "/licensing",
    "/licensing/",
  ];

  // The catalog is competitive pricing intel; keep it out of search indexes
  // unless the operator has explicitly opted in via `CATALOG_CONFIG.indexable`.
  // The route itself also emits a `robots: { index: false }` meta tag, so a
  // toggle here only governs crawl behavior; humans following a direct link
  // still see the page.
  if (!CATALOG_CONFIG.indexable) {
    disallow.push("/catalog", "/catalog/");
  }

  // AI answer-engine + training crawlers we explicitly welcome. Being readable
  // by these is the whole GEO/AEO play — it lets ChatGPT, Claude, Perplexity,
  // Gemini/AI Overviews, and Bing Copilot cite Logos RX as a source. They each
  // inherit the same `disallow` list (admin/api/auth stay private).
  //
  // Stakeholder note: to opt OUT of *model training* while staying citable in
  // answers, disallow the training-only agents (GPTBot, ClaudeBot, CCBot,
  // Google-Extended) and keep the answer-time fetchers (OAI-SearchBot,
  // PerplexityBot, Claude-User/Claude-SearchBot). Default here is allow-all.
  const aiCrawlers = [
    "GPTBot", // OpenAI training
    "OAI-SearchBot", // ChatGPT search/answers
    "ChatGPT-User", // ChatGPT live browsing
    "ClaudeBot", // Anthropic crawler
    "anthropic-ai", // Anthropic (legacy token)
    "Claude-User", // Claude live browsing
    "Claude-SearchBot", // Claude search
    "PerplexityBot", // Perplexity index
    "Perplexity-User", // Perplexity live fetch
    "Google-Extended", // Gemini / Vertex training + grounding
    "Applebot-Extended", // Apple Intelligence
    "Bingbot", // Bing + Copilot
    "Amazonbot",
    "Meta-ExternalAgent",
    "cohere-ai",
    "CCBot", // Common Crawl (feeds many models)
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: aiCrawlers, allow: "/", disallow },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
