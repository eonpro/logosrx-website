import { describe, expect, it } from "vitest";
import {
  cityLocations,
  getCityLocation,
  citiesByState,
} from "./locations";

describe("locations data integrity", () => {
  it("has a single Tampa flagship", () => {
    const flagships = cityLocations.filter((c) => c.isFlagship);
    expect(flagships).toHaveLength(1);
    expect(flagships[0].slug).toBe("tampa");
  });

  it("uses unique slugs", () => {
    const slugs = cityLocations.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every city unique answer-first + meta copy (no doorway boilerplate)", () => {
    const answers = cityLocations.map((c) => c.answerFirst);
    const metas = cityLocations.map((c) => c.metaDescription);
    expect(new Set(answers).size).toBe(answers.length);
    expect(new Set(metas).size).toBe(metas.length);
  });

  it("requires real content on every city (intro + faqs + neighborhoods)", () => {
    for (const c of cityLocations) {
      expect(c.intro.length).toBeGreaterThanOrEqual(2);
      expect(c.faqs.length).toBeGreaterThanOrEqual(1);
      expect(c.neighborhoods.length).toBeGreaterThan(0);
      expect(c.headline.length).toBeGreaterThan(10);
    }
  });

  it("only cross-links to existing cities", () => {
    const slugs = new Set(cityLocations.map((c) => c.slug));
    for (const c of cityLocations) {
      for (const n of c.nearby) {
        expect(slugs.has(n)).toBe(true);
      }
      // a city should never link to itself
      expect(c.nearby).not.toContain(c.slug);
    }
  });

  it("resolves cities by slug and returns undefined for unknown", () => {
    expect(getCityLocation("tampa")?.city).toBe("Tampa");
    expect(getCityLocation("nope")).toBeUndefined();
  });

  it("groups cities by state", () => {
    const grouped = citiesByState();
    expect(grouped.FL.length).toBe(cityLocations.length);
  });
});
