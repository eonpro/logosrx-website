import { isValidNpiChecksum, normalizeNpi } from "./checksum";
import {
  parseNppesResponse,
  type NpiLookupResult,
  type NppesResponse,
} from "./parse-nppes";

const NPPES_URL = "https://npiregistry.cms.hhs.gov/api/";

export type LookupNpiOutcome =
  | { ok: true; provider: NpiLookupResult }
  | { ok: false; error: string; code: "invalid" | "not_found" | "upstream" };

/**
 * Looks up an individual provider NPI via the public CMS NPPES Registry API.
 * No API key required. Intended for server-side use (avoids browser CORS).
 */
export async function lookupNpiFromRegistry(
  rawNpi: string,
  fetchImpl: typeof fetch = fetch,
): Promise<LookupNpiOutcome> {
  const npi = normalizeNpi(rawNpi);
  if (npi.length !== 10) {
    return { ok: false, code: "invalid", error: "Enter a 10-digit NPI." };
  }
  if (!isValidNpiChecksum(npi)) {
    return {
      ok: false,
      code: "invalid",
      error: "That NPI number looks invalid. Double-check the digits.",
    };
  }

  const url = new URL(NPPES_URL);
  url.searchParams.set("version", "2.1");
  url.searchParams.set("number", npi);

  let res: Response;
  try {
    res = await fetchImpl(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    return {
      ok: false,
      code: "upstream",
      error: "Could not reach the NPI registry. Try again in a moment.",
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      code: "upstream",
      error: "NPI registry returned an error. Try again shortly.",
    };
  }

  let data: NppesResponse;
  try {
    data = (await res.json()) as NppesResponse;
  } catch {
    return {
      ok: false,
      code: "upstream",
      error: "Could not read the NPI registry response.",
    };
  }

  const provider = parseNppesResponse(data);
  if (!provider) {
    return {
      ok: false,
      code: "not_found",
      error: "No individual provider found for that NPI.",
    };
  }

  return { ok: true, provider };
}
