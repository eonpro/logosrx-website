/**
 * CSV parsing for the admin transaction import. Pure (no DB) so it's
 * unit-testable; the server action resolves clinics and writes rows.
 *
 * Expected columns (header row required, case/spacing-insensitive):
 *   clinic_id OR clinic_email — which clinic the revenue belongs to
 *   date                      — YYYY-MM-DD (or anything Date.parse accepts)
 *   amount                    — revenue in dollars (e.g. "1234.56")
 *   description (optional)
 *   reference   (optional)    — e.g. LifeFile order id
 */

export interface CsvTransactionRow {
  /** 1-based line number in the source file (for error reporting). */
  line: number;
  clinicId: number | null;
  clinicEmail: string | null;
  date: Date;
  revenueCents: number;
  description: string | null;
  reference: string | null;
}

export interface CsvParseResult {
  rows: CsvTransactionRow[];
  errors: string[];
}

/** Splits a CSV line honoring double-quoted fields (with "" escapes). */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z]/g, "");
}

/** Parses "1234.56", "$1,234.56", "1234" → integer cents. NaN on garbage. */
export function parseDollarsToCents(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return NaN;
  return Math.round(Number(cleaned) * 100);
}

export function parseTransactionsCsv(text: string): CsvParseResult {
  const result: CsvParseResult = { rows: [], errors: [] };
  const lines = text.split(/\r?\n/);

  // Locate the header row.
  let headerIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    headers = splitCsvLine(lines[i]).map(normalizeHeader);
    headerIdx = i;
    break;
  }
  if (headerIdx === -1) {
    result.errors.push("The file is empty.");
    return result;
  }

  const idCol = headers.indexOf("clinicid");
  const emailCol = headers.indexOf("clinicemail");
  const dateCol = headers.indexOf("date");
  const amountCol = headers.findIndex((h) => h === "amount" || h === "revenue");
  const descCol = headers.indexOf("description");
  const refCol = headers.indexOf("reference");

  if (idCol === -1 && emailCol === -1) {
    result.errors.push(
      'Missing a "clinic_id" or "clinic_email" column in the header row.',
    );
    return result;
  }
  if (dateCol === -1 || amountCol === -1) {
    result.errors.push('Missing a "date" or "amount" column in the header row.');
    return result;
  }

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;
    const lineNo = i + 1;
    const fields = splitCsvLine(raw);

    const idRaw = idCol !== -1 ? (fields[idCol] ?? "") : "";
    const emailRaw = emailCol !== -1 ? (fields[emailCol] ?? "") : "";
    const clinicId = idRaw ? Number(idRaw) : null;
    const clinicEmail = emailRaw ? emailRaw.toLowerCase() : null;
    if (
      (clinicId == null || !Number.isInteger(clinicId) || clinicId <= 0) &&
      !clinicEmail
    ) {
      result.errors.push(`Line ${lineNo}: missing clinic id or email.`);
      continue;
    }

    const date = new Date(fields[dateCol] ?? "");
    if (Number.isNaN(date.getTime())) {
      result.errors.push(`Line ${lineNo}: invalid date "${fields[dateCol]}".`);
      continue;
    }

    const revenueCents = parseDollarsToCents(fields[amountCol] ?? "");
    if (Number.isNaN(revenueCents) || revenueCents < 0) {
      result.errors.push(
        `Line ${lineNo}: invalid amount "${fields[amountCol]}".`,
      );
      continue;
    }

    result.rows.push({
      line: lineNo,
      clinicId:
        clinicId != null && Number.isInteger(clinicId) && clinicId > 0
          ? clinicId
          : null,
      clinicEmail,
      date,
      revenueCents,
      description: descCol !== -1 ? fields[descCol]?.slice(0, 300) || null : null,
      reference: refCol !== -1 ? fields[refCol]?.slice(0, 120) || null : null,
    });
  }

  return result;
}
