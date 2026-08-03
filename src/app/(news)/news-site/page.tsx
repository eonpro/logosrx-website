import type { Metadata } from "next";
import NewsHub from "@/components/news/NewsHub";
import {
  getArticlesSorted,
  getFeaturedArticle,
} from "@/content/news";
import { NEWS_SITE } from "@/lib/constants";
import { buildNewsMetadata } from "@/lib/seo/news-metadata";

// www `/news-site` is noindex via next.config X-Robots-Tag; the news host
// rewrites `/` → `/news-site` so crawlers see the public URL without that tag.
export const metadata: Metadata = buildNewsMetadata({
  title: NEWS_SITE.name,
  description: NEWS_SITE.description,
  path: "/",
});

export default function NewsHubPage() {
  const articles = getArticlesSorted();
  const featured = getFeaturedArticle();
  if (!featured) {
    return (
      <main className="flex-1 px-5 py-20 text-center text-navy/60">
        No articles published yet.
      </main>
    );
  }

  return (
    <main className="flex-1">
      <NewsHub articles={articles} featured={featured} />
    </main>
  );
}
