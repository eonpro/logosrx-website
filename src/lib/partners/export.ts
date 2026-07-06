/**
 * Minimal, dependency-free CSV builder for partner data exports. Pure (no DB),
 * so it's unit-testable. Fields containing commas, quotes, or newlines are
 * wrapped in double quotes with embedded quotes doubled (RFC 4180).
 *
 * Formula-injection defense: string fields starting with `=`, `+`, `-`, `@`
 * (or a tab/CR) are prefixed with a single quote so Excel/Sheets render them
 * as text instead of executing them as formulas — clinic/rep names are
 * attacker-controllable data. Numeric values are never prefixed.
 */

export type CsvValue = string | number | null | undefined;

const FORMULA_LEAD = /^[=+\-@\t\r]/;
/** Plain numerics (e.g. "-12.34" from centsToDollarString) are safe as-is. */
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

function escapeField(value: CsvValue): string {
  if (value == null) return "";
  let s = String(value);
  if (
    typeof value === "string" &&
    FORMULA_LEAD.test(s) &&
    !PLAIN_NUMBER.test(s)
  ) {
    s = `'${s}`;
  }
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeField).join(","));
  return lines.join("\r\n") + "\r\n";
}

/** Integer cents → plain dollar string for spreadsheets (e.g. 123456 → "1234.56"). */
export function centsToDollarString(cents: number): string {
  return (cents / 100).toFixed(2);
}
