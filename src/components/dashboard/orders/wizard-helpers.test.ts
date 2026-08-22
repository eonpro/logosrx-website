import { describe, expect, it } from "vitest";

import {
  estimateTotalCents,
  parseDraft,
  patientFieldErrors,
  rxFieldErrors,
  serializeDraft,
  shippingFieldErrors,
  sigPresetsFor,
  type PatientDraft,
  type ShippingDraft,
} from "./wizard-helpers";

function validPatient(): PatientDraft {
  return {
    firstName: "Pat",
    lastName: "Example",
    gender: "f",
    dateOfBirth: "1990-01-02",
    address1: "1 Main St",
    address2: "",
    city: "Miami",
    state: "FL",
    zip: "33101",
    phoneMobile: "212-867-5309",
    email: "pat@example.com",
    allergies: "",
    conditions: "",
  };
}

function validShipping(): ShippingDraft {
  return {
    recipientType: "patient",
    recipientFirstName: "Pat",
    recipientLastName: "Example",
    recipientPhone: "(212) 867-5309",
    recipientEmail: "",
    addressLine1: "1 Main St",
    addressLine2: "",
    city: "Miami",
    state: "FL",
    zipCode: "33101",
    serviceId: "",
  };
}

describe("patientFieldErrors", () => {
  it("passes a valid patient", () => {
    expect(patientFieldErrors(validPatient())).toEqual({});
  });

  it("requires name, sex, and DOB", () => {
    const errors = patientFieldErrors({
      ...validPatient(),
      firstName: " ",
      lastName: "",
      gender: "",
      dateOfBirth: "",
    });
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(["firstName", "lastName", "gender", "dateOfBirth"]),
    );
  });

  it("rejects impossible and future DOBs", () => {
    expect(
      patientFieldErrors({ ...validPatient(), dateOfBirth: "1990-02-30" }).dateOfBirth,
    ).toBeTruthy();
    expect(
      patientFieldErrors({ ...validPatient(), dateOfBirth: "2999-01-01" }).dateOfBirth,
    ).toMatch(/future/);
  });

  it("validates optional phone/email/state/zip only when present", () => {
    const empty = patientFieldErrors({
      ...validPatient(),
      phoneMobile: "",
      email: "",
      state: "",
      zip: "",
    });
    expect(empty).toEqual({});
    const bad = patientFieldErrors({
      ...validPatient(),
      phoneMobile: "123",
      email: "nope",
      state: "Florida",
      zip: "1",
    });
    expect(Object.keys(bad)).toEqual(
      expect.arrayContaining(["phoneMobile", "email", "state", "zip"]),
    );
  });
});

describe("shippingFieldErrors", () => {
  it("passes valid shipping", () => {
    expect(shippingFieldErrors(validShipping())).toEqual({});
  });

  it("requires the address block", () => {
    const errors = shippingFieldErrors({
      ...validShipping(),
      addressLine1: "",
      city: "",
      state: "",
      zipCode: "",
    });
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(["addressLine1", "city", "state", "zipCode"]),
    );
  });

  it("accepts ZIP+4", () => {
    expect(
      shippingFieldErrors({ ...validShipping(), zipCode: "33101-1234" }),
    ).toEqual({});
  });
});

describe("rxFieldErrors", () => {
  const products = [{ id: "sku-1", name: "Semaglutide" }];

  it("requires directions per medication", () => {
    const errors = rxFieldErrors(
      [{ productId: "sku-1", directions: "", quantity: "1", daysSupply: "", refills: "0" }],
      products,
    );
    expect(errors[0]).toMatch(/Semaglutide/);
  });

  it("rejects non-numeric quantity", () => {
    const errors = rxFieldErrors(
      [
        {
          productId: "sku-1",
          directions: "Take as directed.",
          quantity: "two",
          daysSupply: "",
          refills: "0",
        },
      ],
      products,
    );
    expect(errors[0]).toMatch(/Quantity/);
  });

  it("passes a complete rx", () => {
    const errors = rxFieldErrors(
      [
        {
          productId: "sku-1",
          directions: "Inject 10 units weekly.",
          quantity: "1",
          daysSupply: "28",
          refills: "0",
        },
      ],
      products,
    );
    expect(errors).toEqual({});
  });
});

describe("sigPresetsFor", () => {
  it("maps forms to presets, including Tab/Tablet variants", () => {
    expect(sigPresetsFor("Injectable").length).toBeGreaterThan(0);
    expect(sigPresetsFor("Tablet")).toEqual(sigPresetsFor("Tab"));
    expect(sigPresetsFor("Capsule").length).toBeGreaterThan(0);
    expect(sigPresetsFor("Swab")).toEqual([]);
    expect(sigPresetsFor(null)).toEqual([]);
  });
});

describe("estimateTotalCents", () => {
  const products = [
    { id: "a", priceCents: 12000 },
    { id: "b", priceCents: 5000 },
    { id: "unpriced", priceCents: null },
  ];

  it("sums price x quantity (default qty 1)", () => {
    expect(
      estimateTotalCents(
        [
          { productId: "a", quantity: "2" },
          { productId: "b", quantity: "" },
        ],
        products,
      ),
    ).toBe(29000);
  });

  it("returns null when any line is unpriced or has bad quantity", () => {
    expect(
      estimateTotalCents([{ productId: "unpriced", quantity: "1" }], products),
    ).toBeNull();
    expect(
      estimateTotalCents([{ productId: "a", quantity: "zero" }], products),
    ).toBeNull();
  });
});

describe("draft persistence", () => {
  const base = {
    clinicKey: "clinic-7",
    step: 2,
    patientId: 12,
    prescriberNpi: "1003802901",
    rxs: [
      { productId: "a", directions: "x", quantity: "1", daysSupply: "", refills: "0" },
    ],
    shipping: validShipping(),
    payorType: "doc" as const,
    memo: "",
    submissionKey: "abcdef1234",
  };

  it("round-trips a draft for the same clinic", () => {
    const parsed = parseDraft(serializeDraft(base), "clinic-7");
    expect(parsed).not.toBeNull();
    expect(parsed?.step).toBe(2);
    expect(parsed?.rxs).toHaveLength(1);
  });

  it("refuses another clinic's draft", () => {
    expect(parseDraft(serializeDraft(base), "clinic-8")).toBeNull();
  });

  it("refuses stale drafts", () => {
    const raw = serializeDraft(base);
    const stale = JSON.stringify({
      ...JSON.parse(raw),
      savedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    });
    expect(parseDraft(stale, "clinic-7")).toBeNull();
  });

  it("refuses malformed input", () => {
    expect(parseDraft("{broken", "clinic-7")).toBeNull();
    expect(parseDraft(null, "clinic-7")).toBeNull();
  });
});
