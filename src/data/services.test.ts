import { describe, expect, it } from "vitest";
import { services, getService } from "./services";
import { THERAPEUTIC_AREAS, getProductsByCategory } from "./products";

describe("services data integrity", () => {
  it("uses unique slugs", () => {
    const slugs = services.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every service unique answer-first + meta copy (no doorway boilerplate)", () => {
    const answers = services.map((s) => s.answerFirst);
    const metas = services.map((s) => s.metaDescription);
    expect(new Set(answers).size).toBe(answers.length);
    expect(new Set(metas).size).toBe(metas.length);
  });

  it("requires real content on every service", () => {
    for (const s of services) {
      expect(s.intro.length).toBeGreaterThanOrEqual(1);
      expect(s.whatWeCompound.length).toBeGreaterThan(0);
      expect(s.faqs.length).toBeGreaterThanOrEqual(1);
      expect(s.headline.length).toBeGreaterThan(5);
    }
  });

  it("maps every service to a real catalog category", () => {
    for (const s of services) {
      expect(THERAPEUTIC_AREAS).toContain(s.productCategory);
    }
  });

  it("links to at least one live product per service", () => {
    for (const s of services) {
      expect(getProductsByCategory(s.productCategory).length).toBeGreaterThan(0);
    }
  });

  it("resolves services by slug and returns undefined for unknown", () => {
    expect(getService("peptide-therapy")?.productCategory).toBe("Peptide Therapy");
    expect(getService("nope")).toBeUndefined();
  });
});
