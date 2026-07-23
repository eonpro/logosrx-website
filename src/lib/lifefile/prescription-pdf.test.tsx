import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  renderPrescriptionPdf,
  type PrescriptionPdfInput,
} from "./prescription-pdf";
import { buildLifeFileOrderPayload, redactPayloadForStorage } from "./payload";
import type { BuildOrderInput } from "./payload";

function sampleInput(): PrescriptionPdfInput {
  return {
    practiceName: "Sunrise Wellness Clinic",
    referenceId: "LGS-test0001",
    createdAtIso: "2026-07-23T15:00:00.000Z",
    prescriber: {
      name: "Ada Prescriber",
      npi: "1003802901",
      licenseNumber: "ME123456",
      licenseState: "FL",
      phone: "(305) 555-0100",
    },
    patient: {
      name: "Pat Example",
      dateOfBirth: "1990-01-02",
      gender: "f",
      address: "100 Test Blvd, Orlando, FL, 32801",
      phone: "(212) 867-5309",
      allergies: ["penicillin"],
      conditions: ["type 2 diabetes"],
    },
    shipping: {
      recipient: "Pat Example (patient)",
      address: "100 Test Blvd, Orlando, FL 32801",
      service: "UPS Next Day (Florida)",
    },
    rxs: [
      {
        drugName: "Semaglutide / Glycine",
        drugStrength: "2.5 mg/mL",
        drugForm: "Injectable",
        directions: "Inject 10 units (0.10 mL) subcutaneously once weekly.",
        quantity: "1",
        quantityUnits: "each",
        daysSupply: 28,
        refills: 0,
        dateWritten: "2026-07-23",
        clinicalDifferenceStatement:
          "Compounded formulation for a patient-specific dose.",
      },
      {
        drugName: "Metformin",
        drugStrength: "500 mg",
        drugForm: "Tablet",
        directions: "Take 1 tablet by mouth twice daily with food.",
        quantity: "60",
        quantityUnits: "each",
        daysSupply: 30,
        refills: 2,
        dateWritten: "2026-07-23",
      },
    ],
  };
}

describe("renderPrescriptionPdf", () => {
  it("renders a valid, non-trivial PDF", async () => {
    const pdf = await renderPrescriptionPdf(sampleInput());
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(2_000);
  });

  it("renders with minimal optional data (no crash on empty fields)", async () => {
    const input = sampleInput();
    input.patient.address = null;
    input.patient.phone = null;
    input.patient.allergies = [];
    input.patient.conditions = [];
    input.prescriber.licenseNumber = null;
    input.rxs = [
      {
        drugName: "Test Drug",
        directions: "Take as directed.",
        refills: 0,
        dateWritten: "2026-07-23",
      },
    ];
    const pdf = await renderPrescriptionPdf(input);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("handles many rxs across pages", async () => {
    const input = sampleInput();
    input.rxs = Array.from({ length: 12 }, (_, i) => ({
      drugName: `Medication ${i + 1}`,
      drugStrength: "10 mg",
      drugForm: "Capsule",
      directions: "Take 1 capsule by mouth once daily.",
      quantity: "30",
      refills: 0,
      dateWritten: "2026-07-23",
    }));
    const pdf = await renderPrescriptionPdf(input);
    expect(pdf.length).toBeGreaterThan(4_000);
  });
});

describe("redactPayloadForStorage", () => {
  const buildInput: BuildOrderInput = {
    messageId: 1,
    referenceId: "LGS-x",
    payorType: "doc",
    prescriber: { npi: "1003802901", firstName: "A", lastName: "B" },
    patient: {
      firstName: "P",
      lastName: "E",
      gender: "f",
      dateOfBirth: "1990-01-02",
    },
    shipping: {
      recipientType: "patient",
      recipientFirstName: "P",
      recipientLastName: "E",
      addressLine1: "1 Main St",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
    },
    rxs: [
      {
        lfProductId: 1,
        drugName: "Test",
        directions: "Take as directed.",
        dateWritten: "2026-07-23",
      },
    ],
    now: new Date("2026-07-23T15:00:00.000Z"),
  };

  it("replaces the pdf with a size marker and leaves the rest intact", () => {
    const payload = buildLifeFileOrderPayload(buildInput);
    payload.order.document = { pdfBase64: "A".repeat(50_000) };
    const redacted = redactPayloadForStorage(payload);
    expect(redacted.order.document?.pdfBase64).toBe(
      "<omitted: 50000 base64 chars>",
    );
    // Original untouched (no mutation), structured fields preserved.
    expect(payload.order.document.pdfBase64).toHaveLength(50_000);
    expect(redacted.order.rxs).toEqual(payload.order.rxs);
    expect(redacted.order.patient).toEqual(payload.order.patient);
  });

  it("passes through payloads without a document", () => {
    const payload = buildLifeFileOrderPayload(buildInput);
    expect(redactPayloadForStorage(payload)).toBe(payload);
  });
});
