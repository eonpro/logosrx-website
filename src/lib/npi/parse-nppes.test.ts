import { describe, it, expect } from "vitest";
import { parseNppesResponse } from "./parse-nppes";

const sample = {
  result_count: 1,
  results: [
    {
      number: "1861622060",
      enumeration_type: "NPI-1",
      basic: {
        first_name: "VICTOR",
        last_name: "CRUZ",
        credential: "MD",
        status: "A",
      },
      taxonomies: [
        {
          code: "208D00000X",
          desc: "General Practice",
          license: "12476",
          primary: false,
          state: "PR",
        },
        {
          code: "207R00000X",
          desc: "Internal Medicine",
          license: "ME117105",
          primary: true,
          state: "FL",
        },
        {
          code: "208M00000X",
          desc: "Hospitalist",
          license: "ME117105",
          primary: false,
          state: "FL",
        },
      ],
    },
  ],
};

describe("parseNppesResponse", () => {
  it("maps name, primary license, specialty, and extra licenses", () => {
    expect(parseNppesResponse(sample)).toEqual({
      npi: "1861622060",
      firstName: "Victor",
      lastName: "Cruz",
      credential: "MD",
      specialty: "primary_care",
      medicalLicense: "ME117105",
      licenseState: "FL",
      additionalLicenses: [{ license: "12476", state: "PR" }],
      taxonomyDescription: "Internal Medicine",
    });
  });

  it("rejects organizational NPIs", () => {
    expect(
      parseNppesResponse({
        results: [
          {
            number: "1861622060",
            enumeration_type: "NPI-2",
            basic: { organization_name: "ACME CLINIC" },
          },
        ],
      }),
    ).toBeNull();
  });

  it("returns null when empty", () => {
    expect(parseNppesResponse({ result_count: 0, results: [] })).toBeNull();
  });
});
