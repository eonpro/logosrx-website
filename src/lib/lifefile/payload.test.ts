import { describe, expect, it } from "vitest";

import { buildLifeFileOrderPayload, type BuildOrderInput } from "./payload";

function baseInput(): BuildOrderInput {
  return {
    messageId: 42,
    referenceId: "LGS-TEST-0001",
    memo: "Weight-management protocol",
    practiceId: null,
    payorType: "doc",
    prescriber: {
      npi: "1003802901",
      firstName: "Jane",
      lastName: "Doe",
      licenseState: "fl",
      licenseNumber: "ME000000",
      phone: "212-867-5309",
      email: "jane@example.com",
    },
    patient: {
      firstName: "Pat",
      lastName: "Example",
      gender: "m",
      dateOfBirth: "1988-06-15",
      address1: "100 Test Boulevard",
      city: "Orlando",
      state: "fl",
      zip: "32801",
      phoneMobile: "+12128675309",
      email: "pat@example.com",
    },
    shipping: {
      recipientType: "patient",
      recipientFirstName: "Pat",
      recipientLastName: "Example",
      recipientPhone: "2128675309",
      addressLine1: "100 Test Boulevard",
      city: "Orlando",
      state: "FL",
      zipCode: "32801",
      serviceId: 8097,
    },
    rxs: [
      {
        lfProductId: 100000001,
        drugName: "Semaglutide / Cyanocobalamin",
        drugStrength: "2.5mg/0.5mg per mL",
        drugForm: "Injectable",
        directions: "Inject 10 units subcutaneously once weekly.",
        quantity: "1",
        quantityUnits: "ml",
        daysSupply: 28,
        refills: 0,
        dateWritten: "2026-01-15",
        clinicalDifferenceStatement: "Patient-specific compounded formulation.",
      },
    ],
    now: new Date("2026-07-22T12:00:00.000Z"),
  };
}

describe("buildLifeFileOrderPayload", () => {
  it("builds the full envelope with normalized fields", () => {
    const payload = buildLifeFileOrderPayload(baseInput());

    expect(payload.message).toEqual({
      id: 42,
      sentTime: "2026-07-22T12:00:00.000Z",
    });
    expect(payload.order.general).toEqual({
      memo: "Weight-management protocol",
      referenceId: "LGS-TEST-0001",
    });
    expect(payload.order.prescriber).toMatchObject({
      npi: "1003802901",
      firstName: "Jane",
      lastName: "Doe",
      licenseState: "FL",
      phone: "(212) 867-5309",
    });
    expect(payload.order.patient).toMatchObject({
      firstName: "Pat",
      lastName: "Example",
      gender: "m",
      dateOfBirth: "1988-06-15",
      state: "FL",
      phoneMobile: "(212) 867-5309",
    });
    expect(payload.order.shipping).toMatchObject({
      recipientType: "patient",
      recipientPhone: "(212) 867-5309",
      service: 8097,
    });
    expect(payload.order.billing).toEqual({ payorType: "doc" });
    expect(payload.order.rxs).toHaveLength(1);
    expect(payload.order.rxs[0]).toMatchObject({
      rxType: "new",
      lfProductID: 100000001,
      drugName: "Semaglutide / Cyanocobalamin",
      quantity: "1",
      quantityUnits: "ml",
      daysSupply: 28,
      refills: 0,
      dateWritten: "2026-01-15",
    });
  });

  it("omits the practice block when no practice id is assigned", () => {
    const payload = buildLifeFileOrderPayload(baseInput());
    expect(payload.order.practice).toBeUndefined();
  });

  it("stamps the practice block when the clinic has a practice id", () => {
    const payload = buildLifeFileOrderPayload({
      ...baseInput(),
      practiceId: 12345,
    });
    expect(payload.order.practice).toEqual({ id: 12345 });
  });

  it("omits empty optional fields entirely (no undefined/null keys)", () => {
    const input = baseInput();
    input.memo = null;
    input.patient.address2 = "";
    input.patient.phoneHome = null;
    const payload = buildLifeFileOrderPayload(input);

    expect("memo" in payload.order.general!).toBe(false);
    expect("address2" in payload.order.patient).toBe(false);
    expect("phoneHome" in payload.order.patient).toBe(false);
    // JSON round-trip guarantee: no undefined survives serialization.
    expect(JSON.stringify(payload)).not.toContain("undefined");
  });

  it("caps over-length fields to LifeFile limits", () => {
    const input = baseInput();
    input.memo = "m".repeat(200);
    input.patient.lastName = "L".repeat(60);
    const payload = buildLifeFileOrderPayload(input);

    expect(payload.order.general?.memo).toHaveLength(120);
    expect(payload.order.patient.lastName).toHaveLength(30);
  });

  it("supports multiple rxs including repeated products (titration)", () => {
    const input = baseInput();
    input.rxs = [
      { ...input.rxs[0], directions: "Inject 10 units weekly." },
      { ...input.rxs[0], directions: "Inject 20 units weekly." },
      { ...input.rxs[0], lfProductId: 100000002 },
    ];
    const payload = buildLifeFileOrderPayload(input);

    expect(payload.order.rxs).toHaveLength(3);
    expect(payload.order.rxs[0].lfProductID).toBe(100000001);
    expect(payload.order.rxs[2].lfProductID).toBe(100000002);
  });
});
