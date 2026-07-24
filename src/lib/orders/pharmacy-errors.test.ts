import { describe, expect, it } from "vitest";

import { humanizePharmacyRejection } from "./pharmacy-errors";

describe("humanizePharmacyRejection", () => {
  it("rewrites LifeFile practice / API network mismatches", () => {
    const raw =
      "Cannot create a new Order: The provided order data references a practice " +
      "(ID: 1266794) with an API Network ID (1949) different to the one from " +
      "the authenticated user (1949).";
    const msg = humanizePharmacyRejection(raw);
    expect(msg).toContain("practice ID is not on our pharmacy network");
    expect(msg).not.toContain("1266794");
  });

  it("passes through other pharmacy rejection text", () => {
    expect(humanizePharmacyRejection("Unknown product id")).toBe(
      "The pharmacy could not accept this order: Unknown product id",
    );
  });
});
