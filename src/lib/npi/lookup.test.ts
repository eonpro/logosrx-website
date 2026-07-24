import { describe, it, expect, vi } from "vitest";
import { lookupNpiFromRegistry } from "./lookup";

describe("lookupNpiFromRegistry", () => {
  it("rejects invalid checksums without calling the network", async () => {
    const fetchImpl = vi.fn();
    const res = await lookupNpiFromRegistry("1234567890", fetchImpl);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("invalid");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns a parsed provider on a successful NPPES response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result_count: 1,
        results: [
          {
            number: "1861622060",
            enumeration_type: "NPI-1",
            basic: { first_name: "VICTOR", last_name: "CRUZ", credential: "MD" },
            taxonomies: [
              {
                desc: "Internal Medicine",
                license: "ME117105",
                state: "FL",
                primary: true,
              },
            ],
          },
        ],
      }),
    });

    const res = await lookupNpiFromRegistry("1861622060", fetchImpl);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.provider.firstName).toBe("Victor");
      expect(res.provider.lastName).toBe("Cruz");
      expect(res.provider.medicalLicense).toBe("ME117105");
      expect(res.provider.licenseState).toBe("FL");
      expect(res.provider.specialty).toBe("primary_care");
    }
  });

  it("surfaces not_found when NPPES has no match", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result_count: 0, results: [] }),
    });
    const res = await lookupNpiFromRegistry("1861622060", fetchImpl);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("not_found");
  });
});
