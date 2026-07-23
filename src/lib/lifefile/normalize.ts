/**
 * Normalization helpers for LifeFile wire formats. Pure functions — unit
 * tested in `normalize.test.ts`.
 */

/**
 * Normalize a US/Canadian phone number to LifeFile's `(987) 654-3210` format
 * (max 16 chars). Accepts common inputs: `(XXX) XXX-XXXX`, `XXX-XXX-XXXX`,
 * `+1XXXXXXXXXX`, 10 plain digits. Returns `null` when the input can't be
 * reduced to a 10-digit NANP number, so callers can reject with a clear
 * validation error instead of forwarding garbage to the pharmacy.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) return null;
  // NANP: area code and exchange can't start with 0 or 1.
  if (digits[0] === "0" || digits[0] === "1") return null;
  if (digits[3] === "0" || digits[3] === "1") return null;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** True for `yyyy-mm-dd` strings that are real calendar dates. */
export function isIsoDate(value: string | null | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/**
 * Trim a string and cap it at `max` characters (LifeFile rejects over-length
 * fields; we truncate display-only fields rather than fail the order).
 * Returns `undefined` for empty/blank input so optional fields are omitted
 * from the payload entirely.
 */
export function capped(
  value: string | null | undefined,
  max: number,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max);
}

/** Two-letter uppercase state code, or undefined. */
export function stateCode(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim().toUpperCase();
  return trimmed && /^[A-Z]{2}$/.test(trimmed) ? trimmed : undefined;
}
