import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import sharp from "sharp";
import { CONTACT, SITE } from "@/lib/constants";
import type { InvoiceCsvRow } from "@/lib/invoices/csv";

/**
 * Logos RX–branded invoice PDF built from the admin invoice builder: a cover
 * page (client, date of service, total) followed by "Attachment A" — a
 * landscape table listing every transaction from the uploaded CSV.
 * Rendered server-side with `@react-pdf/renderer` (same pipeline as quotes).
 */

// Brand palette (mirrors --color-* tokens in globals.css).
const NAVY = "#262262";
const MAGENTA = "#C62E88";
const CREAM = "#F5F4F1";
const BEIGE = "#E8E6E1";
const INK_SOFT = "#6B6890"; // navy at ~60%

const PUBLIC_DIR = path.join(process.cwd(), "public");

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

  // Attachment (landscape transaction table)
  attachPage: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: NAVY,
    backgroundColor: "#FFFFFF",
  },
  attachHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  attachTitle: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  thead: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  th: {
    color: "#FFFFFF",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BEIGE,
  },
  trAlt: { backgroundColor: CREAM },
  colDate: { width: 52 },
  colShipped: { width: 66 },
  colState: { width: 30 },
  colPatient: { width: 92 },
  colPractice: { flex: 1, paddingRight: 6 },
  colDrug: { flex: 1.4, paddingRight: 6 },
  colQty: { width: 26, textAlign: "right" },
  colStatus: { width: 52, paddingLeft: 10 },
  colPrice: { width: 52, textAlign: "right" },
  colOrder: { width: 58, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  totalRowLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: INK_SOFT,
  },
  totalRowValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  pageNo: { fontSize: 7.5, color: INK_SOFT },
});

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

function dash(v: string | null): string {
  return v?.trim() ? v : "—";
}

function InvoicePdf({
  input,
  logo,
}: {
  input: InvoicePdfInput;
  logo: Buffer | null;
}) {
  const issued = input.issuedAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const txTotalCents = input.transactions.reduce(
    (sum, t) => sum + (t.rxPriceCents ?? 0),
    0,
  );

  return (
    <Document
      title={`${SITE.name} Invoice ${input.invoiceNumber} — ${input.clientName}`}
      author={SITE.name}
    >
      {/* Cover page */}
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

      {/* Attachment A — itemized transactions */}
      <Page size="LETTER" orientation="landscape" style={styles.attachPage}>
        <View style={styles.attachHeader} fixed>
          <View>
            <Text style={styles.kicker}>
              Invoice {input.invoiceNumber} · {input.clientName}
            </Text>
            <Text style={styles.attachTitle}>
              Attachment A — Transaction Detail
            </Text>
          </View>
          <Text
            style={styles.pageNo}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>

        <View style={styles.thead} fixed>
          <Text style={[styles.th, styles.colDate]}>Written</Text>
          <Text style={[styles.th, styles.colShipped]}>Shipped</Text>
          <Text style={[styles.th, styles.colState]}>ST</Text>
          <Text style={[styles.th, styles.colPatient]}>Patient</Text>
          <Text style={[styles.th, styles.colPractice]}>Practice</Text>
          <Text style={[styles.th, styles.colDrug]}>Drug</Text>
          <Text style={[styles.th, styles.colQty]}>Qty</Text>
          <Text style={[styles.th, styles.colStatus]}>Status</Text>
          <Text style={[styles.th, styles.colPrice]}>Price</Text>
          <Text style={[styles.th, styles.colOrder]}>Order ID</Text>
        </View>

        {input.transactions.map((t, i) => (
          <View
            key={`${t.line}-${i}`}
            style={i % 2 === 1 ? [styles.tr, styles.trAlt] : styles.tr}
            wrap={false}
          >
            <Text style={styles.colDate}>{dash(t.dateWritten)}</Text>
            <Text style={styles.colShipped}>{dash(t.dateShipped)}</Text>
            <Text style={styles.colState}>{dash(t.shipToState)}</Text>
            <Text style={styles.colPatient}>{dash(t.patientName)}</Text>
            <Text style={styles.colPractice}>{dash(t.practiceName)}</Text>
            <Text style={styles.colDrug}>{dash(t.drugName)}</Text>
            <Text style={styles.colQty}>{t.rxQty ?? "—"}</Text>
            <Text style={styles.colStatus}>{dash(t.rxStatus)}</Text>
            <Text style={styles.colPrice}>
              {t.rxPriceCents != null ? formatCentsUsd(t.rxPriceCents) : "—"}
            </Text>
            <Text style={styles.colOrder}>{dash(t.orderId)}</Text>
          </View>
        ))}

        <View style={styles.totalRow} wrap={false}>
          <Text style={styles.totalRowLabel}>
            Itemized total ({input.transactions.length} transactions)
          </Text>
          <Text style={styles.totalRowValue}>
            {formatCentsUsd(txTotalCents)}
          </Text>
        </View>

        <View style={[styles.footer, { left: 36, right: 36 }]} fixed>
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

/** Renders the branded invoice PDF and returns it as a Buffer. */
export async function renderInvoicePdf(
  input: InvoicePdfInput,
): Promise<Buffer> {
  const logo = await loadLogo();
  return renderToBuffer(<InvoicePdf input={input} logo={logo} />);
}
