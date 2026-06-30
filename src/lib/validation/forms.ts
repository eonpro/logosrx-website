import { z } from "zod";

/**
 * Shared input-validation schemas for untrusted public submissions.
 *
 * Why a central module: the email regex, length caps, and trim/normalize rules
 * were previously hand-rolled and copy-pasted across every API route and
 * server action. Centralizing them as Zod schemas means one source of truth,
 * consistent `400`s (instead of accidental `500`s from malformed input), and a
 * single place to test the rules.
 *
 * Conventions:
 *   - Inputs are trimmed; empty/whitespace optional fields normalize to `null`.
 *   - Required fields produce a friendly "<Field> is required." message.
 *   - Email is lowercased and validated against the same regex the routes used,
 *     so behavior is unchanged from the previous manual checks.
 */

/** Matches the (intentionally lenient) email check the routes used previously. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A trimmed, required, length-capped string with friendly messages. */
function requiredString(max: number, label: string) {
  return z.preprocess(
    (v) =>
      typeof v === "string" ? v.trim() : v == null ? "" : v,
    z
      .string()
      .min(1, `${label} is required.`)
      .max(max, `${label} is too long.`),
  );
}

/** A trimmed optional string; empty/whitespace/missing normalizes to `null`. */
function optionalString(max: number, label = "Value") {
  return z.preprocess((v) => {
    if (typeof v !== "string") return null;
    const trimmed = v.trim();
    return trimmed.length ? trimmed : null;
  }, z.string().max(max, `${label} is too long.`).nullable());
}

/** Required email: trimmed, lowercased, regex-validated. */
export const emailField = requiredString(255, "Email")
  .transform((v) => (v as string).toLowerCase())
  .refine((v) => EMAIL_RE.test(v), "Invalid email address.");

export const emailSignupSchema = z.object({
  email: emailField,
});

export const clinicSignupSchema = z.object({
  clinicName: requiredString(200, "Clinic name"),
  contactName: requiredString(200, "Contact name"),
  email: emailField,
  phone: requiredString(30, "Phone"),
  npiNumber: optionalString(20, "NPI number"),
  state: optionalString(50, "State"),
  specialty: optionalString(100, "Specialty"),
  message: optionalString(4000, "Message"),
});
export type ClinicSignupInput = z.infer<typeof clinicSignupSchema>;

const MAX_APPLICATION_FIELD = 1024;
export const employmentApplicationSchema = z.object({
  firstName: requiredString(MAX_APPLICATION_FIELD, "First name"),
  lastName: requiredString(MAX_APPLICATION_FIELD, "Last name"),
  email: emailField,
  phone: requiredString(MAX_APPLICATION_FIELD, "Phone"),
  position: requiredString(MAX_APPLICATION_FIELD, "Position"),
  referralSource: optionalString(MAX_APPLICATION_FIELD, "Referral source"),
  willingToRelocate: optionalString(MAX_APPLICATION_FIELD, "Relocation"),
});
export type EmploymentApplicationInput = z.infer<
  typeof employmentApplicationSchema
>;

export const partnerApplicationSchema = z.object({
  orgName: requiredString(200, "Organization name"),
  contactName: requiredString(200, "Contact name"),
  email: emailField,
  phone: requiredString(30, "Phone").refine(
    (v) => (v as string).replace(/\D/g, "").length >= 7,
    "Please enter a valid phone number.",
  ),
  website: optionalString(255, "Website"),
  notes: optionalString(4000, "Notes"),
});
export type PartnerApplicationParsed = z.infer<typeof partnerApplicationSchema>;

/**
 * Admin-side edit of a partner org's contact details. Mirrors the application
 * fields but lets an admin fix data before/after approval — most importantly a
 * duplicate phone number that blocks Clerk account provisioning. Phone is
 * optional here (the org record allows none); when present it must look valid.
 */
export const partnerOrgEditSchema = z.object({
  orgName: requiredString(200, "Organization name"),
  contactName: requiredString(200, "Contact name"),
  email: emailField,
  phone: optionalString(30, "Phone").refine(
    (v) => v == null || v.replace(/\D/g, "").length >= 7,
    "Please enter a valid phone number.",
  ),
  website: optionalString(255, "Website"),
});
export type PartnerOrgEditParsed = z.infer<typeof partnerOrgEditSchema>;

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Runs a schema against untrusted input and collapses Zod's structured error
 * into a single user-facing message (the first issue). Returns a discriminated
 * union so callers branch on `ok` without throwing.
 */
export function parseForm<T>(
  schema: z.ZodType<T>,
  input: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const first = result.error.issues[0];
  return { ok: false, error: first?.message ?? "Invalid submission." };
}
