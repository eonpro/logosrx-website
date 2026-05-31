import {
  pgTable,
  serial,
  integer,
  boolean,
  jsonb,
  text,
  timestamp,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";

export const applicationStatusEnum = pgEnum("application_status", [
  "new",
  "reviewed",
  "archived",
]);

export const clinicStatusEnum = pgEnum("clinic_status", [
  "new",
  "contacted",
  "onboarded",
  "archived",
]);

export const emailStatusEnum = pgEnum("email_status", [
  "active",
  "unsubscribed",
]);

/** Self-reported monthly pharmacy order volume (intake lead-in question). */
export const orderVolumeEnum = pgEnum("order_volume", [
  "0_5000",
  "5000_15000",
  "15000_50000",
  "50000_plus",
]);

/** Preferred fulfillment method chosen during the Order Processing step. */
export const shippingMethodEnum = pgEnum("shipping_method", [
  "direct_to_patient",
  "ship_to_practice",
]);

export const employmentApplications = pgTable("employment_applications", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  position: varchar("position", { length: 200 }).notNull(),
  referralSource: varchar("referral_source", { length: 50 }),
  willingToRelocate: varchar("willing_to_relocate", { length: 10 }),
  // Pathname inside the private @vercel/blob store. Source of truth.
  resumePathname: text("resume_pathname"),
  // MIME type as verified by server-side magic-byte detection.
  resumeContentType: varchar("resume_content_type", { length: 100 }),
  // User-friendly original filename, sanitized.
  resumeFilename: varchar("resume_filename", { length: 255 }),
  // @deprecated — legacy public blob URL. Do not write. Kept for migration only.
  resumeUrl: text("resume_url"),
  status: applicationStatusEnum("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clinicSignups = pgTable("clinic_signups", {
  id: serial("id").primaryKey(),
  clinicName: varchar("clinic_name", { length: 200 }).notNull(),
  contactName: varchar("contact_name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  npiNumber: varchar("npi_number", { length: 20 }),
  state: varchar("state", { length: 50 }),
  specialty: varchar("specialty", { length: 100 }),
  message: text("message"),
  status: clinicStatusEnum("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailSignups = pgTable("email_signups", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  status: emailStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * A clinic's onboarding profile. One row per Clerk user (`clerkUserId` is the
 * link between the authenticated account and the intake data). Created/updated
 * incrementally as the user advances through the `/onboarding` wizard, and
 * editable afterwards from `/dashboard`.
 *
 * Flexible/repeating data (products of interest, the list of licensed
 * providers) is stored as JSONB to avoid join-table churn for an MVP. Card
 * details live in the isolated `clinic_payments` table, never here.
 */
export const clinics = pgTable("clinics", {
  id: serial("id").primaryKey(),
  // Clerk user id (e.g. "user_2abc..."). Unique: one profile per account.
  clerkUserId: varchar("clerk_user_id", { length: 64 }).notNull().unique(),

  // --- Lead-in questions ---
  // Array of slugs: "weight_loss" | "peptides" | "hormone_replacement" | "other".
  productsOfInterest: jsonb("products_of_interest")
    .$type<string[]>()
    .default([])
    .notNull(),
  orderVolume: orderVolumeEnum("order_volume"),
  referralSource: varchar("referral_source", { length: 50 }),

  // --- Practice identity ---
  clinicName: varchar("clinic_name", { length: 200 }),
  practiceLegalName: varchar("practice_legal_name", { length: 200 }),
  practiceDba: varchar("practice_dba", { length: 200 }),
  ein: varchar("ein", { length: 20 }),
  practiceType: varchar("practice_type", { length: 100 }),

  // --- Practice location ---
  addressLine1: varchar("address_line1", { length: 255 }),
  addressSuite: varchar("address_suite", { length: 50 }),
  practicePhone: varchar("practice_phone", { length: 30 }),
  website: varchar("website", { length: 255 }),

  // --- Primary point of contact ---
  contactName: varchar("contact_name", { length: 200 }),
  contactPhone: varchar("contact_phone", { length: 30 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  privacyAccepted: boolean("privacy_accepted").default(false).notNull(),

  // --- Providers ---
  // Array of { firstName, lastName, specialty, npi, medicalLicense,
  // licenseState, dea, additionalLicenses: [{ license, state }] }.
  providers: jsonb("providers")
    .$type<ClinicProvider[]>()
    .default([])
    .notNull(),

  // --- Order processing + disclosures ---
  shippingMethod: shippingMethodEnum("shipping_method"),
  signatureRequired: boolean("signature_required"),
  shippingDisclosureAccepted: boolean("shipping_disclosure_accepted")
    .default(false)
    .notNull(),
  shippingSignature: text("shipping_signature"),
  providerAgreementAccepted: boolean("provider_agreement_accepted")
    .default(false)
    .notNull(),
  providerAgreementSignature: text("provider_agreement_signature"),
  paymentAuthAccepted: boolean("payment_auth_accepted")
    .default(false)
    .notNull(),
  paymentSignature: text("payment_signature"),

  // --- Progress ---
  // Highest wizard step index the user has reached (for resume). 0-based.
  onboardingStep: integer("onboarding_step").default(0).notNull(),
  onboardingCompleted: boolean("onboarding_completed")
    .default(false)
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Card details collected during the Payment step. ISOLATED from `clinics` so
 * access can be tightly scoped. Sensitive values (`cardNumberEnc`, `cvvEnc`)
 * are AES-256-GCM ciphertext produced by `src/lib/onboarding/encryption.ts` --
 * never plaintext. See compliance note in scratchpad: this is a deliberate,
 * non-PCI-compliant product decision; migrate to a tokenized processor later.
 */
export const clinicPayments = pgTable("clinic_payments", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 64 }).notNull().unique(),
  cardholderName: varchar("cardholder_name", { length: 200 }),
  cardNumberEnc: text("card_number_enc"),
  // Last 4 digits, plaintext -- safe to store and useful for display.
  cardLast4: varchar("card_last4", { length: 4 }),
  cardType: varchar("card_type", { length: 30 }),
  expiration: varchar("expiration", { length: 10 }),
  cvvEnc: text("cvv_enc"),
  billingAddress: varchar("billing_address", { length: 255 }),
  billingZip: varchar("billing_zip", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export interface ProviderLicense {
  license: string;
  state: string;
}

export interface ClinicProvider {
  firstName: string;
  lastName: string;
  specialty: string;
  npi: string;
  medicalLicense: string;
  licenseState: string;
  dea: string;
  additionalLicenses: ProviderLicense[];
}

export type EmploymentApplication = typeof employmentApplications.$inferSelect;
export type NewEmploymentApplication = typeof employmentApplications.$inferInsert;
export type ClinicSignup = typeof clinicSignups.$inferSelect;
export type NewClinicSignup = typeof clinicSignups.$inferInsert;
export type EmailSignup = typeof emailSignups.$inferSelect;
export type NewEmailSignup = typeof emailSignups.$inferInsert;
export type Clinic = typeof clinics.$inferSelect;
export type NewClinic = typeof clinics.$inferInsert;
export type ClinicPayment = typeof clinicPayments.$inferSelect;
export type NewClinicPayment = typeof clinicPayments.$inferInsert;
