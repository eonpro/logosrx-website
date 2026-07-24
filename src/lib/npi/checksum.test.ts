import { describe, it, expect } from "vitest";
import { isValidNpiChecksum, normalizeNpi } from "./checksum";

describe("isValidNpiChecksum", () => {
  it("accepts known valid NPIs", () => {
    expect(isValidNpiChecksum("1861622060")).toBe(true);
    expect(isValidNpiChecksum("1003802901")).toBe(true);
  });

  it("rejects wrong length or bad check digit", () => {
    expect(isValidNpiChecksum("12345")).toBe(false);
    expect(isValidNpiChecksum("1234567890")).toBe(false);
  });
});

describe("normalizeNpi", () => {
  it("strips non-digits and caps at 10", () => {
    expect(normalizeNpi("186-162-2060")).toBe("1861622060");
    expect(normalizeNpi("18616220609999")).toBe("1861622060");
  });
});
