/**
 * Minimal, dependency-free CSV builder for partner data exports. Pure (no DB),
 * so it's unit-testable. Fields containing commas, quotes, or newlines are
 * wrapped in double quotes with embedded quotes doubled (RFC 4180).
 */

export type CsvValue = string | number | null | undefined;

function escapeField(value: CsvValue): string {
  const s = value == null ? "" : String(value);
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
