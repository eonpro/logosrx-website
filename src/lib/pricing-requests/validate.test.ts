import { describe, expect, it } from "vitest";
import {
  MAX_MESSAGE_LEN,
  MAX_PRODUCT_IDS,
  isVolumeBand,
  validatePricingRequestInput,
} from "./validate";

describe("isVolumeBand", () => {
  it("accepts known bands", () => {
    expect(isVolumeBand("0_5000")).toBe(true);
    expect(isVolumeBand("50000_plus")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isVolumeBand("")).toBe(false);
    expect(isVolumeBand("high")).toBe(false);
  });
});

describe("validatePricingRequestInput", () => {
  it("requires a volume band", () => {
    expect(
      validatePricingRequestInput({
        volumeBand: "",
        productIds: [],
        message: "",
      }),
    ).toMatch(/volume/i);
  });

  it("accepts a minimal valid request", () => {
    expect(
      validatePricingRequestInput({
        volumeBand: "5000_15000",
        productIds: [],
        message: "",
      }),
    ).toBeNull();
  });

  it("accepts product focus + notes", () => {
    expect(
      validatePricingRequestInput({
        volumeBand: "15000_50000",
        productIds: ["semaglutide-glycine-2.5mg-1ml"],
        message: "We expect ~200 vials/month.",
      }),
    ).toBeNull();
  });

  it("rejects too many products", () => {
    expect(
      validatePricingRequestInput({
        volumeBand: "0_5000",
        productIds: Array.from({ length: MAX_PRODUCT_IDS + 1 }, (_, i) => `p${i}`),
        message: "",
      }),
    ).toMatch(/at most/i);
  });

  it("rejects oversized message", () => {
    expect(
      validatePricingRequestInput({
        volumeBand: "0_5000",
        productIds: [],
        message: "x".repeat(MAX_MESSAGE_LEN + 1),
      }),
    ).toMatch(/characters/i);
  });

  it("rejects empty product ids", () => {
    expect(
      validatePricingRequestInput({
        volumeBand: "0_5000",
        productIds: ["  "],
        message: "",
      }),
    ).toMatch(/invalid/i);
  });
});
