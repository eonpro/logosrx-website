import { describe, expect, it } from "vitest";
import { resolveDateRange } from "./dates";

const NOW = new Date("2026-06-11T15:30:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

describe("resolveDateRange", () => {
  it("resolves 'today' to local midnight", () => {
    const range = resolveDateRange("today", NOW);
    expect(range.id).toBe("today");
    expect(range.from!.getHours()).toBe(0);
    expect(range.from!.getMinutes()).toBe(0);
    expect(range.from!.getTime()).toBeLessThanOrEqual(NOW.getTime());
  });

  it("resolves rolling windows", () => {
    expect(resolveDateRange("week", NOW).from!.getTime()).toBe(
      NOW.getTime() - 7 * DAY_MS,
    );
    expect(resolveDateRange("month", NOW).from!.getTime()).toBe(
      NOW.getTime() - 30 * DAY_MS,
    );
    expect(resolveDateRange("year", NOW).from!.getTime()).toBe(
      NOW.getTime() - 365 * DAY_MS,
    );
  });

  it("resolves 'all' to no lower bound", () => {
    const range = resolveDateRange("all", NOW);
    expect(range.id).toBe("all");
    expect(range.from).toBeUndefined();
  });

  it("falls back to the default range for unknown or missing input", () => {
    expect(resolveDateRange(undefined, NOW).id).toBe("month");
    expect(resolveDateRange("bogus", NOW).id).toBe("month");
  });
});
