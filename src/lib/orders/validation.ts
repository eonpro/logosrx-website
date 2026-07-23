/**
 * Zod schemas for in-app prescription submissions. Mirrors LifeFile's field
 * constraints so bad input is rejected here — with friendly, field-level
 * messages — instead of surfacing as an opaque pharmacy error after the
 * forward.
 *
 * Pure module (no DB, no server-only imports) so it can be unit tested and
 * shared with client-side form checks.
 */

import { z } from "zod";
import { isIsoDate, normalizePhone } from "@/lib/lifefile/normalize";

/** An optional phone that must normalize to a real 10-digit US number. */
const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional()
  .refine((v) => v === undefined || normalizePhone(v) !== null, {
    message: "must be a valid US phone number, e.g. (212) 867-5309",
  });

const isoDateSchema = z
  .string()
  .trim()
  .refine(isIsoDate, { message: "must be a date in yyyy-mm-dd format" });

const stateSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, "must be a two-letter state code")
  .transform((v) => v.toUpperCase());

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

/** Saved-patient form (create or update). */
export const patientInputSchema = z.object({
  firstName: z.string().trim().min(1, "is required").max(30),
  lastName: z.string().trim().min(1, "is required").max(30),
  middleName: optionalTrimmed(20),
  gender: z.enum(["m", "f", "u"], { message: "is required" }),
  dateOfBirth: isoDateSchema,
  address1: optionalTrimmed(60),
  address2: optionalTrimmed(60),
  city: optionalTrimmed(100),
  state: stateSchema.optional().or(z.literal("").transform(() => undefined)),
  zip: optionalTrimmed(10),
  phoneMobile: optionalPhoneSchema,
  phoneHome: optionalPhoneSchema,
  phoneWork: optionalPhoneSchema,
  email: z
    .string()
    .trim()
    .max(100)
    .email("must be a valid email")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  allergies: z.array(z.string().trim().min(1).max(500)).max(50).default([]),
  conditions: z.array(z.string().trim().min(1).max(500)).max(50).default([]),
});

export type PatientInput = z.infer<typeof patientInputSchema>;

/** One prescription line as submitted from the wizard. */
export const rxInputSchema = z.object({
  /** Catalog SKU slug (`catalog_products.id`). */
  productId: z.string().trim().min(1, "is required").max(120),
  directions: z
    .string()
    .trim()
    .min(3, "is required")
    .max(10_000, "is too long"),
  quantity: optionalTrimmed(45),
  daysSupply: z.coerce.number().int().min(1).max(365).optional(),
  refills: z.coerce.number().int().min(0).max(11).default(0),
  clinicalDifferenceStatement: optionalTrimmed(10_000),
});

export type RxInput = z.infer<typeof rxInputSchema>;

export const shippingInputSchema = z.object({
  recipientType: z.enum(["clinic", "patient"]),
  recipientFirstName: z.string().trim().min(1, "is required").max(30),
  recipientLastName: z.string().trim().min(1, "is required").max(30),
  recipientPhone: optionalPhoneSchema,
  recipientEmail: z
    .string()
    .trim()
    .max(100)
    .email("must be a valid email")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  addressLine1: z.string().trim().min(1, "is required").max(60),
  addressLine2: optionalTrimmed(60),
  city: z.string().trim().min(1, "is required").max(100),
  state: stateSchema,
  zipCode: z.string().trim().min(3, "is required").max(10),
  /** LifeFile shipping-service code; omitted = account default. */
  serviceId: z.coerce.number().int().positive().optional(),
});

export type ShippingInput = z.infer<typeof shippingInputSchema>;

/**
 * The full order submission. The dashboard wizard sends `patientId` (a saved
 * patient); API integrators may instead send `patient` inline, which the
 * service matches to an existing record (same clinic + name + DOB) or creates.
 */
export const orderSubmissionSchema = z
  .object({
    patientId: z.coerce.number().int().positive().optional(),
    patient: patientInputSchema.optional(),
    /** NPI of the prescriber — must match a provider on the clinic profile. */
    prescriberNpi: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "must be a 10-digit NPI"),
    shipping: shippingInputSchema,
    payorType: z.enum(["doc", "pat"]).default("doc"),
    memo: optionalTrimmed(120),
    rxs: z
      .array(rxInputSchema)
      .min(1, "add at least one medication")
      .max(20, "too many medications in one order"),
    /**
     * Caller-generated idempotency token, stable across retries of the same
     * submission (the API calls this `referenceId`). Combined with the clinic
     * id to derive the stored, unique reference.
     */
    submissionKey: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{8,64}$/, "invalid submission key"),
  })
  .refine((v) => v.patientId != null || v.patient != null, {
    message: "provide either patientId or patient",
    path: ["patientId"],
  });

export type OrderSubmission = z.infer<typeof orderSubmissionSchema>;

/**
 * Flatten a ZodError into a single friendly message for the portal's
 * inline-banner convention (first issue wins; the wizard also does
 * client-side per-field checks before submitting).
 */
export function firstZodIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid input.";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
