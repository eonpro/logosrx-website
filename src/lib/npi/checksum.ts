/** NPI uses the Luhn algorithm with the constant prefix `80840`. */
export function isValidNpiChecksum(npi: string): boolean {
  if (!/^\d{10}$/.test(npi)) return false;
  const digits = `80840${npi}`;
  let sum = 0;
  let doubleNext = true;
  for (let i = digits.length - 2; i >= 0; i--) {
    let n = Number(digits[i]);
    if (doubleNext) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    doubleNext = !doubleNext;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits[digits.length - 1]);
}

export function normalizeNpi(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}
