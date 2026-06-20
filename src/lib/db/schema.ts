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

/** Lifecycle of a partner org or rep account (affiliate program). */
export const partnerStatusEnum = pgEnum("partner_status", [
  "pending",
  "active",
  "suspended",
]);

/** Who a commission entry / payout is owed to. */
export const commissionPayeeEnum = pgEnum("commission_payee", ["org", "rep"]);

/** Settlement state of a single commission ledger entry. */
export const commissionEntryStatusEnum = pgEnum("commission_entry_status", [
  "pending",
  "approved",
  "paid",
]);

/** Where a partner transaction row originated. */
export const transactionSourceEnum = pgEnum("transaction_source", [
  "manual",
  "csv",
  "lifefile",
]);

/**
 * How a partner org is compensated:
 *   - `commission` — a % of each attributed sale's revenue (org rate, with an
 *     optional rep carve-out).
 *   - `margin` — a wholesale model: the org has a per-product floor (cost), sets
 *     each clinic's selling price at/above that floor, and earns the spread
 *     (revenue − cost). The rep's % then applies to that margin.
 */
export const partnerCompensationModelEnum = pgEnum(
  "partner_compensation_model",
  ["commission", "margin"],
);

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
  // Affiliate attribution: set when the lead arrived via a partner referral
  // link (`/join/<code>` cookie present at submission time).
  referralLinkId: integer("referral_link_id").references(
    () => referralLinks.id,
    { onDelete: "set null" },
  ),
  partnerOrgId: integer("partner_org_id").references(() => partnerOrgs.id, {
    onDelete: "set null",
  }),
  partnerRepId: integer("partner_rep_id").references(() => partnerReps.id, {
    onDelete: "set null",
  }),
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
  // Signature blobs live in `clinic_signatures` (see below). The acceptance
  // booleans stay here; the base64 images are isolated to keep clinic reads small.
  providerAgreementAccepted: boolean("provider_agreement_accepted")
    .default(false)
    .notNull(),
  paymentAuthAccepted: boolean("payment_auth_accepted")
    .default(false)
    .notNull(),

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

  // --- Affiliate attribution ---
  // Stamped once at signup when the visitor arrived via a partner referral
  // link (`/join/<code>`). Never overwritten by later profile edits.
  referralLinkId: integer("referral_link_id").references(
    () => referralLinks.id,
    { onDelete: "set null" },
  ),
  partnerOrgId: integer("partner_org_id").references(() => partnerOrgs.id, {
    onDelete: "set null",
  }),
  partnerRepId: integer("partner_rep_id").references(() => partnerReps.id, {
    onDelete: "set null",
  }),

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
  // Partner "network" pages list the clinics attributed to an org / rep.
  index("clinics_partner_org_idx").on(t.partnerOrgId),
  index("clinics_partner_rep_idx").on(t.partnerRepId),
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
 * Isolated store for a clinic's signed-agreement images (base64 data-URL text
 * from the signature pad: shipping disclosure, provider agreement, payment
 * authorization). Split out of `clinics` so the common clinic read paths never
 * pull these large blobs incidentally — only the onboarding wizard / account
 * editor, which explicitly need them, load this table.
 *
 * One row per Clerk user. Mirrors the `clinic_payments` isolation pattern.
 */
export const clinicSignatures = pgTable("clinic_signatures", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 64 }).notNull().unique(),
  shippingSignature: text("shipping_signature"),
  providerAgreementSignature: text("provider_agreement_signature"),
  paymentSignature: text("payment_signature"),
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

// ---------------------------------------------------------------------------
// Affiliate partner program (EONPRO-style)
//
// Hierarchy: partner ORG → its REPS (sub-groups) → attributed CLINICS.
// Money math is integer-only: rates are basis points (100 bps = 1%) and all
// amounts are cents, so commission splits never suffer floating-point drift.
// ---------------------------------------------------------------------------

/**
 * A partner organization (sales group) in the affiliate program. Applies via
 * `/partners/apply` (status `pending`); an admin approves it, sets the org's
 * commission rate, and the owner activates their login via a one-time ticket
 * (same flow as rep-onboarded clinics).
 */
export const partnerOrgs = pgTable("partner_orgs", {
  id: serial("id").primaryKey(),
  // Clerk user id of the org owner. Null until the admin approves the
  // application and the Clerk account is provisioned.
  clerkUserId: varchar("clerk_user_id", { length: 64 }).unique(),
  name: varchar("name", { length: 200 }).notNull(),
  contactName: varchar("contact_name", { length: 200 }),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 30 }),
  website: varchar("website", { length: 255 }),
  notes: text("notes"),
  status: partnerStatusEnum("status").default("pending").notNull(),
  // How the org earns: a % of revenue (`commission`) or the wholesale spread
  // (`margin`). Drives which base the commission ledger is computed from.
  compensationModel: partnerCompensationModelEnum("compensation_model")
    .default("commission")
    .notNull(),
  // Org-level commission rate in basis points (100 = 1%). Set by an admin.
  // Used in `commission` mode. (In `margin` mode the org earns the full spread.)
  commissionRateBps: integer("commission_rate_bps").default(0).notNull(),
  approvedAt: timestamp("approved_at"),
  // Clerk user id of the admin who approved/suspended the org.
  approvedBy: varchar("approved_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("partner_orgs_contact_email_uniq").on(t.contactEmail),
  index("partner_orgs_status_idx").on(t.status),
]);

/**
 * A rep (or sub-group) working under a partner org. Created by the org owner
 * from the partner portal; the rep activates their login via an emailed
 * one-time ticket. The rep's rate is carved OUT of the org's rate, so it can
 * never exceed it (enforced in the server actions, not the schema).
 */
export const partnerReps = pgTable("partner_reps", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => partnerOrgs.id, { onDelete: "cascade" }),
  // Null until the rep activates their account.
  clerkUserId: varchar("clerk_user_id", { length: 64 }).unique(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  status: partnerStatusEnum("status").default("pending").notNull(),
  // Rep's share in basis points; must be ≤ the org's rate at assignment time.
  commissionRateBps: integer("commission_rate_bps").default(0).notNull(),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  activatedAt: timestamp("activated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("partner_reps_org_id_idx").on(t.orgId),
  uniqueIndex("partner_reps_org_email_uniq").on(t.orgId, t.email),
]);

/**
 * A shareable referral link (`/join/<code>`). Org-level links attribute
 * sign-ups to the org alone; rep-level links (repId set) attribute to both
 * the rep and their org. Counters are denormalized for cheap dashboards.
 */
export const referralLinks = pgTable("referral_links", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  orgId: integer("org_id")
    .notNull()
    .references(() => partnerOrgs.id, { onDelete: "cascade" }),
  repId: integer("rep_id").references(() => partnerReps.id, {
    onDelete: "cascade",
  }),
  label: varchar("label", { length: 120 }),
  active: boolean("active").default(true).notNull(),
  clickCount: integer("click_count").default(0).notNull(),
  signupCount: integer("signup_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("referral_links_org_id_idx").on(t.orgId),
]);

/**
 * Per-product wholesale floor (cost) prices for a `margin`-model org. The org
 * may set each attributed clinic's selling price at or above its floor for a
 * SKU; the spread (sell − floor) is the org's earnings on that line. `productId`
 * is the catalog SKU id (see `src/data/catalog.ts`). One floor per (org, SKU).
 */
export const partnerOrgPricing = pgTable(
  "partner_org_pricing",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => partnerOrgs.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 120 }).notNull(),
    productName: varchar("product_name", { length: 200 }).notNull(),
    floorCents: integer("floor_cents").notNull(),
    unit: varchar("unit", { length: 60 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("partner_org_pricing_org_product_uniq").on(
      t.orgId,
      t.productId,
    ),
  ],
);

/**
 * A revenue event for an attributed clinic. Orders live in LifeFile today, so
 * rows are entered by an admin (manually or via CSV import); `source` leaves
 * room for a LifeFile API sync later. Creating a transaction also writes its
 * `commission_entries` (the ledger) in the same DB transaction.
 */
export const partnerTransactions = pgTable("partner_transactions", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id")
    .notNull()
    .references(() => clinics.id, { onDelete: "cascade" }),
  transactionDate: timestamp("transaction_date").notNull(),
  description: varchar("description", { length: 300 }),
  // External reference, e.g. a LifeFile order id.
  reference: varchar("reference", { length: 120 }),
  revenueCents: integer("revenue_cents").notNull(),
  // Wholesale cost (floor total) of the sale — set for `margin`-model orgs so
  // earnings = revenue − cost. Null for `commission`-model transactions.
  costCents: integer("cost_cents"),
  source: transactionSourceEnum("source").default("manual").notNull(),
  // Clerk user id of the admin who recorded the row.
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("partner_transactions_clinic_id_idx").on(t.clinicId),
  index("partner_transactions_date_idx").on(t.transactionDate),
]);

/**
 * A payout recorded by an admin: money sent to an org (repId null) or to a
 * rep, outside the platform (ACH/check/wire). Recording a payout flips the
 * covered `commission_entries` to `paid` and stamps them with this row's id.
 */
export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => partnerOrgs.id, { onDelete: "cascade" }),
  // Set when the payout went to a specific rep rather than the org itself.
  repId: integer("rep_id").references(() => partnerReps.id, {
    onDelete: "set null",
  }),
  payee: commissionPayeeEnum("payee").notNull(),
  amountCents: integer("amount_cents").notNull(),
  method: varchar("method", { length: 40 }),
  reference: varchar("reference", { length: 200 }),
  notes: text("notes"),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  recordedBy: varchar("recorded_by", { length: 64 }).notNull(),
  recordedByEmail: varchar("recorded_by_email", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("payouts_org_id_idx").on(t.orgId),
]);

/**
 * The commission ledger: one row per payee per transaction. For a transaction
 * attributed to a rep, TWO rows are written — the rep's share (`payee=rep`,
 * at the rep's rate) and the org's remainder (`payee=org`, at org − rep rate).
 * Org-only attribution writes a single `payee=org` row at the full org rate.
 * Rates/amounts are snapshots: later rate changes only affect new entries.
 */
export const commissionEntries = pgTable("commission_entries", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => partnerTransactions.id, { onDelete: "cascade" }),
  orgId: integer("org_id")
    .notNull()
    .references(() => partnerOrgs.id, { onDelete: "cascade" }),
  repId: integer("rep_id").references(() => partnerReps.id, {
    onDelete: "set null",
  }),
  payee: commissionPayeeEnum("payee").notNull(),
  // Snapshot of the effective rate this entry was computed at (basis points).
  rateBps: integer("rate_bps").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: commissionEntryStatusEnum("status").default("pending").notNull(),
  payoutId: integer("payout_id").references(() => payouts.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  // Balance and dashboard queries aggregate by payee + status.
  index("commission_entries_org_status_idx").on(t.orgId, t.status),
  index("commission_entries_rep_id_idx").on(t.repId),
  index("commission_entries_transaction_id_idx").on(t.transactionId),
  index("commission_entries_payout_id_idx").on(t.payoutId),
]);

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
export type ClinicSignatures = typeof clinicSignatures.$inferSelect;
export type NewClinicSignatures = typeof clinicSignatures.$inferInsert;
export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
export type FeaturedProduct = typeof featuredProducts.$inferSelect;
export type NewFeaturedProduct = typeof featuredProducts.$inferInsert;
export type PartnerOrg = typeof partnerOrgs.$inferSelect;
export type NewPartnerOrg = typeof partnerOrgs.$inferInsert;
export type PartnerRep = typeof partnerReps.$inferSelect;
export type NewPartnerRep = typeof partnerReps.$inferInsert;
export type ReferralLink = typeof referralLinks.$inferSelect;
export type NewReferralLink = typeof referralLinks.$inferInsert;
export type PartnerTransaction = typeof partnerTransactions.$inferSelect;
export type NewPartnerTransaction = typeof partnerTransactions.$inferInsert;
export type CommissionEntry = typeof commissionEntries.$inferSelect;
export type NewCommissionEntry = typeof commissionEntries.$inferInsert;
export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;
