import { describe, expect, it } from "vitest";
import { conditions, getCondition, conditionsForService } from "./conditions";
import { getService, services } from "./services";

describe("conditions data integrity", () => {
  it("uses unique slugs", () => {
    const slugs = conditions.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every condition unique answer-first + meta copy (no doorway boilerplate)", () => {
    const answers = conditions.map((c) => c.answerFirst);
    const metas = conditions.map((c) => c.metaDescription);
    expect(new Set(answers).size).toBe(answers.length);
    expect(new Set(metas).size).toBe(metas.length);
  });

  it("requires real content on every condition", () => {
    for (const c of conditions) {
      expect(c.about.length).toBeGreaterThanOrEqual(2);
      expect(c.personalization.length).toBeGreaterThan(0);
      expect(c.compoundedOptions.length).toBeGreaterThan(0);
      expect(c.faqs.length).toBeGreaterThanOrEqual(1);
      expect(c.headline.length).toBeGreaterThan(5);
      expect(c.conditionName.length).toBeGreaterThan(1);
    }
  });

  it("maps every condition to a real service", () => {
    for (const c of conditions) {
      expect(getService(c.serviceSlug)).toBeDefined();
    }
  });

  it("keeps compliant framing in every answer-first block", () => {
    for (const c of conditions) {
      const text = c.answerFirst.toLowerCase();
      // Must state non-approval and defer clinical decisions to a provider.
      expect(text).toContain("not fda-approved");
      expect(text).toContain("provider");
      // Must NOT claim Logos RX treats/cures the condition.
      expect(text).not.toMatch(/\bwe (treat|cure)\b/);
    }
  });

  it("only uses absolute internal/anchor hrefs in related links", () => {
    for (const c of conditions) {
      for (const r of c.related) {
        expect(r.href.startsWith("/")).toBe(true);
      }
    }
  });

  it("resolves conditions by slug and returns undefined for unknown", () => {
    expect(getCondition("menopause")?.serviceSlug).toBe("hormone-replacement-therapy");
    expect(getCondition("nope")).toBeUndefined();
  });

  it("inverse-maps conditions for a service", () => {
    const hrt = conditionsForService("hormone-replacement-therapy");
    expect(hrt.length).toBeGreaterThan(0);
    expect(hrt.every((c) => c.serviceSlug === "hormone-replacement-therapy")).toBe(true);

    // every service slug referenced by a condition exists in the catalog
    const serviceSlugs = new Set(services.map((s) => s.slug));
    for (const c of conditions) {
      expect(serviceSlugs.has(c.serviceSlug)).toBe(true);
    }
  });
});
