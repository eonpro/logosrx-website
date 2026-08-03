import { newsArticles } from "./articles";
import {
  EDUCATION_CATEGORIES,
  NEWSROOM_CATEGORIES,
  type EducationCategory,
  type NewsArticle,
  type NewsCategory,
  type NewsGroup,
  type NewsroomCategory,
} from "./types";

export type {
  EducationCategory,
  NewsArticle,
  NewsCategory,
  NewsGroup,
  NewsroomCategory,
};
export {
  EDUCATION_CATEGORIES,
  NEWSROOM_CATEGORIES,
  newsArticles,
};

const CATEGORY_SET = new Set<string>([
  ...NEWSROOM_CATEGORIES,
  ...EDUCATION_CATEGORIES,
]);

export function getNewsArticleBySlug(slug: string): NewsArticle | undefined {
  return newsArticles.find((a) => a.slug === slug);
}

export function getFeaturedArticle(): NewsArticle | undefined {
  return (
    newsArticles.find((a) => a.featured) ??
    [...newsArticles].sort((a, b) => b.date.localeCompare(a.date))[0]
  );
}

export function getArticlesSorted(): NewsArticle[] {
  return [...newsArticles].sort((a, b) => b.date.localeCompare(a.date));
}

export function getArticlesByGroup(group: NewsGroup | "all"): NewsArticle[] {
  const sorted = getArticlesSorted();
  if (group === "all") return sorted;
  return sorted.filter((a) => a.group === group);
}

export function getArticlesByCategory(
  category: NewsCategory | "All",
): NewsArticle[] {
  if (category === "All") return getArticlesSorted();
  return getArticlesSorted().filter((a) => a.category === category);
}

export function categoriesForGroup(group: NewsGroup | "all"): readonly string[] {
  if (group === "newsroom") return NEWSROOM_CATEGORIES;
  if (group === "education") return EDUCATION_CATEGORIES;
  return [...NEWSROOM_CATEGORIES, ...EDUCATION_CATEGORIES];
}

export function isKnownCategory(category: string): category is NewsCategory {
  return CATEGORY_SET.has(category);
}

/** Invariants used by unit tests and CI. */
export function validateNewsRegistry(articles: NewsArticle[] = newsArticles): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const slugs = new Set<string>();
  let featuredCount = 0;

  for (const article of articles) {
    if (!article.slug.trim()) {
      errors.push(`Empty slug for "${article.title}"`);
    } else if (slugs.has(article.slug)) {
      errors.push(`Duplicate slug: ${article.slug}`);
    } else {
      slugs.add(article.slug);
    }

    if (!isKnownCategory(article.category)) {
      errors.push(`Unknown category "${article.category}" on ${article.slug}`);
    } else if (
      article.group === "newsroom" &&
      !(NEWSROOM_CATEGORIES as readonly string[]).includes(article.category)
    ) {
      errors.push(
        `Category "${article.category}" is not a newsroom category (${article.slug})`,
      );
    } else if (
      article.group === "education" &&
      !(EDUCATION_CATEGORIES as readonly string[]).includes(article.category)
    ) {
      errors.push(
        `Category "${article.category}" is not an education category (${article.slug})`,
      );
    }

    if (article.featured) featuredCount += 1;
  }

  if (featuredCount > 1) {
    errors.push(`Expected at most 1 featured article, found ${featuredCount}`);
  }

  return { ok: errors.length === 0, errors };
}
