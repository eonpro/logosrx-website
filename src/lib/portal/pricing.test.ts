import { describe, expect, it } from "vitest";
import {
  computeEffectivePriceCents,
  discountPercent,
  formatCents,
} from "./pricing";

describe("computeEffectivePriceCents", () => {
  it("returns the override when present, ignoring discount + standard", () => {
    expect(computeEffectivePriceCents(8500, 20, 7000)).toBe(7000);
    expect(computeEffectivePriceCents(null, 50, 5000)).toBe(5000);
  });

  it("applies a flat discount to the standard price", () => {
    expect(computeEffectivePriceCents(10000, 0, null)).toBe(10000);
    expect(computeEffectivePriceCents(10000, 20, null)).toBe(8000);
    expect(computeEffectivePriceCents(8500, 15, null)).toBe(7225);
  });

  it("rounds to the nearest cent", () => {
    // 8500 * 0.85 = 7225 exactly; 8533 * 0.85 = 7253.05 → 7253
    expect(computeEffectivePriceCents(8533, 15, null)).toBe(7253);
  });

  it("clamps discount to 0–100 and never goes negative", () => {
    expect(computeEffectivePriceCents(10000, 150, null)).toBe(0);
    expect(computeEffectivePriceCents(10000, -10, null)).toBe(10000);
    expect(computeEffectivePriceCents(10000, 100, null)).toBe(0);
  });

  it("returns null when there is no standard price and no override", () => {
    expect(computeEffectivePriceCents(null, 20, null)).toBeNull();
  });

  it("guards against non-finite inputs", () => {
    expect(computeEffectivePriceCents(Number.NaN, 10, null)).toBeNull();
    expect(computeEffectivePriceCents(1000, 10, Number.NaN)).toBe(900);
  });
});

describe("discountPercent", () => {
  it("computes whole-percent savings", () => {
    expect(discountPercent(10000, 8000)).toBe(20);
    expect(discountPercent(8500, 7225)).toBe(15);
  });

  it("is 0 when not discounted or inputs missing", () => {
    expect(discountPercent(10000, 10000)).toBe(0);
    expect(discountPercent(null, 5000)).toBe(0);
    expect(discountPercent(10000, null)).toBe(0);
    expect(discountPercent(10000, 12000)).toBe(0);
  });
});

describe("formatCents", () => {
  it("formats integer cents as USD", () => {
    expect(formatCents(8500)).toBe("$85.00");
    expect(formatCents(0)).toBe("$0.00");
  });

  it("falls back to 'Contact us' for null/undefined/NaN", () => {
    expect(formatCents(null)).toBe("Contact us");
    expect(formatCents(undefined)).toBe("Contact us");
    expect(formatCents(Number.NaN)).toBe("Contact us");
  });
});
