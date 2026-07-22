import { describe, expect, it } from "vitest";

import { capped, isIsoDate, normalizePhone, stateCode } from "./normalize";

describe("normalizePhone", () => {
  it.each([
    ["(212) 867-5309", "(212) 867-5309"],
    ["212-867-5309", "(212) 867-5309"],
    ["2128675309", "(212) 867-5309"],
    ["+12128675309", "(212) 867-5309"],
    ["1-212-867-5309", "(212) 867-5309"],
    ["212.867.5309", "(212) 867-5309"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    ["", null],
    [null, null],
    [undefined, null],
    ["12345", null],
    ["21286753091234", null],
    // Area code / exchange can't start with 0 or 1.
    ["0128675309", null],
    ["1128675309", null],
    ["2120675309", null],
    ["2121675309", null],
  ])("rejects %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

describe("isIsoDate", () => {
  it("accepts real yyyy-mm-dd dates", () => {
    expect(isIsoDate("1988-06-15")).toBe(true);
    expect(isIsoDate("2026-02-28")).toBe(true);
  });

  it("rejects malformed or impossible dates", () => {
    expect(isIsoDate("06/15/1988")).toBe(false);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });
});

describe("capped", () => {
  it("trims and passes through short values", () => {
    expect(capped("  hello  ", 30)).toBe("hello");
  });

  it("truncates over-length values", () => {
    expect(capped("a".repeat(40), 30)).toBe("a".repeat(30));
  });

  it("returns undefined for blank input", () => {
    expect(capped("   ", 30)).toBeUndefined();
    expect(capped(null, 30)).toBeUndefined();
    expect(capped(undefined, 30)).toBeUndefined();
  });
});

describe("stateCode", () => {
  it("uppercases valid two-letter codes", () => {
    expect(stateCode("fl")).toBe("FL");
    expect(stateCode(" CA ")).toBe("CA");
  });

  it("rejects anything else", () => {
    expect(stateCode("Florida")).toBeUndefined();
    expect(stateCode("F")).toBeUndefined();
    expect(stateCode("")).toBeUndefined();
    expect(stateCode(null)).toBeUndefined();
  });
});
