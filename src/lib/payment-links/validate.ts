import type { PaymentInfo } from "@/lib/onboarding/steps";

/**
 * Client-safe validation for the public card-update form (`/update-card/<token>`).
 * Mirrors the onboarding payment step: a full new card is required (unlike the
 * dashboard editor, "keep the card on file" is not an option here — the whole
 * point of the link is collecting a fresh card).
 */

export const MIN_CARD_DIGITS = 13;

export interface CardUpdateForm {
  payment: PaymentInfo;
  paymentAuthAccepted: boolean;
  paymentSignature: string;
}

export function emptyCardUpdateForm(): CardUpdateForm {
  return {
    payment: {
      cardholderName: "",
      cardNumber: "",
      cardType: "",
      expiration: "",
      cvv: "",
      billingAddress: "",
      billingZip: "",
    },
    paymentAuthAccepted: false,
    paymentSignature: "",
  };
}

/** Returns an error message, or null when the form is submittable. */
export function validateCardUpdateForm(f: CardUpdateForm): string | null {
  if (!f.payment.cardholderName.trim()) return "Cardholder name is required.";
  if (f.payment.cardNumber.replace(/\s/g, "").length < MIN_CARD_DIGITS)
    return "Enter a valid card number.";
  if (!f.payment.expiration.trim()) return "Card expiration is required.";
  if (!f.payment.cvv.trim()) return "CVV is required.";
  if (!f.payment.billingZip.trim()) return "Billing zip is required.";
  if (!f.paymentAuthAccepted)
    return "Please authorize the payment terms to continue.";
  if (!f.paymentSignature) return "A signature is required.";
  return null;
}
