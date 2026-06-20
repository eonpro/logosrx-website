import { describe, it, expect } from "vitest";
import {
  generateQuoteToken,
  generateQuotePassword,
  hashQuotePassword,
  verifyQuotePassword,
  signQuoteAccess,
  verifyQuoteAccess,
  signQuoteClaim,
  verifyQuoteClaim,
} from "./crypto";

describe("generateQuoteToken", () => {
  it("produces the requested length from the URL-safe alphabet", () => {
    const t = generateQuoteToken(24);
    expect(t).toHaveLength(24);
    expect(t).toMatch(/^[a-z2-9]+$/);
    // No ambiguous characters.
    expect(t).not.toMatch(/[01oil]/);
  });

  it("is effectively unique across calls", () => {
    const seen = new Set(Array.from({ length: 500 }, () => generateQuoteToken()));
    expect(seen.size).toBe(500);
  });
});

describe("generateQuotePassword", () => {
  it("formats as dash-separated groups from an unambiguous alphabet", () => {
    const pw = generateQuotePassword();
    expect(pw).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });
});

describe("hashQuotePassword / verifyQuotePassword", () => {
  it("verifies the correct password", () => {
    const pw = generateQuotePassword();
    const hash = hashQuotePassword(pw);
    expect(verifyQuotePassword(pw, hash)).toBe(true);
  });

  it("rejects the wrong password", () => {
    const hash = hashQuotePassword("ABCD-EFGH-JKMN");
    expect(verifyQuotePassword("ZZZZ-ZZZZ-ZZZZ", hash)).toBe(false);
  });

  it("is case-insensitive and ignores separators", () => {
    const hash = hashQuotePassword("7HFK-Q3MN-XP9R");
    expect(verifyQuotePassword("7hfkq3mnxp9r", hash)).toBe(true);
    expect(verifyQuotePassword("7hfk q3mn xp9r", hash)).toBe(true);
  });

  it("uses a random salt (same password → different hash)", () => {
    expect(hashQuotePassword("SAME-SAME-SAME")).not.toBe(
      hashQuotePassword("SAME-SAME-SAME"),
    );
  });

  it("rejects malformed stored hashes", () => {
    expect(verifyQuotePassword("anything", "")).toBe(false);
    expect(verifyQuotePassword("anything", "no-colon")).toBe(false);
  });
});

describe("quote access cookie", () => {
  it("round-trips for the matching token", () => {
    const cookie = signQuoteAccess("token-abc");
    expect(verifyQuoteAccess(cookie, "token-abc")).toBe(true);
  });

  it("rejects a different token", () => {
    const cookie = signQuoteAccess("token-abc");
    expect(verifyQuoteAccess(cookie, "token-xyz")).toBe(false);
  });

  it("rejects tampered or missing values", () => {
    expect(verifyQuoteAccess(undefined, "t")).toBe(false);
    expect(verifyQuoteAccess("garbage", "t")).toBe(false);
    const cookie = signQuoteAccess("t");
    expect(verifyQuoteAccess(cookie + "x", "t")).toBe(false);
  });

  it("rejects an expired grant", () => {
    const expired = signQuoteAccess("t", -10);
    expect(verifyQuoteAccess(expired, "t")).toBe(false);
  });
});

describe("quote claim cookie", () => {
  it("round-trips the quote id and token", () => {
    const cookie = signQuoteClaim(42, "tok");
    expect(verifyQuoteClaim(cookie)).toEqual({ quoteId: 42, token: "tok" });
  });

  it("rejects tampered, malformed, or expired values", () => {
    expect(verifyQuoteClaim(undefined)).toBeNull();
    expect(verifyQuoteClaim("a.b.c")).toBeNull();
    expect(verifyQuoteClaim(signQuoteClaim(1, "t") + "x")).toBeNull();
    expect(verifyQuoteClaim(signQuoteClaim(1, "t", -10))).toBeNull();
  });
});
