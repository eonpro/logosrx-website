import { describe, expect, it } from "vitest";
import { HONEYPOT_FIELD, isHoneypotTripped } from "./rate-limit";

describe("honeypot detection", () => {
  it("exposes a stable field name", () => {
    // The form components reference this constant by import, but the API
    // endpoints look it up by literal key from the request body. Lock the
    // value so renames force a coordinated change.
    expect(HONEYPOT_FIELD).toBe("company_website");
  });

  it("trips on any non-empty string value", () => {
    expect(isHoneypotTripped("https://spam.example.com")).toBe(true);
    expect(isHoneypotTripped("a")).toBe(true);
    expect(isHoneypotTripped("   x   ")).toBe(true);
  });

  it("does not trip on empty input", () => {
    expect(isHoneypotTripped("")).toBe(false);
    expect(isHoneypotTripped("   ")).toBe(false);
    expect(isHoneypotTripped(undefined)).toBe(false);
    expect(isHoneypotTripped(null)).toBe(false);
  });

  it("ignores non-string types (defensive: never treat object/array as tripped)", () => {
    expect(isHoneypotTripped(123)).toBe(false);
    expect(isHoneypotTripped({})).toBe(false);
    expect(isHoneypotTripped([])).toBe(false);
    expect(isHoneypotTripped(true)).toBe(false);
  });
});
