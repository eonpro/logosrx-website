import { describe, expect, it } from "vitest";

import {
  firstZodIssue,
  orderSubmissionSchema,
  patientInputSchema,
  shippingInputSchema,
} from "./validation";

function validShipping() {
  return {
    recipientType: "patient",
    recipientFirstName: "Pat",
    recipientLastName: "Example",
    recipientPhone: "212-867-5309",
    addressLine1: "100 Test Blvd",
    city: "Orlando",
    state: "fl",
    zipCode: "32801",
    serviceId: "8097",
  };
}

function validSubmission() {
  return {
    patientId: "12",
    prescriberNpi: "1003802901",
    shipping: validShipping(),
    payorType: "doc",
    memo: "First order",
    rxs: [
      {
        productId: "semaglutide-vial",
        directions: "Inject 10 units subcutaneously once weekly.",
        quantity: "1",
        daysSupply: "28",
        refills: "0",
      },
    ],
    submissionKey: "wiz_1a2b3c4d5e6f",
  };
}

describe("orderSubmissionSchema", () => {
  it("accepts a valid submission and coerces numeric strings", () => {
    const parsed = orderSubmissionSchema.parse(validSubmission());
    expect(parsed.patientId).toBe(12);
    expect(parsed.shipping.serviceId).toBe(8097);
    expect(parsed.shipping.state).toBe("FL");
    expect(parsed.rxs[0].daysSupply).toBe(28);
    expect(parsed.rxs[0].refills).toBe(0);
  });

  it("rejects a malformed NPI", () => {
    const result = orderSubmissionSchema.safeParse({
      ...validSubmission(),
      prescriberNpi: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("requires at least one rx", () => {
    const result = orderSubmissionSchema.safeParse({
      ...validSubmission(),
      rxs: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid submission key", () => {
    const result = orderSubmissionSchema.safeParse({
      ...validSubmission(),
      submissionKey: "no spaces allowed!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects placeholder-invalid phone numbers in shipping", () => {
    const result = orderSubmissionSchema.safeParse({
      ...validSubmission(),
      shipping: { ...validShipping(), recipientPhone: "12345" },
    });
    expect(result.success).toBe(false);
  });
});

describe("patientInputSchema", () => {
  it("accepts a minimal patient", () => {
    const parsed = patientInputSchema.parse({
      firstName: "Pat",
      lastName: "Example",
      gender: "f",
      dateOfBirth: "1990-01-02",
    });
    expect(parsed.allergies).toEqual([]);
    expect(parsed.conditions).toEqual([]);
  });

  it("rejects impossible dates of birth", () => {
    const result = patientInputSchema.safeParse({
      firstName: "Pat",
      lastName: "Example",
      gender: "f",
      dateOfBirth: "1990-02-30",
    });
    expect(result.success).toBe(false);
  });

  it("normalizes empty optionals to undefined", () => {
    const parsed = patientInputSchema.parse({
      firstName: "Pat",
      lastName: "Example",
      gender: "m",
      dateOfBirth: "1990-01-02",
      email: "",
      state: "",
      phoneMobile: "",
    });
    expect(parsed.email).toBeUndefined();
    expect(parsed.state).toBeUndefined();
    expect(parsed.phoneMobile).toBeUndefined();
  });
});

describe("shippingInputSchema", () => {
  it("uppercases the state", () => {
    const parsed = shippingInputSchema.parse(validShipping());
    expect(parsed.state).toBe("FL");
  });

  it("requires the core address fields", () => {
    const { addressLine1: _omitted, ...rest } = validShipping();
    expect(shippingInputSchema.safeParse(rest).success).toBe(false);
  });
});

describe("firstZodIssue", () => {
  it("prefixes the field path", () => {
    const result = orderSubmissionSchema.safeParse({
      ...validSubmission(),
      prescriberNpi: "bad",
    });
    if (result.success) throw new Error("expected failure");
    expect(firstZodIssue(result.error)).toContain("prescriberNpi");
  });
});
