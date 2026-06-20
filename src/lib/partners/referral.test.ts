import { describe, expect, it } from "vitest";
import {
  attributionFromLink,
  generateReferralCode,
  isValidReferralCode,
  referralUrl,
} from "./referral";

describe("generateReferralCode", () => {
  it("produces 10-char lowercase codes from the unambiguous alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode();
      expect(code).toHaveLength(10);
      expect(code).toMatch(/^[abcdefghijkmnpqrstuvwxyz23456789]+$/);
    }
  });

  it("produces distinct codes", () => {
    const codes = new Set(
      Array.from({ length: 100 }, () => generateReferralCode()),
    );
    expect(codes.size).toBe(100);
  });

  it("always passes its own validity check", () => {
    expect(isValidReferralCode(generateReferralCode())).toBe(true);
  });
});

describe("isValidReferralCode", () => {
  it("accepts alphanumeric codes between 4 and 32 chars", () => {
    expect(isValidReferralCode("abcd")).toBe(true);
    expect(isValidReferralCode("k3vq8m2xnp")).toBe(true);
    expect(isValidReferralCode("A1B2C3D4")).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(isValidReferralCode("")).toBe(false);
    expect(isValidReferralCode("abc")).toBe(false);
    expect(isValidReferralCode("a".repeat(33))).toBe(false);
    expect(isValidReferralCode("has space")).toBe(false);
    expect(isValidReferralCode("semi;colon")).toBe(false);
    expect(isValidReferralCode("../../etc")).toBe(false);
  });
});

describe("attributionFromLink", () => {
  it("maps an active org-level link (no rep)", () => {
    expect(
      attributionFromLink({ id: 7, orgId: 3, repId: null, active: true }),
    ).toEqual({ referralLinkId: 7, partnerOrgId: 3, partnerRepId: null });
  });

  it("maps an active rep-level link to both the rep and the org", () => {
    expect(
      attributionFromLink({ id: 9, orgId: 3, repId: 12, active: true }),
    ).toEqual({ referralLinkId: 9, partnerOrgId: 3, partnerRepId: 12 });
  });

  it("returns null for deactivated links", () => {
    expect(
      attributionFromLink({ id: 9, orgId: 3, repId: 12, active: false }),
    ).toBeNull();
  });

  it("returns null for missing links", () => {
    expect(attributionFromLink(null)).toBeNull();
    expect(attributionFromLink(undefined)).toBeNull();
  });
});

describe("referralUrl", () => {
  it("builds the public /join URL from the code", () => {
    expect(referralUrl("k3vq8m2xnp")).toMatch(/\/join\/k3vq8m2xnp$/);
  });
});
