/**
 * CSV parsing for the admin invoice builder. Pure (no DB, no server-only
 * imports) so it runs both server-side (PDF generation) and client-side
 * (upload preview) and is unit-testable.
 *
 * Expected input is the LifeFile-style shipment report export with a header
 * row. Column matching is case/spacing-insensitive:
 *   Date Range, Date Written, Date Shipped, Ship to State, Patient Name,
 *   Practice Name, Drug Name, Rx Qty, Rx Status, Rx Price, Order ID
 *
 * Only Patient Name, Drug Name and Rx Price are required headers; every other
 * column is optional and rendered as "—" in the PDF when absent.
 */

export interface InvoiceCsvRow {
  /** 1-based line number in the source file (for error reporting). */
  line: number;
  dateWritten: string | null;
  dateShipped: string | null;
  shipToState: string | null;
  patientName: string | null;
  practiceName: string | null;
  drugName: string | null;
  rxQty: number | null;
  rxStatus: string | null;
  rxPriceCents: number | null;
  orderId: string | null;
}

export interface InvoiceCsvResult {
  rows: InvoiceCsvRow[];
  errors: string[];
  /** Sum of all parsed Rx Price values, in cents. */
  totalCents: number;
  /** First non-empty "Date Range" value seen (e.g. "07/20/2026- 08/02/2026"). */
  dateRange: string | null;
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

/** Parses "80.00", "$ 80.00", "$1,234.5" → integer cents. NaN on garbage. */
export function parseMoneyToCents(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return NaN;
  return Math.round(Number(cleaned) * 100);
}

const MAX_ROWS = 5000;

export function parseInvoiceCsv(text: string): InvoiceCsvResult {
  const result: InvoiceCsvResult = {
    rows: [],
    errors: [],
    totalCents: 0,
    dateRange: null,
  };
  const lines = text.split(/\r?\n/);

  // Locate the header row (skip leading blank lines).
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

  const col = (...names: string[]) =>
    headers.findIndex((h) => names.includes(h));

  const dateRangeCol = col("daterange");
  const dateWrittenCol = col("datewritten", "writtendate");
  const dateShippedCol = col("dateshipped", "shippeddate", "shipdate");
  const stateCol = col("shiptostate", "state");
  const patientCol = col("patientname", "patient");
  const practiceCol = col("practicename", "practice", "clinicname");
  const drugCol = col("drugname", "drug", "medication");
  const qtyCol = col("rxqty", "qty", "quantity");
  const statusCol = col("rxstatus", "status");
  const priceCol = col("rxprice", "price", "amount");
  const orderIdCol = col("orderid", "ordernumber", "order");

  const missing: string[] = [];
  if (patientCol === -1) missing.push("Patient Name");
  if (drugCol === -1) missing.push("Drug Name");
  if (priceCol === -1) missing.push("Rx Price");
  if (missing.length > 0) {
    result.errors.push(
      `Missing required column(s) in the header row: ${missing.join(", ")}.`,
    );
    return result;
  }

  const val = (fields: string[], idx: number): string | null =>
    idx !== -1 ? fields[idx]?.trim() || null : null;

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;
    const lineNo = i + 1;
    const fields = splitCsvLine(raw);

    const patientName = val(fields, patientCol);
    const drugName = val(fields, drugCol);
    const orderId = val(fields, orderIdCol);
    // Skip filler/summary lines with none of the identifying fields.
    if (!patientName && !drugName && !orderId) continue;

    if (result.rows.length >= MAX_ROWS) {
      result.errors.push(
        `The file has more than ${MAX_ROWS} transactions — split it into smaller files.`,
      );
      break;
    }

    if (!result.dateRange) {
      result.dateRange = val(fields, dateRangeCol);
    }

    let rxPriceCents: number | null = null;
    const priceRaw = val(fields, priceCol);
    if (priceRaw) {
      rxPriceCents = parseMoneyToCents(priceRaw);
      if (Number.isNaN(rxPriceCents)) {
        result.errors.push(`Line ${lineNo}: invalid Rx Price "${priceRaw}".`);
        continue;
      }
    }

    let rxQty: number | null = null;
    const qtyRaw = val(fields, qtyCol);
    if (qtyRaw) {
      const n = Number(qtyRaw.replace(/,/g, ""));
      rxQty = Number.isFinite(n) ? n : null;
    }

    result.rows.push({
      line: lineNo,
      dateWritten: val(fields, dateWrittenCol),
      dateShipped: val(fields, dateShippedCol),
      shipToState: val(fields, stateCol),
      patientName,
      practiceName: val(fields, practiceCol),
      drugName,
      rxQty,
      rxStatus: val(fields, statusCol),
      rxPriceCents,
      orderId,
    });
    result.totalCents += rxPriceCents ?? 0;
  }

  if (result.rows.length === 0 && result.errors.length === 0) {
    result.errors.push("No transactions found in the file.");
  }

  return result;
}
