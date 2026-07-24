import { mapTaxonomyToSpecialty } from "./map-specialty";

export type NpiLookupResult = {
  npi: string;
  firstName: string;
  lastName: string;
  credential: string;
  specialty: string | null;
  medicalLicense: string;
  licenseState: string;
  additionalLicenses: Array<{ license: string; state: string }>;
  taxonomyDescription: string | null;
};

type NppesTaxonomy = {
  code?: string;
  desc?: string;
  license?: string;
  state?: string;
  primary?: boolean;
};

type NppesBasic = {
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  credential?: string;
  status?: string;
};

type NppesResult = {
  number?: string;
  enumeration_type?: string;
  basic?: NppesBasic;
  taxonomies?: NppesTaxonomy[];
};

export type NppesResponse = {
  result_count?: number;
  results?: NppesResult[];
};

function titleCaseName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .split(/([\s'-]+)/)
    .map((part) =>
      /^[\s'-]+$/.test(part)
        ? part
        : part
            ? part[0]!.toUpperCase() + part.slice(1)
            : part,
    )
    .join("");
}

/** Maps a single NPPES result into our provider credential fields. */
export function parseNppesResult(result: NppesResult): NpiLookupResult | null {
  const npi = result.number?.replace(/\D/g, "") ?? "";
  if (npi.length !== 10) return null;

  // Organizational (Type 2) NPIs aren't individual providers on this form.
  if (result.enumeration_type === "NPI-2") return null;

  const firstName = titleCaseName(result.basic?.first_name ?? "");
  const lastName = titleCaseName(result.basic?.last_name ?? "");
  if (!firstName || !lastName) return null;

  const taxonomies = result.taxonomies ?? [];
  const primary =
    taxonomies.find((t) => t.primary) ?? taxonomies[0] ?? null;

  const medicalLicense = (primary?.license ?? "").trim();
  const licenseState = (primary?.state ?? "").trim().toUpperCase();

  const primaryKey = `${medicalLicense}|${licenseState}`;
  const additionalLicenses: Array<{ license: string; state: string }> = [];
  const seen = new Set<string>(primaryKey ? [primaryKey] : []);

  for (const t of taxonomies) {
    const license = (t.license ?? "").trim();
    const state = (t.state ?? "").trim().toUpperCase();
    if (!license || !state) continue;
    const key = `${license}|${state}`;
    if (seen.has(key)) continue;
    seen.add(key);
    additionalLicenses.push({ license, state });
  }

  return {
    npi,
    firstName,
    lastName,
    credential: (result.basic?.credential ?? "").trim(),
    specialty: mapTaxonomyToSpecialty(primary?.desc),
    medicalLicense,
    licenseState,
    additionalLicenses,
    taxonomyDescription: primary?.desc?.trim() || null,
  };
}

export function parseNppesResponse(
  data: NppesResponse,
): NpiLookupResult | null {
  const first = data.results?.[0];
  if (!first) return null;
  return parseNppesResult(first);
}
