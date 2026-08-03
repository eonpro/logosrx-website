import { describe, expect, it } from "vitest";
import {
  getArticlesSorted,
  getFeaturedArticle,
  getNewsArticleBySlug,
  newsArticles,
  validateNewsRegistry,
} from "./index";

describe("news registry", () => {
  it("passes structural invariants", () => {
    const result = validateNewsRegistry();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("has unique slugs", () => {
    const slugs = newsArticles.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has at most one featured article", () => {
    expect(newsArticles.filter((a) => a.featured).length).toBeLessThanOrEqual(1);
  });

  it("includes both newsroom and education tracks", () => {
    expect(newsArticles.some((a) => a.group === "newsroom")).toBe(true);
    expect(newsArticles.some((a) => a.group === "education")).toBe(true);
  });

  it("resolves articles by slug", () => {
    const first = newsArticles[0]!;
    expect(getNewsArticleBySlug(first.slug)?.title).toBe(first.title);
    expect(getNewsArticleBySlug("does-not-exist")).toBeUndefined();
  });

  it("sorts newest first", () => {
    const sorted = getArticlesSorted();
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1]!.date.localeCompare(sorted[i]!.date)).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns a featured or newest fallback", () => {
    const featured = getFeaturedArticle();
    expect(featured).toBeDefined();
    expect(featured!.slug).toBeTruthy();
  });

  it("flags invalid category/group pairing", () => {
    const bad = validateNewsRegistry([
      {
        title: "Bad",
        slug: "bad",
        group: "newsroom",
        category: "Vitality",
        excerpt: "x",
        date: "2026-01-01",
        content: ["x"],
      },
    ]);
    expect(bad.ok).toBe(false);
    expect(bad.errors.some((e) => e.includes("not a newsroom category"))).toBe(
      true,
    );
  });
});
