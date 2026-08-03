"use client";

import { useMemo, useState } from "react";
import type { NewsArticle, NewsGroup } from "@/content/news";
import { categoriesForGroup } from "@/content/news";
import ArticleCard from "./ArticleCard";
import FeaturedArticle from "./FeaturedArticle";
import NewsHeader from "./NewsHeader";

type GroupFilter = NewsGroup | "all";

interface NewsHubProps {
  articles: NewsArticle[];
  featured: NewsArticle;
}

export default function NewsHub({ articles, featured }: NewsHubProps) {
  const [group, setGroup] = useState<GroupFilter>("all");
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  const categoryOptions = useMemo(
    () => ["All", ...categoriesForGroup(group)],
    [group],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (a.slug === featured.slug) return false;
      if (group !== "all" && a.group !== group) return false;
      if (category !== "All" && a.category !== category) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    });
  }, [articles, featured.slug, group, category, query]);

  const showFeatured =
    !query.trim() &&
    (group === "all" || featured.group === group) &&
    (category === "All" || featured.category === category);

  function setGroupFilter(next: GroupFilter) {
    setGroup(next);
    setCategory("All");
  }

  return (
    <>
      <NewsHeader
        showSearch
        searchQuery={query}
        onSearchChange={setQuery}
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Content track"
            className="inline-flex rounded-full bg-black/[0.04] p-1"
          >
            {(
              [
                ["all", "All"],
                ["newsroom", "Newsroom"],
                ["education", "Education"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={group === value}
                onClick={() => setGroupFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  group === value
                    ? "bg-white text-navy shadow-sm"
                    : "text-navy/55 hover:text-navy"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-10 flex flex-wrap gap-2">
          {categoryOptions.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide transition-colors ${
                category === cat
                  ? "bg-navy text-white"
                  : "bg-black/[0.04] text-navy/65 hover:bg-black/[0.07] hover:text-navy"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {showFeatured && (
          <div className="mb-8 sm:mb-10">
            <FeaturedArticle article={featured} />
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
            {filtered.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <p className="rounded-[1.5rem] bg-[#f3f2ef] px-6 py-16 text-center text-navy/55">
            No articles match your filters.
          </p>
        )}
      </div>
    </>
  );
}
