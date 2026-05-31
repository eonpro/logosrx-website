import { describe, it, expect } from "vitest";
import {
  STEP_IDS,
  emptyProvider,
  initialFormState,
  validateStep,
  type OnboardingFormState,
} from "./steps";

/** A fully valid intake state, used as a baseline for per-step assertions. */
function validState(): OnboardingFormState {
  return {
    ...initialFormState(),
    productsOfInterest: ["weight_loss"],
    orderVolume: "5000_15000",
    referralSource: "google",
    clinicName: "Test Clinic",
    practiceLegalName: "Test Clinic LLC",
    practiceType: "med_spa",
    addressLine1: "123 Main St",
    practicePhone: "8135551234",
    contactName: "Jane Doe",
    contactPhone: "8135551234",
    contactEmail: "jane@example.com",
    privacyAccepted: true,
    providers: [
      {
        ...emptyProvider(),
        firstName: "John",
        lastName: "Smith",
        specialty: "primary_care",
        npi: "1234567890",
        medicalLicense: "ML-1",
        licenseState: "FL",
      },
    ],
    payment: {
      cardholderName: "Jane Doe",
      cardNumber: "4111111111111111",
      cardType: "visa",
      expiration: "12/29",
      cvv: "123",
      billingAddress: "123 Main St",
      billingZip: "33615",
    },
    paymentAuthAccepted: true,
    paymentSignature: "data:image/png;base64,xxx",
    shippingMethod: "direct_to_patient",
    signatureRequired: false,
    shippingDisclosureAccepted: true,
    providerAgreementAccepted: true,
    providerAgreementSignature: "data:image/png;base64,xxx",
  };
}

describe("validateStep", () => {
  it("passes every step for a complete state", () => {
    const s = validState();
    for (const id of STEP_IDS) {
      expect(validateStep(id, s)).toBeNull();
    }
  });

  it("requires at least one product of interest", () => {
    const s = { ...validState(), productsOfInterest: [] };
    expect(validateStep("products", s)).toMatch(/at least one product/i);
  });

  it("requires a valid contact email and privacy consent", () => {
    expect(
      validateStep("contact", { ...validState(), contactEmail: "nope" }),
    ).toMatch(/valid contact email/i);
    expect(
      validateStep("contact", { ...validState(), privacyAccepted: false }),
    ).toMatch(/privacy policy/i);
  });

  it("requires complete provider credentials", () => {
    const s = validState();
    s.providers = [{ ...emptyProvider(), firstName: "Only" }];
    expect(validateStep("providers", s)).toMatch(/last name is required/i);
  });

  it("requires payment fields, authorization, and signature", () => {
    expect(
      validateStep("payment", {
        ...validState(),
        payment: { ...validState().payment, cardNumber: "123" },
      }),
    ).toMatch(/valid card number/i);
    expect(
      validateStep("payment", { ...validState(), paymentSignature: "" }),
    ).toMatch(/signature is required/i);
  });

  it("requires a signature preference on the shipping disclosure", () => {
    expect(
      validateStep("shippingDisclosure", {
        ...validState(),
        signatureRequired: null,
      }),
    ).toMatch(/signature preference/i);
  });
});
