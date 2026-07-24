import type { ClinicProvider } from "@/lib/db/schema";

/**
 * Shared types, option lists, step ordering, and per-step validation for the
 * provider intake wizard. Imported by both the `/onboarding` wizard and the
 * `/dashboard` editor so the two stay in lockstep.
 */

export interface PaymentInfo {
  cardholderName: string;
  cardNumber: string;
  cardType: string;
  expiration: string;
  cvv: string;
  billingAddress: string;
  billingZip: string;
}

export interface OnboardingFormState {
  // Lead-in
  productsOfInterest: string[];
  orderVolume: string;
  referralSource: string;
  // Practice identity
  clinicName: string;
  practiceLegalName: string;
  practiceDba: string;
  ein: string;
  practiceType: string;
  // Practice location
  addressLine1: string;
  addressSuite: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  practicePhone: string;
  website: string;
  // Primary contact
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  privacyAccepted: boolean;
  // Providers
  providers: ClinicProvider[];
  // Payment (plaintext in-memory only; encrypted before persistence)
  payment: PaymentInfo;
  paymentAuthAccepted: boolean;
  paymentSignature: string;
  // Order processing + disclosures
  shippingMethod: string;
  signatureRequired: boolean | null;
  shippingDisclosureAccepted: boolean;
  shippingSignature: string;
  providerAgreementAccepted: boolean;
  providerAgreementSignature: string;
}

export function emptyProvider(): ClinicProvider {
  return {
    firstName: "",
    lastName: "",
    specialty: "",
    npi: "",
    medicalLicense: "",
    licenseState: "",
    dea: "",
    additionalLicenses: [],
  };
}

export function initialFormState(): OnboardingFormState {
  return {
    productsOfInterest: [],
    orderVolume: "",
    referralSource: "",
    clinicName: "",
    practiceLegalName: "",
    practiceDba: "",
    ein: "",
    practiceType: "",
    addressLine1: "",
    addressSuite: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    practicePhone: "",
    website: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    privacyAccepted: false,
    providers: [emptyProvider()],
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
    shippingMethod: "",
    signatureRequired: null,
    shippingDisclosureAccepted: false,
    shippingSignature: "",
    providerAgreementAccepted: false,
    providerAgreementSignature: "",
  };
}

export interface Option {
  value: string;
  label: string;
  description?: string;
}

export const PRODUCT_OPTIONS: Option[] = [
  { value: "weight_loss", label: "Weight Loss" },
  { value: "peptides", label: "Peptides" },
  { value: "hormone_replacement", label: "Hormone Replacement" },
  { value: "other", label: "Other" },
];

export const ORDER_VOLUME_OPTIONS: Option[] = [
  { value: "0_5000", label: "$0 - $5,000 / month" },
  { value: "5000_15000", label: "$5,000 - $15,000 / month" },
  { value: "15000_50000", label: "$15,000 - $50,000 / month" },
  { value: "50000_plus", label: "$50,000+ / month" },
];

export const REFERRAL_OPTIONS: Option[] = [
  { value: "representative", label: "Logos RX Representative" },
  { value: "doctor_clinic", label: "Doctor / Clinic" },
  { value: "google", label: "Google" },
  { value: "social", label: "Facebook / Instagram" },
  { value: "tv_radio", label: "TV / Radio Ad" },
  { value: "friends_family", label: "Friends and Family" },
  { value: "other", label: "Other" },
];

export const PRACTICE_TYPE_OPTIONS: Option[] = [
  { value: "medical_practice", label: "Medical Practice" },
  { value: "med_spa", label: "Med Spa" },
  { value: "wellness_clinic", label: "Wellness Clinic" },
  { value: "hospital", label: "Hospital / Health System" },
  { value: "telehealth", label: "Telehealth" },
  { value: "veterinary", label: "Veterinary" },
  { value: "other", label: "Other" },
];

export const SPECIALTY_OPTIONS: Option[] = [
  { value: "primary_care", label: "Primary Care" },
  { value: "dermatology", label: "Dermatology" },
  { value: "endocrinology", label: "Endocrinology" },
  { value: "urology", label: "Urology" },
  { value: "obgyn", label: "OB/GYN" },
  { value: "pain_management", label: "Pain Management" },
  { value: "anti_aging", label: "Anti-Aging / Wellness" },
  { value: "functional_medicine", label: "Functional Medicine" },
  { value: "veterinary", label: "Veterinary" },
  { value: "other", label: "Other" },
];

export const SHIPPING_METHOD_OPTIONS: Option[] = [
  {
    value: "direct_to_patient",
    label: "Direct to Patient",
    description: "Address to be provided per RX",
  },
  {
    value: "ship_to_practice",
    label: "Ship to Practice",
    description: "Patient specific for in-office use",
  },
];

/** Ordered wizard step identifiers. Progress and navigation derive from this. */
export const STEP_IDS = [
  "welcome",
  "products",
  "volume",
  "referral",
  "clinicName",
  "practice",
  "certifications",
  "contact",
  "providers",
  "payment",
  "saving",
  "platform",
  "orderProcessing",
  "shippingDisclosure",
  "providerAgreement",
] as const;

export type StepId = (typeof STEP_IDS)[number];

/** Steps that are purely informational/transitional (no user input required). */
export const INFO_STEPS: ReadonlySet<StepId> = new Set<StepId>([
  "welcome",
  "certifications",
  "saving",
  "platform",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidateStepOptions {
  /**
   * Require the contact name to have first + last parts. Only the signup path
   * needs this (Clerk requires a last name when the account is created from
   * the contact name). Must stay off for existing accounts: profiles saved
   * before this rule may hold a single-word contact name, and edits unrelated
   * to the contact must not be blocked by it.
   */
  requireFullContactName?: boolean;
}

/**
 * Validates the data required to advance past `stepId`. Returns an error
 * message string, or null when the step is satisfied.
 */
export function validateStep(
  stepId: StepId,
  s: OnboardingFormState,
  opts: ValidateStepOptions = {},
): string | null {
  switch (stepId) {
    case "products":
      return s.productsOfInterest.length > 0
        ? null
        : "Select at least one product you're interested in.";
    case "volume":
      return s.orderVolume ? null : "Select your current order volume.";
    case "referral":
      return s.referralSource ? null : "Let us know how you heard about us.";
    case "clinicName":
      return s.clinicName.trim()
        ? null
        : "Enter your clinic or provider name.";
    case "practice":
      if (!s.practiceLegalName.trim()) return "Practice legal name is required.";
      if (!s.practiceType) return "Select a practice type.";
      if (!s.addressLine1.trim()) return "Practice address is required.";
      if (!s.addressCity.trim()) return "City is required.";
      if (!s.addressState.trim()) return "State is required.";
      if (!s.addressZip.trim()) return "ZIP code is required.";
      if (!s.practicePhone.trim()) return "Practice phone is required.";
      return null;
    case "contact":
      if (!s.contactName.trim()) return "Contact name is required.";
      // Clerk requires a last name on every account, and the contact name is
      // split into first/last at account creation — so demand both parts here
      // instead of failing with a cryptic error at final submission.
      if (
        opts.requireFullContactName &&
        s.contactName.trim().split(/\s+/).length < 2
      )
        return "Enter the contact's full name (first and last).";
      if (!s.contactPhone.trim()) return "Contact phone is required.";
      if (!EMAIL_RE.test(s.contactEmail.trim()))
        return "Enter a valid contact email.";
      if (!s.privacyAccepted)
        return "Please accept the Privacy Policy to continue.";
      return null;
    case "providers": {
      if (s.providers.length === 0) return "Add at least one provider.";
      for (const [i, p] of s.providers.entries()) {
        const n = i + 1;
        if (!p.firstName.trim()) return `Provider ${n}: first name is required.`;
        if (!p.lastName.trim()) return `Provider ${n}: last name is required.`;
        if (!p.specialty) return `Provider ${n}: select a medical specialty.`;
        if (!p.npi.trim()) return `Provider ${n}: NPI is required.`;
        if (!p.medicalLicense.trim())
          return `Provider ${n}: medical license is required.`;
        if (!p.licenseState) return `Provider ${n}: license state is required.`;
      }
      return null;
    }
    case "payment":
      if (!s.payment.cardholderName.trim())
        return "Cardholder name is required.";
      if (s.payment.cardNumber.replace(/\s/g, "").length < 13)
        return "Enter a valid card number.";
      if (!s.payment.expiration.trim()) return "Card expiration is required.";
      if (!s.payment.cvv.trim()) return "CVV is required.";
      if (!s.payment.billingZip.trim()) return "Billing zip is required.";
      if (!s.paymentAuthAccepted)
        return "Please authorize the payment terms to continue.";
      if (!s.paymentSignature) return "A signature is required.";
      return null;
    case "orderProcessing":
      return s.shippingMethod ? null : "Choose a shipping method.";
    case "shippingDisclosure":
      if (!s.shippingDisclosureAccepted)
        return "Please acknowledge the shipping disclosure.";
      if (s.signatureRequired === null)
        return "Select a signature preference.";
      return null;
    case "providerAgreement":
      if (!s.providerAgreementAccepted)
        return "Please accept the Provider Agreement.";
      if (!s.providerAgreementSignature) return "A signature is required.";
      return null;
    default:
      return null;
  }
}
