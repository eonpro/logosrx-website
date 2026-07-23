import "server-only";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { CONTACT } from "@/lib/constants";

/**
 * The prescription document attached to every LifeFile order as
 * `order.document.pdfBase64` — a clean, human-readable script the pharmacy
 * can print/file, with the prescribing practice's name as the header
 * (the clinic's script, transmitted by LogosRx).
 *
 * Text-only on purpose: no images/sharp so rendering stays fast on the
 * serverless order path. Data mirrors exactly what the structured payload
 * carries — this is a representation of the same order, never an alternate
 * source of truth.
 */

const NAVY = "#262262";
const MAGENTA = "#C62E88";
const CREAM = "#F5F4F1";
const BEIGE = "#E8E6E1";
const INK_SOFT = "#6B6890";

export interface PrescriptionPdfInput {
  practiceName: string;
  referenceId: string;
  createdAtIso: string;
  prescriber: {
    name: string;
    npi: string;
    licenseNumber?: string | null;
    licenseState?: string | null;
    phone?: string | null;
  };
  patient: {
    name: string;
    dateOfBirth: string;
    gender: string;
    address?: string | null;
    phone?: string | null;
    allergies: string[];
    conditions: string[];
  };
  shipping: {
    recipient: string;
    address: string;
    service: string;
  };
  rxs: {
    drugName: string;
    drugStrength?: string | null;
    drugForm?: string | null;
    directions: string;
    quantity?: string | null;
    quantityUnits?: string | null;
    daysSupply?: number | null;
    refills: number;
    dateWritten: string;
    clinicalDifferenceStatement?: string | null;
  }[];
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 52,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: NAVY,
    backgroundColor: "#FFFFFF",
  },
  practiceName: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: INK_SOFT,
    marginTop: 3,
  },
  rule: { height: 3, backgroundColor: MAGENTA, borderRadius: 2, marginVertical: 14 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  metaText: { fontSize: 9, color: INK_SOFT },
  columns: { flexDirection: "row", gap: 12, marginBottom: 14 },
  card: {
    flex: 1,
    backgroundColor: CREAM,
    borderRadius: 8,
    padding: 12,
  },
  cardTitle: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: INK_SOFT,
    marginBottom: 5,
  },
  strong: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  line: { marginTop: 2, lineHeight: 1.4 },
  soft: { color: INK_SOFT },
  rxBlock: {
    borderWidth: 1,
    borderColor: BEIGE,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  rxHeader: { flexDirection: "row", justifyContent: "space-between" },
  rxName: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  rxIndex: { fontSize: 9, color: INK_SOFT },
  sigLabel: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: INK_SOFT,
    marginTop: 8,
  },
  sig: { marginTop: 2, fontSize: 11, lineHeight: 1.5 },
  rxMetaRow: { flexDirection: "row", gap: 16, marginTop: 8 },
  rxMetaItem: { fontSize: 9, color: INK_SOFT },
  rxMetaValue: { fontFamily: "Helvetica-Bold", fontSize: 10, color: NAVY },
  clinical: {
    marginTop: 8,
    fontSize: 8.5,
    lineHeight: 1.4,
    color: INK_SOFT,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: BEIGE,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: INK_SOFT },
});

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
}

const GENDER_LABELS: Record<string, string> = {
  m: "Male",
  f: "Female",
  u: "Unspecified",
  a: "Animal",
};

function PrescriptionDocument({ input }: { input: PrescriptionPdfInput }) {
  return (
    <Document
      title={`Prescription ${input.referenceId}`}
      author={input.practiceName}
    >
      <Page size="LETTER" style={styles.page}>
        {/* Practice header — the clinic's script, per pharmacy convention. */}
        <Text style={styles.practiceName}>{input.practiceName}</Text>
        <Text style={styles.kicker}>Prescription order</Text>
        <View style={styles.rule} />

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Reference: {input.referenceId}</Text>
          <Text style={styles.metaText}>{fmtDate(input.createdAtIso)}</Text>
        </View>

        <View style={styles.columns}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Patient</Text>
            <Text style={styles.strong}>{input.patient.name}</Text>
            <Text style={styles.line}>
              DOB {input.patient.dateOfBirth} ·{" "}
              {GENDER_LABELS[input.patient.gender] ?? input.patient.gender}
            </Text>
            {input.patient.address ? (
              <Text style={[styles.line, styles.soft]}>{input.patient.address}</Text>
            ) : null}
            {input.patient.phone ? (
              <Text style={[styles.line, styles.soft]}>{input.patient.phone}</Text>
            ) : null}
            <Text style={styles.line}>
              Allergies:{" "}
              {input.patient.allergies.length
                ? input.patient.allergies.join(", ")
                : "NKDA (none reported)"}
            </Text>
            {input.patient.conditions.length > 0 && (
              <Text style={styles.line}>
                Conditions: {input.patient.conditions.join(", ")}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Prescriber</Text>
            <Text style={styles.strong}>{input.prescriber.name}</Text>
            <Text style={styles.line}>NPI {input.prescriber.npi}</Text>
            {input.prescriber.licenseNumber ? (
              <Text style={styles.line}>
                License {input.prescriber.licenseNumber}
                {input.prescriber.licenseState
                  ? ` (${input.prescriber.licenseState})`
                  : ""}
              </Text>
            ) : null}
            {input.prescriber.phone ? (
              <Text style={[styles.line, styles.soft]}>{input.prescriber.phone}</Text>
            ) : null}
          </View>
        </View>

        {/* Prescriptions */}
        {input.rxs.map((rx, i) => (
          <View key={i} style={styles.rxBlock} wrap={false}>
            <View style={styles.rxHeader}>
              <Text style={styles.rxName}>
                {rx.drugName}
                {rx.drugStrength ? ` — ${rx.drugStrength}` : ""}
              </Text>
              <Text style={styles.rxIndex}>
                Rx {i + 1} of {input.rxs.length}
              </Text>
            </View>
            {rx.drugForm ? (
              <Text style={[styles.line, styles.soft]}>{rx.drugForm}</Text>
            ) : null}

            <Text style={styles.sigLabel}>Directions (sig)</Text>
            <Text style={styles.sig}>{rx.directions}</Text>

            <View style={styles.rxMetaRow}>
              <Text style={styles.rxMetaItem}>
                Quantity{"  "}
                <Text style={styles.rxMetaValue}>
                  {rx.quantity ?? "—"}
                  {rx.quantityUnits ? ` ${rx.quantityUnits}` : ""}
                </Text>
              </Text>
              <Text style={styles.rxMetaItem}>
                Days supply{"  "}
                <Text style={styles.rxMetaValue}>{rx.daysSupply ?? "—"}</Text>
              </Text>
              <Text style={styles.rxMetaItem}>
                Refills{"  "}
                <Text style={styles.rxMetaValue}>{rx.refills}</Text>
              </Text>
              <Text style={styles.rxMetaItem}>
                Written{"  "}
                <Text style={styles.rxMetaValue}>{rx.dateWritten}</Text>
              </Text>
            </View>

            {rx.clinicalDifferenceStatement ? (
              <Text style={styles.clinical}>
                Clinical difference: {rx.clinicalDifferenceStatement}
              </Text>
            ) : null}
          </View>
        ))}

        {/* Ship-to */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ship to</Text>
          <Text style={styles.strong}>{input.shipping.recipient}</Text>
          <Text style={[styles.line, styles.soft]}>{input.shipping.address}</Text>
          <Text style={[styles.line, styles.soft]}>{input.shipping.service}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Transmitted electronically via LogosRx to Logos Pharmacy ·{" "}
            {CONTACT.address.full} · {CONTACT.phone}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

/** Renders the prescription PDF and returns raw bytes. */
export async function renderPrescriptionPdf(
  input: PrescriptionPdfInput,
): Promise<Buffer> {
  return renderToBuffer(<PrescriptionDocument input={input} />);
}
