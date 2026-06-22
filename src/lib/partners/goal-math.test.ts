import { describe, expect, it } from "vitest";
import { goalProgressPct, periodStart } from "./goal-math";

describe("periodStart", () => {
  const now = new Date("2026-05-17T14:30:00");

  it("month → first of the current month at midnight", () => {
    const d = periodStart("month", now);
    expect(d.getMonth()).toBe(4); // May
    expect(d.getDate()).toBe(1);
    expect(d.getHours()).toBe(0);
  });

  it("quarter → first day of the current quarter", () => {
    // May is in Q2 → April 1.
    const d = periodStart("quarter", now);
    expect(d.getMonth()).toBe(3); // April
    expect(d.getDate()).toBe(1);
  });

  it("year → Jan 1 of the current year", () => {
    const d = periodStart("year", now);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("quarter boundaries map correctly", () => {
    expect(periodStart("quarter", new Date("2026-01-10")).getMonth()).toBe(0);
    expect(periodStart("quarter", new Date("2026-08-10")).getMonth()).toBe(6);
    expect(periodStart("quarter", new Date("2026-12-31")).getMonth()).toBe(9);
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
