import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
  type RGB,
} from "pdf-lib";
import sharp from "sharp";
import { CONTACT, SITE } from "@/lib/constants";
import type { InvoiceCsvRow } from "@/lib/invoices/csv";

/**
 * Logos RX–branded invoice PDF built from the admin invoice builder: a cover
 * page (client, date of service, total) followed by "Attachment A" — a
 * landscape table listing every transaction from the uploaded CSV.
 *
 * The cover is rendered with `@react-pdf/renderer` (same pipeline as quotes),
 * but the attachment sheets are drawn directly with `pdf-lib`: react-pdf's
 * layout engine is far too slow for shipment-report volumes (a 7.5k-row file
 * 504'd in production at ~6 ms/row locally), while direct text drawing with
 * measured columns handles tens of thousands of rows in seconds.
 */

// Brand palette (mirrors --color-* tokens in globals.css).
const NAVY = "#262262";
const MAGENTA = "#C62E88";
const CREAM = "#F5F4F1";
const BEIGE = "#E8E6E1";
const INK_SOFT = "#6B6890"; // navy at ~60%

function hexRgb(hex: string): RGB {
  return rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );
}

const NAVY_RGB = hexRgb(NAVY);
const CREAM_RGB = hexRgb(CREAM);
const BEIGE_RGB = hexRgb(BEIGE);
const INK_SOFT_RGB = hexRgb(INK_SOFT);
const WHITE_RGB = rgb(1, 1, 1);

const PUBLIC_DIR = path.join(process.cwd(), "public");

// Skip Knuth-Plass hyphenation on the cover; word-boundary wrapping is fine.
Font.registerHyphenationCallback((word) => [word]);

let cachedLogo: Buffer | null = null;
async function loadLogo(): Promise<Buffer | null> {
  if (cachedLogo) return cachedLogo;
  try {
    const raw = await readFile(path.join(PUBLIC_DIR, "images", "logo.svg"));
    cachedLogo = await sharp(raw, { density: 300 })
      .resize({ width: 480, withoutEnlargement: false })
      .png()
      .toBuffer();
  } catch {
    cachedLogo = null;
  }
  return cachedLogo;
}

export function formatCentsUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export interface InvoicePdfInput {
  invoiceNumber: string;
  clientName: string;
  /** Human-readable date of service (e.g. "07/20/2026 – 08/02/2026"). */
  dateOfService: string;
  issuedAt: Date;
  totalCents: number;
  notes: string | null;
  transactions: InvoiceCsvRow[];
}

/* ------------------------------------------------------------------ */
/* Cover page (react-pdf — one page, layout engine cost is negligible) */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: NAVY,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  logo: { width: 120 },
  headerRight: { alignItems: "flex-end" },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: INK_SOFT,
  },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 2 },
  meta: { fontSize: 9, color: INK_SOFT, marginTop: 2 },
  rule: { height: 3, backgroundColor: MAGENTA, borderRadius: 2, marginBottom: 18 },
  billCard: {
    backgroundColor: CREAM,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  clientName: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 3 },
  metaGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  metaBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BEIGE,
    borderRadius: 10,
    padding: 12,
  },
  metaValue: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 4 },
  totalCard: {
    backgroundColor: NAVY,
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    color: "#FFFFFF",
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  totalValue: { color: "#FFFFFF", fontSize: 24, fontFamily: "Helvetica-Bold" },
  notes: { marginTop: 4, lineHeight: 1.5, color: INK_SOFT },
  attachmentNote: {
    marginTop: 12,
    fontSize: 9,
    color: INK_SOFT,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 24,
    borderTopWidth: 1,
    borderTopColor: BEIGE,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: INK_SOFT },
});

function InvoiceCover({
  input,
  logo,
  txTotalCents,
}: {
  input: InvoicePdfInput;
  logo: Buffer | null;
  txTotalCents: number;
}) {
  const issued = input.issuedAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Document
      title={`${SITE.name} Invoice ${input.invoiceNumber} — ${input.clientName}`}
      author={SITE.name}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          {logo ? (
            /* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */
            <Image style={styles.logo} src={{ data: logo, format: "png" }} />
          ) : (
            <Text style={styles.title}>{SITE.name}</Text>
          )}
          <View style={styles.headerRight}>
            <Text style={styles.kicker}>Invoice</Text>
            <Text style={styles.title}>{input.invoiceNumber}</Text>
            <Text style={styles.meta}>Issued {issued}</Text>
          </View>
        </View>
        <View style={styles.rule} />

        <View style={styles.billCard}>
          <Text style={styles.kicker}>Billed to</Text>
          <Text style={styles.clientName}>{input.clientName}</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.kicker}>Date of service</Text>
            <Text style={styles.metaValue}>{input.dateOfService}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.kicker}>Transactions</Text>
            <Text style={styles.metaValue}>{input.transactions.length}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.kicker}>Issued by</Text>
            <Text style={styles.metaValue}>{SITE.name}</Text>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total due</Text>
          <Text style={styles.totalValue}>
            {formatCentsUsd(input.totalCents)}
          </Text>
        </View>

        {input.notes ? <Text style={styles.notes}>{input.notes}</Text> : null}

        <Text style={styles.attachmentNote}>
          Attachment A (following pages) itemizes all{" "}
          {input.transactions.length} transaction
          {input.transactions.length === 1 ? "" : "s"} covered by this invoice
          {txTotalCents !== input.totalCents
            ? ` (itemized transactions total ${formatCentsUsd(txTotalCents)})`
            : ""}
          .
        </Text>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {SITE.legalName} · {CONTACT.address.full}
          </Text>
          <Text style={styles.footerText}>
            {CONTACT.phone} · {CONTACT.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/* --------------------------------------------------------------- */
/* Attachment sheets (pdf-lib — direct drawing, no layout engine)   */
/* --------------------------------------------------------------- */

// Landscape LETTER.
const PAGE_W = 792;
const PAGE_H = 612;
const MARGIN_X = 36;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const TOP_Y = PAGE_H - 36;
// Rows must end above the footer block.
const BOTTOM_Y = 66;

const FONT_SIZE = 8;
const LINE_H = 9.5;
const CELL_PAD_Y = 5;
const CELL_GAP = 8;
const THEAD_H = 18;

interface Col {
  header: string;
  width: number;
  align: "left" | "right";
  wrap: boolean;
  value: (t: InvoiceCsvRow) => string;
}

function dash(v: string | null): string {
  return v?.trim() ? v : "—";
}

// Fixed columns total 428pt of the 704pt content width (minus inter-column
// gaps); the remainder is split between Practice and Drug below.
const COLS: Col[] = [
  { header: "Written", width: 46, align: "left", wrap: false, value: (t) => dash(t.dateWritten) },
  { header: "Shipped", width: 62, align: "left", wrap: false, value: (t) => dash(t.dateShipped) },
  { header: "ST", width: 22, align: "left", wrap: false, value: (t) => dash(t.shipToState) },
  { header: "Patient", width: 88, align: "left", wrap: true, value: (t) => dash(t.patientName) },
  { header: "Practice", width: 0, align: "left", wrap: true, value: (t) => dash(t.practiceName) },
  { header: "Drug", width: 0, align: "left", wrap: true, value: (t) => dash(t.drugName) },
  { header: "Qty", width: 22, align: "right", wrap: false, value: (t) => (t.rxQty != null ? String(t.rxQty) : "—") },
  { header: "Status", width: 48, align: "left", wrap: false, value: (t) => dash(t.rxStatus) },
  { header: "Price", width: 48, align: "right", wrap: false, value: (t) => (t.rxPriceCents != null ? formatCentsUsd(t.rxPriceCents) : "—") },
  { header: "Order ID", width: 54, align: "right", wrap: false, value: (t) => dash(t.orderId) },
];

// Cells are inset 4pt from each edge of the table band so text never paints
// past the navy header bar or the zebra stripes.
const CELL_INSET_X = 4;

{
  const gaps = CELL_GAP * (COLS.length - 1);
  const fixed = COLS.reduce((s, c) => s + c.width, 0);
  const flex = CONTENT_W - CELL_INSET_X * 2 - gaps - fixed;
  COLS[4].width = Math.floor(flex * 0.42); // Practice
  COLS[5].width = flex - COLS[4].width; // Drug (wider)
}

/**
 * pdf-lib's standard fonts use WinAnsi encoding; anything outside it (rare in
 * these exports) would throw at draw time, so squash unknowns to "?".
 */
function winAnsiSafe(s: string): string {
  return s.replace(/[^\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u00B7]/g, "?");
}

/** Word-wraps text to a width; hard-breaks single words that don't fit. */
function wrapText(
  font: PDFFont,
  text: string,
  size: number,
  maxWidth: number,
): string[] {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return [text];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  const pushWord = (word: string) => {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      return;
    }
    if (current) lines.push(current);
    // Hard-break words wider than the column (long drug strings).
    while (font.widthOfTextAtSize(word, size) > maxWidth) {
      let cut = word.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(word.slice(0, cut), size) > maxWidth) {
        cut--;
      }
      lines.push(word.slice(0, cut));
      word = word.slice(cut);
    }
    current = word;
  };
  for (const w of words) pushWord(w);
  if (current) lines.push(current);
  return lines;
}

/** Truncates single-line cells with an ellipsis when they overflow. */
function truncateText(
  font: PDFFont,
  text: string,
  size: number,
  maxWidth: number,
): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let cut = text.length;
  while (cut > 1 && font.widthOfTextAtSize(`${text.slice(0, cut)}…`, size) > maxWidth) {
    cut--;
  }
  return `${text.slice(0, cut)}…`;
}

interface RowLayout {
  /** Per-column wrapped lines. */
  cells: string[][];
  height: number;
}

function layoutRow(font: PDFFont, t: InvoiceCsvRow): RowLayout {
  const cells = COLS.map((col) => {
    const raw = winAnsiSafe(col.value(t));
    return col.wrap
      ? wrapText(font, raw, FONT_SIZE, col.width)
      : [truncateText(font, raw, FONT_SIZE, col.width)];
  });
  const lines = Math.max(...cells.map((c) => c.length));
  return { cells, height: lines * LINE_H + CELL_PAD_Y * 2 };
}

function drawSheetChrome(
  page: PDFPage,
  helv: PDFFont,
  helvBold: PDFFont,
  input: InvoicePdfInput,
  sheetNo: number,
  sheetCount: number,
): number {
  // Header block
  page.drawText(
    winAnsiSafe(
      `INVOICE ${input.invoiceNumber.toUpperCase()} · ${input.clientName.toUpperCase()}`,
    ),
    { x: MARGIN_X, y: TOP_Y - 7, size: 7, font: helv, color: INK_SOFT_RGB },
  );
  page.drawText("Attachment A — Transaction Detail", {
    x: MARGIN_X,
    y: TOP_Y - 21,
    size: 13,
    font: helvBold,
    color: NAVY_RGB,
  });
  const sheetLabel = `Sheet ${sheetNo} of ${sheetCount} · ${input.transactions.length} transactions`;
  page.drawText(sheetLabel, {
    x: PAGE_W - MARGIN_X - helv.widthOfTextAtSize(sheetLabel, 7.5),
    y: TOP_Y - 21,
    size: 7.5,
    font: helv,
    color: INK_SOFT_RGB,
  });

  // Table header bar
  const theadTop = TOP_Y - 32;
  page.drawRectangle({
    x: MARGIN_X,
    y: theadTop - THEAD_H,
    width: CONTENT_W,
    height: THEAD_H,
    color: NAVY_RGB,
  });
  let x = MARGIN_X + CELL_INSET_X;
  for (const col of COLS) {
    const label = col.header.toUpperCase();
    const tx =
      col.align === "right"
        ? x + col.width - helvBold.widthOfTextAtSize(label, 7)
        : x;
    page.drawText(label, {
      x: tx,
      y: theadTop - THEAD_H + 6,
      size: 7,
      font: helvBold,
      color: WHITE_RGB,
    });
    x += col.width + CELL_GAP;
  }

  // Footer
  page.drawLine({
    start: { x: MARGIN_X, y: 44 },
    end: { x: PAGE_W - MARGIN_X, y: 44 },
    thickness: 1,
    color: BEIGE_RGB,
  });
  page.drawText(winAnsiSafe(`${SITE.legalName} · ${CONTACT.address.full}`), {
    x: MARGIN_X,
    y: 34,
    size: 7.5,
    font: helv,
    color: INK_SOFT_RGB,
  });
  const contact = winAnsiSafe(`${CONTACT.phone} · ${CONTACT.email}`);
  page.drawText(contact, {
    x: PAGE_W - MARGIN_X - helv.widthOfTextAtSize(contact, 7.5),
    y: 34,
    size: 7.5,
    font: helv,
    color: INK_SOFT_RGB,
  });

  // First row's top y
  return theadTop - THEAD_H;
}

async function appendTransactionSheets(
  doc: PDFDocument,
  input: InvoicePdfInput,
  txTotalCents: number,
): Promise<void> {
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Pass 1 — measure every row and slice them into sheets, so sheet counts
  // are known before drawing.
  const layouts = input.transactions.map((t) => layoutRow(helv, t));
  const TOTAL_ROW_H = 26;
  const sheets: RowLayout[][] = [];
  {
    let current: RowLayout[] = [];
    let used = 0;
    const capacity = TOP_Y - 32 - THEAD_H - BOTTOM_Y;
    for (const row of layouts) {
      if (used + row.height > capacity && current.length > 0) {
        sheets.push(current);
        current = [];
        used = 0;
      }
      current.push(row);
      used += row.height;
    }
    // Keep space for the itemized-total row on the final sheet.
    if (used + TOTAL_ROW_H > capacity && current.length > 0) {
      sheets.push(current);
      current = [];
    }
    sheets.push(current);
  }

  // Pass 2 — draw. Transactions index advances across sheets for zebra rows.
  let rowIdx = 0;
  sheets.forEach((rows, sheetIdx) => {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    let y = drawSheetChrome(
      page,
      helv,
      helvBold,
      input,
      sheetIdx + 1,
      sheets.length,
    );

    for (const row of rows) {
      if (rowIdx % 2 === 1) {
        page.drawRectangle({
          x: MARGIN_X,
          y: y - row.height,
          width: CONTENT_W,
          height: row.height,
          color: CREAM_RGB,
        });
      }
      let x = MARGIN_X + CELL_INSET_X;
      COLS.forEach((col, c) => {
        row.cells[c].forEach((line, li) => {
          const tx =
            col.align === "right"
              ? x + col.width - helv.widthOfTextAtSize(line, FONT_SIZE)
              : x;
          page.drawText(line, {
            x: tx,
            y: y - CELL_PAD_Y - LINE_H * (li + 1) + 2.5,
            size: FONT_SIZE,
            font: helv,
            color: NAVY_RGB,
          });
        });
        x += col.width + CELL_GAP;
      });
      y -= row.height;
      page.drawLine({
        start: { x: MARGIN_X, y },
        end: { x: PAGE_W - MARGIN_X, y },
        thickness: 0.75,
        color: BEIGE_RGB,
      });
      rowIdx++;
    }

    if (sheetIdx === sheets.length - 1) {
      const label = `ITEMIZED TOTAL (${input.transactions.length} TRANSACTIONS)`;
      const value = formatCentsUsd(txTotalCents);
      const valueW = helvBold.widthOfTextAtSize(value, 11);
      page.drawText(label, {
        x: PAGE_W - MARGIN_X - valueW - 10 - helvBold.widthOfTextAtSize(label, 8),
        y: y - 18,
        size: 8,
        font: helvBold,
        color: INK_SOFT_RGB,
      });
      page.drawText(value, {
        x: PAGE_W - MARGIN_X - valueW,
        y: y - 19.5,
        size: 11,
        font: helvBold,
        color: NAVY_RGB,
      });
    }
  });
}

/** Renders the branded invoice PDF and returns it as a Buffer. */
export async function renderInvoicePdf(
  input: InvoicePdfInput,
): Promise<Buffer> {
  const txTotalCents = input.transactions.reduce(
    (sum, t) => sum + (t.rxPriceCents ?? 0),
    0,
  );

  const logo = await loadLogo();
  const cover = await renderToBuffer(
    <InvoiceCover input={input} logo={logo} txTotalCents={txTotalCents} />,
  );

  const doc = await PDFDocument.load(new Uint8Array(cover));
  doc.setTitle(
    `${SITE.name} Invoice ${input.invoiceNumber} — ${input.clientName}`,
  );
  await appendTransactionSheets(doc, input, txTotalCents);
  return Buffer.from(await doc.save());
}
