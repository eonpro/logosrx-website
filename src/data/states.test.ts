import { describe, expect, it } from "vitest";
import {
  stateLocations,
  getStateLocation,
  stateSlug,
  statesMatchServed,
} from "./states";
import { STATES_SERVED } from "@/lib/constants";

describe("states data integrity", () => {
  it("covers exactly the served jurisdictions (no extra, none missing)", () => {
    expect(statesMatchServed()).toBe(true);
    expect(stateLocations).toHaveLength(STATES_SERVED.length);
  });

  it("uses unique codes and lower-cased slugs", () => {
    const codes = stateLocations.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const s of stateLocations) {
      expect(stateSlug(s.code)).toBe(s.code.toLowerCase());
    }
  });

  it("gives every state unique answer-first + meta copy (no doorway boilerplate)", () => {
    const answers = stateLocations.map((s) => s.answerFirst);
    const metas = stateLocations.map((s) => s.metaDescription);
    const notes = stateLocations.map((s) => s.note);
    expect(new Set(answers).size).toBe(answers.length);
    expect(new Set(metas).size).toBe(metas.length);
    expect(new Set(notes).size).toBe(notes.length);
  });

  it("requires real content on every state (cities + faqs + note)", () => {
    for (const s of stateLocations) {
      expect(s.majorCities.length).toBeGreaterThan(0);
      expect(s.faqs.length).toBeGreaterThanOrEqual(1);
      expect(s.note.length).toBeGreaterThan(20);
      expect(s.headline.length).toBeGreaterThan(10);
      expect(s.region.length).toBeGreaterThan(2);
    }
  });

  it("resolves by slug (case-insensitive) and returns undefined for unknown", () => {
    expect(getStateLocation("ga")?.name).toBe("Georgia");
    expect(getStateLocation("NY")?.name).toBe("New York");
    expect(getStateLocation("zz")).toBeUndefined();
  });
});
