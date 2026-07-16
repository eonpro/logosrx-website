/**
 * State board-of-pharmacy licenses held by Logos RX — the source of truth for
 * the private licensure page (`/licensing`).
 *
 * ⚠️ STAKEHOLDER-SUPPLIED. License numbers are transcribed verbatim from the
 * pharmacy's records; update here whenever a license is added, renewed under a
 * new number, or lapses.
 *
 * NOTE: this list is intentionally independent of `STATES_SERVED` in
 * `src/lib/constants.ts` (the marketing/shipping list that drives public state
 * pages). Holding a license is a prerequisite for serving a state, but the two
 * lists may lag each other — e.g. a newly licensed state may not have a public
 * landing page yet.
 */

export interface StateLicense {
  /** USPS code — also the key into `US_STATE_PATHS` for the map. */
  code: string;
  name: string;
  licenseNumber: string;
}

export const STATE_LICENSES: StateLicense[] = [
  { code: "AK", name: "Alaska", licenseNumber: "257654" },
  { code: "AZ", name: "Arizona", licenseNumber: "YO10146" },
  { code: "CO", name: "Colorado", licenseNumber: "OSP.008086" },
  { code: "CT", name: "Connecticut", licenseNumber: "PCN0004487" },
  { code: "DE", name: "Delaware", licenseNumber: "A9_0013209" },
  { code: "FL", name: "Florida", licenseNumber: "PH35710" },
  { code: "GA", name: "Georgia", licenseNumber: "PHNR001834" },
  { code: "HI", name: "Hawaii", licenseNumber: "2234" },
  { code: "ID", name: "Idaho", licenseNumber: "3671078" },
  { code: "IL", name: "Illinois", licenseNumber: "54023301" },
  { code: "IA", name: "Iowa", licenseNumber: "6000" },
  { code: "ME", name: "Maine", licenseNumber: "MO40003870" },
  { code: "MI", name: "Michigan", licenseNumber: "5301013804" },
  { code: "MN", name: "Minnesota", licenseNumber: "267202" },
  { code: "MO", name: "Missouri", licenseNumber: "2025027288" },
  { code: "MT", name: "Montana", licenseNumber: "PHA-MOP-LIC-117305" },
  { code: "NV", name: "Nevada", licenseNumber: "PH04794" },
  { code: "NH", name: "New Hampshire", licenseNumber: "NR2395" },
  { code: "NJ", name: "New Jersey", licenseNumber: "28R000272200" },
  { code: "NM", name: "New Mexico", licenseNumber: "PH00005974" },
  { code: "NY", name: "New York", licenseNumber: "41913" },
  { code: "ND", name: "North Dakota", licenseNumber: "PHAR2300" },
  { code: "OH", name: "Ohio", licenseNumber: "242000118" },
  { code: "PA", name: "Pennsylvania", licenseNumber: "NP002337" },
  { code: "RI", name: "Rhode Island", licenseNumber: "PHN12761" },
  { code: "SD", name: "South Dakota", licenseNumber: "4002592" },
  { code: "UT", name: "Utah", licenseNumber: "1423657" },
  { code: "VT", name: "Vermont", licenseNumber: "36.0135138" },
  { code: "VA", name: "Virginia", licenseNumber: "214002876" },
  { code: "DC", name: "Washington, D.C.", licenseNumber: "NRX250001489" },
  { code: "WA", name: "Washington State", licenseNumber: "PHNR.FO70125403" },
  { code: "WI", name: "Wisconsin", licenseNumber: "3599-43" },
  { code: "WY", name: "Wyoming", licenseNumber: "NR52563" },
];

/** Set of licensed USPS codes, for O(1) lookups when painting the map. */
export const LICENSED_CODES: ReadonlySet<string> = new Set(
  STATE_LICENSES.map((l) => l.code),
);
