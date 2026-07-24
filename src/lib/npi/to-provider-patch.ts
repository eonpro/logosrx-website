import type { ClinicProvider } from "@/lib/db/schema";
import type { NpiLookupResult } from "./parse-nppes";

/** Maps an NPPES lookup result onto the clinic provider form fields. */
export function npiResultToProviderPatch(
  result: NpiLookupResult,
): Partial<ClinicProvider> {
  return {
    npi: result.npi,
    firstName: result.firstName,
    lastName: result.lastName,
    ...(result.specialty ? { specialty: result.specialty } : {}),
    ...(result.medicalLicense
      ? { medicalLicense: result.medicalLicense }
      : {}),
    ...(result.licenseState ? { licenseState: result.licenseState } : {}),
    ...(result.additionalLicenses.length > 0
      ? { additionalLicenses: result.additionalLicenses }
      : {}),
  };
}
