import { describe, expect, it } from "vitest";
import {
  emptyCardUpdateForm,
  validateCardUpdateForm,
  type CardUpdateForm,
} from "./validate";

function validForm(): CardUpdateForm {
  const f = emptyCardUpdateForm();
  f.payment = {
    cardholderName: "Jane Doe",
    cardNumber: "4242 4242 4242 4242",
    cardType: "visa",
    expiration: "12/28",
    cvv: "123",
    billingAddress: "1 Main St",
    billingZip: "33101",
  };
  f.paymentAuthAccepted = true;
  f.paymentSignature = "data:image/png;base64,abc";
  return f;
}

describe("validateCardUpdateForm", () => {
  it("accepts a complete form", () => {
    expect(validateCardUpdateForm(validForm())).toBeNull();
  });

  it("requires the cardholder name", () => {
    const f = validForm();
    f.payment.cardholderName = "  ";
    expect(validateCardUpdateForm(f)).toMatch(/cardholder/i);
  });

  it("rejects a short card number (spaces ignored)", () => {
    const f = validForm();
    f.payment.cardNumber = "4242 4242";
    expect(validateCardUpdateForm(f)).toMatch(/card number/i);
  });

  it("requires expiration, cvv, and billing zip", () => {
    for (const key of ["expiration", "cvv", "billingZip"] as const) {
      const f = validForm();
      f.payment[key] = "";
      expect(validateCardUpdateForm(f)).not.toBeNull();
    }
  });

  it("requires the payment authorization consent", () => {
    const f = validForm();
    f.paymentAuthAccepted = false;
    expect(validateCardUpdateForm(f)).toMatch(/authorize/i);
  });

  it("requires a signature", () => {
    const f = validForm();
    f.paymentSignature = "";
    expect(validateCardUpdateForm(f)).toMatch(/signature/i);
  });
});
