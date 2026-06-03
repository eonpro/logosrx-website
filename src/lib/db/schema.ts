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
  uniqueIndex,
  index,
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

/**
 * Admin review state for a completed clinic onboarding. New completed intakes
 * start as `pending`; an admin moves them to `verified` or `rejected` from the
 * `/admin/clinics` review queue.
 */
export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "verified",
  "rejected",
]);

/** CRM pricing tier assigned to a clinic by an admin. */
export const pricingTierEnum = pgEnum("pricing_tier", [
  "standard",
  "preferred",
  "vip",
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
}, (t) => [
  // Admin list filters by status and orders by createdAt (newest first).
  index("employment_applications_status_idx").on(t.status),
  index("employment_applications_created_at_idx").on(t.createdAt),
]);

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
}, (t) => [
  index("clinic_signups_status_idx").on(t.status),
  index("clinic_signups_created_at_idx").on(t.createdAt),
]);

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

  // --- Admin verification ---
  verificationStatus: verificationStatusEnum("verification_status")
    .default("pending")
    .notNull(),
  verifiedAt: timestamp("verified_at"),
  // Clerk user id of the admin who set the current verification state.
  verifiedBy: varchar("verified_by", { length: 64 }),
  verificationNotes: text("verification_notes"),

  // --- CRM: custom pricing ---
  // A tier label plus an optional flat discount (whole %, 0-100) applied on top
  // of standard pricing. Per-product overrides live in `clinic_pricing`.
  pricingTier: pricingTierEnum("pricing_tier").default("standard").notNull(),
  pricingDiscountPct: integer("pricing_discount_pct").default(0).notNull(),
  pricingNotes: text("pricing_notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // The admin verification queue filters on completed intakes (often together
  // with verification status) and orders by createdAt.
  index("clinics_onboarding_verification_idx").on(
    t.onboardingCompleted,
    t.verificationStatus,
  ),
  index("clinics_created_at_idx").on(t.createdAt),
  // The admin clinics list filters onboardingCompleted=true and orders by
  // createdAt DESC. This composite serves both the filter and the sort in one
  // index scan (Postgres reads a btree backward for DESC). A plain
  // single-column createdAt index can't satisfy the filter at the same time.
  index("clinics_completed_created_at_idx").on(
    t.onboardingCompleted,
    t.createdAt,
  ),
]);

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

/**
 * CRM timeline notes an admin writes about a clinic. Append-only; each note
 * records who wrote it and when.
 */
export const clinicNotes = pgTable("clinic_notes", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id")
    .notNull()
    .references(() => clinics.id, { onDelete: "cascade" }),
  authorUserId: varchar("author_user_id", { length: 64 }).notNull(),
  authorEmail: varchar("author_email", { length: 255 }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  // Notes are always read by clinic, newest first.
  index("clinic_notes_clinic_id_created_at_idx").on(t.clinicId, t.createdAt),
]);

/**
 * Per-clinic pricing overrides. The full catalog + its standard provider price
 * is the source of truth (see `src/data/catalog.ts`); this table stores ONLY the
 * rows where an admin set a clinic-specific price, so the catalog stays the
 * baseline and overrides are sparse.
 *
 *   - `productId` = catalog SKU id (e.g. "semaglutide-glycine-2.5mg-1ml") for a
 *     standard-catalog override. NULL for ad-hoc/custom line items not in the
 *     catalog. The unique index keeps at most one override per (clinic, SKU);
 *     Postgres treats NULLs as distinct, so multiple ad-hoc rows are allowed.
 *   - Prices are integer cents to avoid floating-point drift.
 */
export const clinicPricing = pgTable(
  "clinic_pricing",
  {
    id: serial("id").primaryKey(),
    clinicId: integer("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 120 }),
    productName: varchar("product_name", { length: 200 }).notNull(),
    priceCents: integer("price_cents").notNull(),
    unit: varchar("unit", { length: 60 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("clinic_pricing_clinic_product_uniq").on(
      t.clinicId,
      t.productId,
    ),
  ],
);

/** Distinguishes a merchandising entry: a promotion vs. a news/announcement. */
export const promotionKindEnum = pgEnum("promotion_kind", ["promo", "news"]);

/**
 * How a merchandising entry renders in the storefront:
 *   - `card` — compact promo/news card in the feed (default).
 *   - `hero` — large spotlight banner across the top of the storefront.
 *   - `tile` — a category tile in the row beneath the hero.
 */
export const promotionLayoutEnum = pgEnum("promotion_layout", [
  "card",
  "hero",
  "tile",
]);

/**
 * Admin-managed merchandising for the clinic storefront: promotions and special
 * news/announcements. Surfaced at the top of `/dashboard` to verified clinics.
 * A row is shown when `active` is true and "now" falls within the optional
 * [`startsAt`, `endsAt`] window. `audienceTier` (null = all tiers) lets a promo
 * target a specific pricing tier. `productId` optionally deep-links to a SKU.
 */
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  kind: promotionKindEnum("kind").default("promo").notNull(),
  // Storefront render style (see `promotionLayoutEnum`).
  layout: promotionLayoutEnum("layout").default("card").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  imageUrl: varchar("image_url", { length: 500 }),
  // Background base color (hex) for hero/tile gradients.
  bgColor: varchar("bg_color", { length: 20 }),
  badge: varchar("badge", { length: 40 }),
  ctaLabel: varchar("cta_label", { length: 60 }),
  ctaHref: varchar("cta_href", { length: 500 }),
  // Optional catalog SKU id this promo points at.
  productId: varchar("product_id", { length: 120 }),
  // null = visible to every tier; otherwise restrict to a single pricing tier.
  audienceTier: pricingTierEnum("audience_tier"),
  pinned: boolean("pinned").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // Storefront reads only active rows, ordered by pinned/sortOrder.
  index("promotions_active_sort_idx").on(t.active, t.sortOrder),
]);

/**
 * Catalog SKUs an admin has flagged to feature in the storefront. The catalog
 * itself (`src/data/catalog.ts`) is the source of truth for product data; this
 * table only records which SKUs are featured, an optional badge label, and the
 * display order. One row per SKU.
 */
export const featuredProducts = pgTable("featured_products", {
  id: serial("id").primaryKey(),
  productId: varchar("product_id", { length: 120 }).notNull().unique(),
  label: varchar("label", { length: 40 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("featured_products_active_sort_idx").on(t.active, t.sortOrder),
]);

/**
 * Audit trail for sensitive card reveals. Written every time an admin decrypts
 * and views a clinic's full card details (gated by password re-verification).
 */
export const cardAccessLog = pgTable("card_access_log", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull(),
  adminUserId: varchar("admin_user_id", { length: 64 }).notNull(),
  adminEmail: varchar("admin_email", { length: 255 }),
  action: varchar("action", { length: 30 }).default("reveal").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
export type ClinicNote = typeof clinicNotes.$inferSelect;
export type NewClinicNote = typeof clinicNotes.$inferInsert;
export type ClinicPriceItem = typeof clinicPricing.$inferSelect;
export type NewClinicPriceItem = typeof clinicPricing.$inferInsert;
export type CardAccessLogEntry = typeof cardAccessLog.$inferSelect;
export type ClinicPayment = typeof clinicPayments.$inferSelect;
export type NewClinicPayment = typeof clinicPayments.$inferInsert;
export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
export type FeaturedProduct = typeof featuredProducts.$inferSelect;
export type NewFeaturedProduct = typeof featuredProducts.$inferInsert;
