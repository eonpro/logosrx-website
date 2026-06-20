import { describe, expect, it } from "vitest";
import {
  pillars,
  getPillar,
  subPillars,
  glossaryTerms,
  getGlossaryTerm,
} from "./knowledge";

describe("pillars", () => {
  it("has exactly one hub anchor (slug '')", () => {
    expect(pillars.filter((p) => p.slug === "")).toHaveLength(1);
  });

  it("uses unique slugs", () => {
    const slugs = pillars.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives each pillar unique answer-first + meta copy", () => {
    const answers = pillars.map((p) => p.answerFirst);
    const metas = pillars.map((p) => p.metaDescription);
    expect(new Set(answers).size).toBe(answers.length);
    expect(new Set(metas).size).toBe(metas.length);
  });

  it("requires real content (sections + takeaways) on each pillar", () => {
    for (const p of pillars) {
      expect(p.sections.length).toBeGreaterThanOrEqual(2);
      expect(p.keyTakeaways.length).toBeGreaterThanOrEqual(3);
      expect(p.answerFirst.length).toBeGreaterThan(80);
      expect(p.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("only cross-links related items to in-site paths", () => {
    for (const p of pillars) {
      for (const r of p.related) {
        expect(r.href.startsWith("/")).toBe(true);
      }
    }
  });

  it("subPillars excludes the hub anchor", () => {
    expect(subPillars().every((p) => p.slug !== "")).toBe(true);
    expect(subPillars().length).toBe(pillars.length - 1);
  });

  it("resolves pillars by slug", () => {
    expect(getPillar("")?.title).toContain("Compounding Pharmacy");
    expect(getPillar("503a-vs-503b")?.slug).toBe("503a-vs-503b");
    expect(getPillar("missing")).toBeUndefined();
  });
});

describe("glossary", () => {
  it("uses unique slugs and definitions", () => {
    const slugs = glossaryTerms.map((t) => t.slug);
    const defs = glossaryTerms.map((t) => t.definition);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(defs).size).toBe(defs.length);
  });

  it("has a real definition for every term", () => {
    for (const t of glossaryTerms) {
      expect(t.definition.length).toBeGreaterThan(30);
      expect(t.term.length).toBeGreaterThan(1);
    }
  });

  it("only links related terms to in-site paths", () => {
    for (const t of glossaryTerms) {
      for (const r of t.related ?? []) {
        expect(r.href.startsWith("/")).toBe(true);
      }
    }
  });

  it("resolves terms by slug", () => {
    expect(getGlossaryTerm("503a")?.term).toContain("503A");
    expect(getGlossaryTerm("nope")).toBeUndefined();
  });
});
