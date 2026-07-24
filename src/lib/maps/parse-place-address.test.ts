import { describe, it, expect } from "vitest";
import { parsePlaceAddress } from "./parse-place-address";

function comps(
  entries: Array<[string, string, string?]>,
): google.maps.GeocoderAddressComponent[] {
  return entries.map(([type, long_name, short_name]) => ({
    long_name,
    short_name: short_name ?? long_name,
    types: [type],
  }));
}

describe("parsePlaceAddress", () => {
  it("parses a standard US street address", () => {
    expect(
      parsePlaceAddress(
        comps([
          ["street_number", "7543"],
          ["route", "West Waters Avenue"],
          ["locality", "Tampa"],
          ["administrative_area_level_1", "Florida", "FL"],
          ["postal_code", "33615"],
          ["country", "United States", "US"],
        ]),
      ),
    ).toEqual({
      addressLine1: "7543 West Waters Avenue",
      addressCity: "Tampa",
      addressState: "FL",
      addressZip: "33615",
    });
  });

  it("includes subpremise as suite when present", () => {
    const parsed = parsePlaceAddress(
      comps([
        ["street_number", "100"],
        ["route", "Main Street"],
        ["subpremise", "Suite 200"],
        ["locality", "Orlando"],
        ["administrative_area_level_1", "Florida", "FL"],
        ["postal_code", "32801"],
      ]),
    );
    expect(parsed?.addressSuite).toBe("Suite 200");
  });

  it("returns null without a street line", () => {
    expect(
      parsePlaceAddress(
        comps([
          ["locality", "Tampa"],
          ["administrative_area_level_1", "Florida", "FL"],
        ]),
      ),
    ).toBeNull();
  });
});
