/**
 * Pure helpers for the New Prescription wizard: per-field validation with
 * friendly messages, sig (directions) presets, order-total estimation, and
 * draft persistence. No React, no DB — unit tested in wizard-helpers.test.ts.
 */

import { isIsoDate, normalizePhone } from "@/lib/lifefile/normalize";
import type { OrderableProduct } from "@/lib/orders/products";

/* ------------------------------ field validation ------------------------- */

export interface PatientDraft {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phoneMobile: string;
  email: string;
  allergies: string;
  conditions: string;
}

export interface ShippingDraft {
  recipientType: "patient" | "clinic";
  recipientFirstName: string;
  recipientLastName: string;
  recipientPhone: string;
  recipientEmail: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  serviceId: string;
}

export interface RxDraft {
  productId: string;
  directions: string;
  quantity: string;
  daysSupply: string;
  refills: string;
}

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATE_RE = /^[A-Za-z]{2}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;

function checkPhone(value: string, label: string, out: FieldErrors, key: string) {
  if (value.trim() && normalizePhone(value) === null) {
    out[key] = `${label} must be a valid US phone number, e.g. (212) 867-5309.`;
  }
}

function checkEmail(value: string, out: FieldErrors, key: string) {
  if (value.trim() && !EMAIL_RE.test(value.trim())) {
    out[key] = "Enter a valid email address.";
  }
}

/** Per-field errors for the add-patient form. Empty object = valid. */
export function patientFieldErrors(d: PatientDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (!d.firstName.trim()) errors.firstName = "First name is required.";
  else if (d.firstName.trim().length > 30) errors.firstName = "Max 30 characters.";
  if (!d.lastName.trim()) errors.lastName = "Last name is required.";
  else if (d.lastName.trim().length > 30) errors.lastName = "Max 30 characters.";
  if (!d.gender) errors.gender = "Select the patient's sex.";
  if (!d.dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
  else if (!isIsoDate(d.dateOfBirth)) {
    errors.dateOfBirth = "Enter a real date (YYYY-MM-DD).";
  } else if (d.dateOfBirth > new Date().toISOString().slice(0, 10)) {
    errors.dateOfBirth = "Date of birth can't be in the future.";
  }
  if (d.state.trim() && !STATE_RE.test(d.state.trim())) {
    errors.state = "Use the two-letter state code (e.g. FL).";
  }
  if (d.zip.trim() && !ZIP_RE.test(d.zip.trim())) {
    errors.zip = "Enter a 5-digit ZIP code.";
  }
  checkPhone(d.phoneMobile, "Mobile phone", errors, "phoneMobile");
  checkEmail(d.email, errors, "email");
  return errors;
}

/** Per-field errors for the shipping step. Empty object = valid. */
export function shippingFieldErrors(d: ShippingDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (!d.recipientFirstName.trim()) {
    errors.recipientFirstName = "Recipient first name is required.";
  }
  if (!d.recipientLastName.trim()) {
    errors.recipientLastName = "Recipient last name is required.";
  }
  if (!d.addressLine1.trim()) errors.addressLine1 = "Street address is required.";
  if (!d.city.trim()) errors.city = "City is required.";
  if (!d.state.trim()) errors.state = "State is required.";
  else if (!STATE_RE.test(d.state.trim())) {
    errors.state = "Use the two-letter state code (e.g. FL).";
  }
  if (!d.zipCode.trim()) errors.zipCode = "ZIP code is required.";
  else if (!ZIP_RE.test(d.zipCode.trim())) {
    errors.zipCode = "Enter a 5-digit ZIP code.";
  }
  checkPhone(d.recipientPhone, "Phone", errors, "recipientPhone");
  checkEmail(d.recipientEmail, errors, "recipientEmail");
  return errors;
}

/** Per-rx errors keyed by rx index. Empty object = valid. */
export function rxFieldErrors(
  rxs: RxDraft[],
  products: Pick<OrderableProduct, "id" | "name">[],
): Record<number, string> {
  const errors: Record<number, string> = {};
  rxs.forEach((rx, i) => {
    const name = products.find((p) => p.id === rx.productId)?.name ?? "this medication";
    if (rx.directions.trim().length < 3) {
      errors[i] = `Add directions (sig) for ${name} — what the patient should do.`;
    } else if (rx.daysSupply && Number(rx.daysSupply) < 1) {
      errors[i] = "Days supply must be at least 1.";
    } else if (
      rx.quantity &&
      (!/^\d+(\.\d+)?$/.test(rx.quantity.trim()) || Number(rx.quantity) <= 0)
    ) {
      errors[i] = "Quantity must be a positive number.";
    }
  });
  return errors;
}

/* --------------------------------- sig presets --------------------------- */

/**
 * Quick-fill directions by dosage form. Starting points, not medical advice —
 * the prescriber edits after inserting. Kept short and conventional.
 */
export const SIG_PRESETS: Record<string, string[]> = {
  Injectable: [
    "Inject ___ units subcutaneously once weekly. Rotate injection sites.",
    "Inject ___ mL intramuscularly once weekly.",
    "Inject ___ units subcutaneously once daily at bedtime.",
  ],
  Tablet: [
    "Take 1 tablet by mouth once daily.",
    "Take 1 tablet by mouth twice daily with food.",
    "Take 1 tablet by mouth at bedtime.",
  ],
  Capsule: [
    "Take 1 capsule by mouth once daily.",
    "Take 1 capsule by mouth twice daily with food.",
    "Take 1 capsule by mouth at bedtime.",
  ],
};

export function sigPresetsFor(form: string | null | undefined): string[] {
  if (!form) return [];
  // "Tab" and "Tablet" both appear in catalog data.
  if (/^tab/i.test(form)) return SIG_PRESETS.Tablet;
  return SIG_PRESETS[form] ?? [];
}

/* ------------------------------- total estimate -------------------------- */

/**
 * Estimated order total in cents, or null when any line can't be priced
 * (missing price or non-numeric quantity). Quantity defaults to 1.
 */
export function estimateTotalCents(
  rxs: Pick<RxDraft, "productId" | "quantity">[],
  products: Pick<OrderableProduct, "id" | "priceCents">[],
): number | null {
  let total = 0;
  for (const rx of rxs) {
    const price = products.find((p) => p.id === rx.productId)?.priceCents;
    if (price == null) return null;
    const qty = rx.quantity.trim() === "" ? 1 : Number(rx.quantity);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    total += Math.round(price * qty);
  }
  return total;
}

/* ------------------------------ draft persistence ------------------------ */

export interface WizardDraft {
  version: 1;
  /** Guards against restoring another clinic's draft on a shared machine. */
  clinicKey: string;
  step: number;
  patientId: number | null;
  prescriberNpi: string;
  rxs: RxDraft[];
  shipping: ShippingDraft;
  payorType: "doc" | "pat";
  memo: string;
  submissionKey: string;
  savedAt: string;
}

export const DRAFT_STORAGE_KEY = "logos-order-draft-v1";

/** Max age before a stored draft is considered stale and dropped. */
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function serializeDraft(draft: Omit<WizardDraft, "version" | "savedAt">): string {
  const full: WizardDraft = {
    ...draft,
    version: 1,
    savedAt: new Date().toISOString(),
  };
  return JSON.stringify(full);
}

/** Parses a stored draft; null when malformed, stale, or another clinic's. */
export function parseDraft(
  raw: string | null,
  clinicKey: string,
): WizardDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as WizardDraft;
    if (draft.version !== 1) return null;
    if (draft.clinicKey !== clinicKey) return null;
    if (!draft.savedAt || Date.now() - Date.parse(draft.savedAt) > DRAFT_MAX_AGE_MS) {
      return null;
    }
    if (!Array.isArray(draft.rxs) || typeof draft.shipping !== "object") {
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}
