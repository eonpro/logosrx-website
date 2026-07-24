import { describe, it, expect } from "vitest";
import { formatPracticeAddress } from "./format-practice-address";

describe("formatPracticeAddress", () => {
  it("joins street, suite, city, state, and ZIP", () => {
    expect(
      formatPracticeAddress({
        addressLine1: "7543 W Waters Ave",
        addressSuite: "Suite 100",
        addressCity: "Tampa",
        addressState: "FL",
        addressZip: "33615",
      }),
    ).toBe("7543 W Waters Ave, Suite 100, Tampa, FL 33615");
  });

  it("omits empty parts", () => {
    expect(
      formatPracticeAddress({
        addressLine1: "100 Main St",
        addressCity: "Orlando",
        addressState: "FL",
      }),
    ).toBe("100 Main St, Orlando, FL");
  });
});
