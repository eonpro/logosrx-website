import { describe, expect, it } from "vitest";
import {
  bpsToPercent,
  computeCommissionSplit,
  formatBps,
  formatCents,
  percentToBps,
  summarizeCommissionRows,
  validateOrgRateBps,
  validateRepRateBps,
} from "./commission";

describe("rate conversions", () => {
  it("converts basis points to percent and back", () => {
    expect(bpsToPercent(750)).toBe(7.5);
    expect(bpsToPercent(10_000)).toBe(100);
    expect(percentToBps(7.5)).toBe(750);
    expect(percentToBps(100)).toBe(10_000);
  });

  it("rounds fractional percent input to the nearest basis point", () => {
    expect(percentToBps(7.333)).toBe(733);
    expect(percentToBps(7.339)).toBe(734);
  });
});

describe("validateOrgRateBps", () => {
  it("accepts 0–100%", () => {
    expect(validateOrgRateBps(0)).toBeNull();
    expect(validateOrgRateBps(750)).toBeNull();
    expect(validateOrgRateBps(10_000)).toBeNull();
  });

  it("rejects negatives, overshoot, and non-integers", () => {
    expect(validateOrgRateBps(-1)).toBeTruthy();
    expect(validateOrgRateBps(10_001)).toBeTruthy();
    expect(validateOrgRateBps(1.5)).toBeTruthy();
    expect(validateOrgRateBps(NaN)).toBeTruthy();
  });
});

describe("validateRepRateBps", () => {
  it("allows any rate up to the org's rate", () => {
    expect(validateRepRateBps(0, 1000)).toBeNull();
    expect(validateRepRateBps(500, 1000)).toBeNull();
    expect(validateRepRateBps(1000, 1000)).toBeNull();
  });

  it("rejects rates above the org's rate", () => {
    expect(validateRepRateBps(1001, 1000)).toMatch(/cannot exceed/);
  });

  it("rejects negative and non-integer rates", () => {
    expect(validateRepRateBps(-1, 1000)).toBeTruthy();
    expect(validateRepRateBps(2.5, 1000)).toBeTruthy();
  });
});

describe("computeCommissionSplit", () => {
  it("pays the org the full rate when there is no rep", () => {
    expect(
      computeCommissionSplit({ revenueCents: 100_000, orgRateBps: 1000 }),
    ).toEqual([{ payee: "org", rateBps: 1000, amountCents: 10_000 }]);
  });

  it("carves the rep share out of the org's commission", () => {
    const split = computeCommissionSplit({
      revenueCents: 100_000, // $1,000
      orgRateBps: 1000, // 10%
      repRateBps: 400, // 4%
    });
    expect(split).toEqual([
      { payee: "org", rateBps: 600, amountCents: 6_000 },
      { payee: "rep", rateBps: 400, amountCents: 4_000 },
    ]);
  });

  it("never pays more than the org-rate total, even with rounding", () => {
    // 333 cents at 7.5% = 24.975 cents → 25; rep at 2.5% = 8.325 → 8.
    const split = computeCommissionSplit({
      revenueCents: 333,
      orgRateBps: 750,
      repRateBps: 250,
    });
    const total = split.reduce((sum, e) => sum + e.amountCents, 0);
    expect(total).toBe(Math.round((333 * 750) / 10_000));
    expect(split.find((e) => e.payee === "rep")?.amountCents).toBe(8);
    expect(split.find((e) => e.payee === "org")?.amountCents).toBe(17);
  });

  it("handles a rep rate equal to the org rate (org keeps nothing)", () => {
    const split = computeCommissionSplit({
      revenueCents: 50_000,
      orgRateBps: 800,
      repRateBps: 800,
    });
    expect(split.find((e) => e.payee === "org")?.amountCents).toBe(0);
    expect(split.find((e) => e.payee === "rep")?.amountCents).toBe(4_000);
  });

  it("returns a zero-amount entry for a 0% org rate", () => {
    expect(
      computeCommissionSplit({ revenueCents: 100_000, orgRateBps: 0 }),
    ).toEqual([{ payee: "org", rateBps: 0, amountCents: 0 }]);
  });

  it("throws on invalid inputs", () => {
    expect(() =>
      computeCommissionSplit({ revenueCents: -1, orgRateBps: 1000 }),
    ).toThrow();
    expect(() =>
      computeCommissionSplit({ revenueCents: 10.5, orgRateBps: 1000 }),
    ).toThrow();
    expect(() =>
      computeCommissionSplit({ revenueCents: 100, orgRateBps: 10_001 }),
    ).toThrow();
    expect(() =>
      computeCommissionSplit({
        revenueCents: 100,
        orgRateBps: 500,
        repRateBps: 600,
      }),
    ).toThrow();
  });
});

describe("summarizeCommissionRows", () => {
  const rows = [
    { payee: "org" as const, status: "pending" as const, totalCents: 5_000 },
    { payee: "org" as const, status: "paid" as const, totalCents: 2_000 },
    { payee: "rep" as const, status: "pending" as const, totalCents: 1_500 },
    { payee: "rep" as const, status: "paid" as const, totalCents: 500 },
  ];

  it("summarizes from the org owner's perspective", () => {
    expect(summarizeCommissionRows(rows, "org")).toEqual({
      ownCents: 7_000,
      repCents: 2_000,
      unpaidCents: 5_000,
      paidCents: 2_000,
    });
  });

  it("summarizes from a rep's perspective", () => {
    expect(summarizeCommissionRows(rows, "rep")).toEqual({
      ownCents: 2_000,
      repCents: 0,
      unpaidCents: 1_500,
      paidCents: 500,
    });
  });

  it("treats approved entries as unpaid", () => {
    expect(
      summarizeCommissionRows(
        [{ payee: "org", status: "approved", totalCents: 900 }],
        "org",
      ),
    ).toEqual({ ownCents: 900, repCents: 0, unpaidCents: 900, paidCents: 0 });
  });

  it("handles an empty ledger", () => {
    expect(summarizeCommissionRows([], "org")).toEqual({
      ownCents: 0,
      repCents: 0,
      unpaidCents: 0,
      paidCents: 0,
    });
  });
});

describe("formatters", () => {
  it("formats cents as USD", () => {
    expect(formatCents(123_456)).toBe("$1,234.56");
    expect(formatCents(0)).toBe("$0.00");
  });

  it("formats basis points as a percent label", () => {
    expect(formatBps(750)).toBe("7.5%");
    expect(formatBps(1000)).toBe("10%");
    expect(formatBps(0)).toBe("0%");
  });
});
