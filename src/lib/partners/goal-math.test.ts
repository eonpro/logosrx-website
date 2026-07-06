import { describe, expect, it } from "vitest";
import { goalProgressPct, periodStart } from "./goal-math";

describe("periodStart", () => {
  const now = new Date("2026-05-17T14:30:00Z");

  it("month → first of the current month at UTC midnight", () => {
    const d = periodStart("month", now);
    expect(d.toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });

  it("quarter → first day of the current quarter (UTC)", () => {
    // May is in Q2 → April 1.
    const d = periodStart("quarter", now);
    expect(d.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("year → Jan 1 of the current year (UTC)", () => {
    const d = periodStart("year", now);
    expect(d.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("quarter boundaries map correctly", () => {
    expect(periodStart("quarter", new Date("2026-01-10")).getUTCMonth()).toBe(0);
    expect(periodStart("quarter", new Date("2026-08-10")).getUTCMonth()).toBe(6);
    expect(periodStart("quarter", new Date("2026-12-31")).getUTCMonth()).toBe(9);
  });

  it("includes UTC-midnight transactions from the 1st of the month", () => {
    // A CSV-imported transaction dated the 1st is exactly UTC midnight; the
    // period boundary must not exclude it on non-UTC servers.
    const txDate = new Date("2026-05-01");
    expect(periodStart("month", now).getTime()).toBeLessThanOrEqual(
      txDate.getTime(),
    );
  });
});

describe("goalProgressPct", () => {
  it("computes a rounded percentage", () => {
    expect(goalProgressPct(2500, 10000)).toBe(25);
    expect(goalProgressPct(3333, 10000)).toBe(33);
  });

  it("clamps to 100 when exceeded", () => {
    expect(goalProgressPct(15000, 10000)).toBe(100);
  });

  it("returns 0 for a non-positive target", () => {
    expect(goalProgressPct(500, 0)).toBe(0);
    expect(goalProgressPct(500, -1)).toBe(0);
  });

  it("never goes negative", () => {
    expect(goalProgressPct(-500, 10000)).toBe(0);
  });
});
