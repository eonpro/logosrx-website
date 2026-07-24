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

/**
 * Lifecycle of a custom pricing quote (a password-gated link sent to a
 * prospective clinic):
 *   - `active`  — live; can be opened with the password and accepted.
 *   - `accepted`— the recipient accepted the pricing (CTA clicked) but hasn't
 *     finished creating their account yet.
 *   - `claimed` — an account was created and the quoted pricing was applied.
 *   - `revoked` — an admin disabled the link; it no longer opens.
 */
export const quoteStatusEnum = pgEnum("quote_status", [
  "active",
  "accepted",
  "claimed",
  "revoked",
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

/**
 * Whether a ledger row is a positive `earning` or a negative `reversal`
 * (clawback) created when a transaction is refunded/voided.
 */
export const commissionEntryKindEnum = pgEnum("commission_entry_kind", [
  "earning",
  "reversal",
]);

/**
 * Relationship stage for a company in a partner's book of business (CRM view,
 * separate from the clinic's admin `verificationStatus`).
 */
export const partnerClinicStageEnum = pgEnum("partner_clinic_stage", [
  "lead",
  "active",
  "at_risk",
  "dormant",
]);

/** Kind of entry in a company's partner activity timeline. */
export const partnerClinicActivityTypeEnum = pgEnum(
  "partner_clinic_activity_type",
  ["note", "stage_change", "tag_change"],
);

/** What a sales goal/quota measures. */
export const partnerGoalMetricEnum = pgEnum("partner_goal_metric", [
  "revenue",
  "commission",
]);

/** The recurring period a goal/quota resets over. */
export const partnerGoalPeriodEnum = pgEnum("partner_goal_period", [
  "month",
  "quarter",
  "year",
]);

/** Assignable role for an invited org teammate (owner is implicit on the org). */
export const partnerOrgMemberRoleEnum = pgEnum("partner_org_member_role", [
  "admin",
  "viewer",
]);

/**
 * Partner API key (for the read-only partner API). Only a SHA-256 hash of the
 * key is stored; the plaintext key is shown once at creation. `keyPrefix` is a
 * short, non-secret identifier for display in the UI.
 */
export const partnerApiKeys = pgTable(
  "partner_api_keys",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => partnerOrgs.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    keyPrefix: varchar("key_prefix", { length: 24 }).notNull(),
    keyHash: varchar("key_hash", { length: 64 }).notNull().unique(),
    lastUsedAt: timestamp("last_used_at"),
    revokedAt: timestamp("revoked_at"),
    createdBy: varchar("created_by", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("partner_api_keys_org_idx").on(t.orgId)],
);

/**
 * Partner webhook subscription. Delivers HMAC-signed JSON to `url` for the
 * subscribed `events`. `secret` is the signing secret shared with the partner
 * (surfaced once in the UI so they can verify signatures).
 */
export const partnerWebhooks = pgTable(
  "partner_webhooks",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => partnerOrgs.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 500 }).notNull(),
    secret: varchar("secret", { length: 80 }).notNull(),
    events: jsonb("events").$type<string[]>().default([]).notNull(),
    active: boolean("active").default(true).notNull(),
    lastDeliveryAt: timestamp("last_delivery_at"),
    lastStatus: integer("last_status"),
    createdBy: varchar("created_by", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("partner_webhooks_org_idx").on(t.orgId)],
);

/**
 * Per-delivery log for outbound partner webhooks — also the dead-letter store.
 *
 * One row per (subscription, event) dispatch. `deliveryId` is the idempotency
 * key sent to the receiver as `X-Logos-Delivery-Id`; it is stable across
 * retries AND replays so consumers can dedupe. `payload` is stored so a failed
 * delivery can be replayed without recomputing it. Undelivered rows
 * (`delivered = false`, attempts exhausted) are the dead-letter queue an admin
 * can inspect and replay.
 */
export const partnerWebhookDeliveries = pgTable(
  "partner_webhook_deliveries",
  {
    id: serial("id").primaryKey(),
    webhookId: integer("webhook_id")
      .notNull()
      .references(() => partnerWebhooks.id, { onDelete: "cascade" }),
    orgId: integer("org_id")
      .notNull()
      .references(() => partnerOrgs.id, { onDelete: "cascade" }),
    event: varchar("event", { length: 64 }).notNull(),
    deliveryId: varchar("delivery_id", { length: 64 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    attempts: integer("attempts").default(0).notNull(),
    delivered: boolean("delivered").default(false).notNull(),
    lastStatus: integer("last_status"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("partner_webhook_deliveries_delivery_id_uniq").on(t.deliveryId),
    index("partner_webhook_deliveries_webhook_idx").on(t.webhookId),
    index("partner_webhook_deliveries_org_idx").on(t.orgId),
    // Fast dead-letter scan: pull the undelivered rows for an org.
    index("partner_webhook_deliveries_undelivered_idx").on(t.delivered, t.orgId),
  ],
);

/** Where a partner transaction row originated. */
export const transactionSourceEnum = pgEnum("transaction_source", [
  "manual",
  "csv",
  "lifefile",
  // Recorded from an uploaded pharmacy invoice PDF (see invoice_* columns).
  "invoice",
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

  // --- LifeFile ordering (in-app prescribing) ---
  // Admin-controlled gate: verified clinics can place orders through the
  // dashboard only when this is on.
  lifefileOrderingEnabled: boolean("lifefile_ordering_enabled")
    .default(false)
    .notNull(),
  // Optional LifeFile practice id (admin reference). Not stamped on
  // `order.practice.id` — mismatched API networks cause LifeFile rejects.
  lifefilePracticeId: integer("lifefile_practice_id"),
  // Default LifeFile shipping-service code preselected in the order wizard.
  lifefileDefaultServiceId: integer("lifefile_default_service_id"),

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

/**
 * The product catalog: every SKU plus its three-tier pricing. Originally a
 * static array (`catalogProducts`) in `src/data/catalog.ts`; moved to the DB so
 * a super admin can edit prices and the SKU roster live via `/admin/catalog`
 * with no redeploy. The taxonomy const arrays, `CATALOG_CONFIG`, the
 * `CatalogProduct` type, and all pure helpers still live in `src/data/catalog.ts`
 * (that file's array is the one-time seed).
 *
 *   - `id` is the SKU slug (lowercase kebab-case) and is IMMUTABLE after
 *     creation: `clinic_pricing.productId` and `featured_products.productId`
 *     reference it by value, so renaming would orphan those rows. Renaming edits
 *     the display `name` only.
 *   - `pricing` is jsonb mirroring `CatalogPricing` in dollars. A tier may be a
 *     number, `null` ("Not Available"), or absent (`undefined`, hidden "—").
 *     jsonb preserves that present/null/absent distinction exactly.
 *   - `productFamily` / `therapeuticAreas` are jsonb string arrays.
 *   - Deletion defaults to soft-delete (`active=false`); a hard delete is only
 *     allowed when no `clinic_pricing` / `featured_products` rows reference it.
 */
export const catalogProducts = pgTable(
  "catalog_products",
  {
    id: varchar("id", { length: 120 }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    strength: varchar("strength", { length: 120 }),
    form: varchar("form", { length: 60 }).notNull(),
    unit: varchar("unit", { length: 60 }),
    pricing: jsonb("pricing")
      .$type<{
        retail?: number | null;
        provider?: number | null;
        volume?: number | null;
      }>()
      .notNull()
      .default({}),
    productFamily: jsonb("product_family")
      .$type<string[]>()
      .notNull()
      .default([]),
    brand: varchar("brand", { length: 60 }),
    therapeuticAreas: jsonb("therapeutic_areas")
      .$type<string[]>()
      .notNull()
      .default([]),
    details: text("details"),
    badge: varchar("badge", { length: 60 }),
    sortOrder: integer("sort_order").default(0).notNull(),
    active: boolean("active").default(true).notNull(),

    // --- LifeFile mapping (in-app prescribing) ---
    // LifeFile product id. NULL = not orderable in-app (storefront falls back
    // to the external LifeFile portal link for this SKU).
    lfProductId: integer("lf_product_id"),
    // DEA schedule: 2-5, or L (legend) / O (OTC). Schedules 2-5 are blocked
    // from in-app ordering (LifeFile requires a signed PDF for those).
    scheduleCode: varchar("schedule_code", { length: 1 }),
    // Dispensing units forwarded on each Rx (e.g. "each", "ml").
    quantityUnits: varchar("quantity_units", { length: 45 }),
    // Prefilled quantity in the order wizard (editable per Rx).
    defaultQuantity: varchar("default_quantity", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("catalog_products_active_sort_idx").on(t.active, t.sortOrder)],
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
 * A custom pricing quote an admin builds for a prospective clinic and shares as
 * a password-gated link (`/quote/<token>`). The recipient enters the password,
 * reviews their quoted line items (in `pricing_quote_items`), and accepts —
 * which routes them into account creation. On signup the quote's `tier`,
 * `discountPct`, and line items are applied to the new clinic and the row is
 * marked `claimed`.
 *
 * Only the scrypt hash of the password is stored (`passwordHash`); the plaintext
 * is shown to the admin exactly once at creation/regeneration to share out-of-band.
 */
export const pricingQuotes = pgTable("pricing_quotes", {
  id: serial("id").primaryKey(),
  // Unguessable public slug used in the URL. base32, ~24 chars.
  token: varchar("token", { length: 32 }).notNull().unique(),
  clinicName: varchar("clinic_name", { length: 200 }),
  contactName: varchar("contact_name", { length: 200 }),
  // Recipient email (lowercased). Prefills onboarding; not used for auth.
  email: varchar("email", { length: 255 }).notNull(),
  // Optional intro/message shown above the quoted items.
  intro: text("intro"),
  // scrypt hash, serialized as `saltHex:hashHex`. Never the plaintext.
  passwordHash: text("password_hash").notNull(),
  // Pricing applied to the clinic on claim (alongside the line items).
  tier: pricingTierEnum("tier").default("standard").notNull(),
  discountPct: integer("discount_pct").default(0).notNull(),
  status: quoteStatusEnum("status").default("active").notNull(),
  expiresAt: timestamp("expires_at"),
  // Admin who created the quote.
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdByEmail: varchar("created_by_email", { length: 255 }),
  viewedAt: timestamp("viewed_at"),
  acceptedAt: timestamp("accepted_at"),
  // Set when an account is created from this quote.
  claimedClerkUserId: varchar("claimed_clerk_user_id", { length: 64 }),
  claimedClinicId: integer("claimed_clinic_id").references(() => clinics.id, {
    onDelete: "set null",
  }),
  claimedAt: timestamp("claimed_at"),
  // When a quote is attributed to a partner (sales org), these credit the
  // resulting clinic to that org/rep on claim (so they earn on its sales).
  // Set either by a partner creating their own quote, or by an admin who picks
  // a referrer on an admin-created quote. NULL for unattributed admin quotes.
  partnerOrgId: integer("partner_org_id").references(() => partnerOrgs.id, {
    onDelete: "set null",
  }),
  partnerRepId: integer("partner_rep_id").references(() => partnerReps.id, {
    onDelete: "set null",
  }),
  // True when an admin created this quote and attributed it to a partner as a
  // referral. The partner sees it read-only (Logos RX owns it); partner-created
  // quotes stay false so they remain fully manageable by the partner.
  adminReferral: boolean("admin_referral").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("pricing_quotes_status_idx").on(t.status),
  index("pricing_quotes_created_at_idx").on(t.createdAt),
  index("pricing_quotes_partner_org_idx").on(t.partnerOrgId),
]);

/**
 * A single line on a pricing quote. `productId` is a catalog SKU id (applied as
 * a per-SKU override on claim) or NULL for an ad-hoc item. Prices are cents.
 */
export const pricingQuoteItems = pgTable("pricing_quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id")
    .notNull()
    .references(() => pricingQuotes.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 120 }),
  productName: varchar("product_name", { length: 200 }).notNull(),
  priceCents: integer("price_cents").notNull(),
  unit: varchar("unit", { length: 60 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("pricing_quote_items_quote_id_idx").on(t.quoteId),
]);

/**
 * Lifecycle of a shareable card-update link:
 *   - `active`  — live; the clinic can open it and submit a new card.
 *   - `used`    — the clinic submitted a card through it (single-use).
 *   - `revoked` — an admin disabled it; it no longer opens.
 */
export const cardUpdateLinkStatusEnum = pgEnum("card_update_link_status", [
  "active",
  "used",
  "revoked",
]);

/**
 * A single-use, admin-generated link (`/update-card/<token>`) a clinic opens
 * to re-enter their full payment card — the same fields collected during
 * onboarding. No sign-in required: the unguessable token is the credential,
 * so links are short-lived (expiry stamped at creation) and one-shot.
 *
 * Two kinds of recipient:
 *   - Portal clinic (`clinicId` set): the submitted card lands in
 *     `clinic_payments` (encrypted) exactly like the onboarding write path.
 *     At most one `active` link per clinic by convention: generating a new
 *     one revokes its predecessors (enforced in the action).
 *   - External clinic (`clinicId` NULL): a clinic that isn't on the portal.
 *     The admin names the recipient (`clinicName`) and the submitted card is
 *     stored ON THIS ROW (the `card*`/`billing*` columns below, sensitive
 *     values AES-256-GCM encrypted like `clinic_payments`). Admins reveal it
 *     from `/admin/card-updates` behind the same step-up password gate.
 */
export const cardUpdateLinks = pgTable("card_update_links", {
  id: serial("id").primaryKey(),
  // Unguessable public slug used in the URL. base32, ~24 chars.
  token: varchar("token", { length: 32 }).notNull().unique(),
  // Null for external (non-portal) links.
  clinicId: integer("clinic_id").references(() => clinics.id, {
    onDelete: "cascade",
  }),
  // Recipient display name — required for external links; a convenience
  // snapshot otherwise.
  clinicName: varchar("clinic_name", { length: 200 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  status: cardUpdateLinkStatusEnum("status").default("active").notNull(),
  expiresAt: timestamp("expires_at"),
  // Admin who generated the link.
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdByEmail: varchar("created_by_email", { length: 255 }),
  viewedAt: timestamp("viewed_at"),
  usedAt: timestamp("used_at"),

  // --- External submission (clinicId NULL only; otherwise always NULL) ---
  // Mirrors `clinic_payments`: card number + CVV are AES-256-GCM ciphertext.
  cardholderName: varchar("cardholder_name", { length: 200 }),
  cardNumberEnc: text("card_number_enc"),
  cardLast4: varchar("card_last4", { length: 4 }),
  cardType: varchar("card_type", { length: 30 }),
  expiration: varchar("expiration", { length: 10 }),
  cvvEnc: text("cvv_enc"),
  billingAddress: varchar("billing_address", { length: 255 }),
  billingZip: varchar("billing_zip", { length: 20 }),
  // Payment-authorization signature (base64 data-URL from the signature pad).
  paymentSignature: text("payment_signature"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // Admin clinic detail loads the latest link for one clinic.
  index("card_update_links_clinic_idx").on(t.clinicId, t.createdAt),
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

/**
 * Immutable audit trail of privileged state changes (clinic approvals, partner
 * suspensions, pricing/commission edits, payouts, quote lifecycle, card
 * reveals). Append-only by convention — the app never updates or deletes rows;
 * rely on Postgres role grants (INSERT/SELECT only) to enforce immutability at
 * the DB layer for SOC2/HIPAA evidence.
 *
 * `metadata` carries action-specific context (e.g. before/after values, amount
 * in cents, target name). Never store decrypted PII/PHI or card data here.
 */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: serial("id").primaryKey(),
    // Who acted: "admin" | "partner" | "system".
    actorType: varchar("actor_type", { length: 20 }).notNull(),
    // Clerk user id of the actor (null for system-generated events).
    actorId: varchar("actor_id", { length: 64 }),
    actorEmail: varchar("actor_email", { length: 255 }),
    // Dotted action name, e.g. "clinic.verify", "partner_org.suspend".
    action: varchar("action", { length: 80 }).notNull(),
    // What was acted on, e.g. ("clinic", "42") or ("partner_org", "7").
    targetType: varchar("target_type", { length: 40 }),
    targetId: varchar("target_id", { length: 64 }),
    // Action-specific structured context (before/after, amounts, etc.).
    metadata: jsonb("metadata"),
    // Best-effort client IP (from x-forwarded-for) for the request.
    ip: varchar("ip", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("audit_events_actor_idx").on(t.actorId),
    index("audit_events_target_idx").on(t.targetType, t.targetId),
    index("audit_events_action_idx").on(t.action),
    index("audit_events_created_idx").on(t.createdAt),
  ],
);

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
  // Set when the org owner executes the Marketing Services Agreement. The
  // portal is gated on this: an active org owner who hasn't signed is routed
  // to the signing flow. The full executed record lives in `partner_agreements`.
  msaSignedAt: timestamp("msa_signed_at"),
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
  // Set when the rep executes (acknowledges) the Marketing Services Agreement.
  // Reps are gated on this too — they sign before accessing the portal.
  msaSignedAt: timestamp("msa_signed_at"),
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
  // How much of this transaction's revenue has been refunded/clawed back so
  // far (0..revenueCents). Drives the reversal ledger entries.
  refundedCents: integer("refunded_cents").default(0).notNull(),
  source: transactionSourceEnum("source").default("manual").notNull(),
  // Uploaded invoice PDF (source = "invoice"): pathname inside the private
  // @vercel/blob store, plus the sanitized original filename for downloads.
  // Null for rows recorded without a document.
  invoicePathname: text("invoice_pathname"),
  invoiceFilename: varchar("invoice_filename", { length: 255 }),
  // Clerk user id of the admin who recorded the row.
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("partner_transactions_clinic_id_idx").on(t.clinicId),
  index("partner_transactions_date_idx").on(t.transactionDate),
  // De-duplicate imports: a non-null external reference (e.g. LifeFile order
  // id) is unique. Postgres treats NULLs as distinct, so manual rows without a
  // reference are unaffected.
  uniqueIndex("partner_transactions_reference_uniq").on(t.reference),
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
  // `earning` (positive) or `reversal` (negative clawback on a refund/void).
  kind: commissionEntryKindEnum("kind").default("earning").notNull(),
  // Snapshot of the effective rate this entry was computed at (basis points).
  rateBps: integer("rate_bps").notNull(),
  // Positive for earnings, negative for reversals.
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

/**
 * Partner-side CRM relationship record for a company. One row per (org,
 * clinic): the relationship `stage` and free-form `tags` a sales org manages
 * for an account, independent of the clinic's admin verification status. The
 * org and its reps share this record; reps may only edit their own clinics.
 */
export const partnerClinicMeta = pgTable(
  "partner_clinic_meta",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => partnerOrgs.id, { onDelete: "cascade" }),
    clinicId: integer("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    stage: partnerClinicStageEnum("stage").default("active").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("partner_clinic_meta_org_clinic_uniq").on(t.orgId, t.clinicId),
    index("partner_clinic_meta_clinic_idx").on(t.clinicId),
  ],
);

/**
 * Append-only partner activity timeline for a company: notes written by the
 * partner plus logged stage/tag changes. Transactions are merged in at read
 * time from `partner_transactions`; this table holds the human-authored and
 * relationship-management events.
 */
export const partnerClinicActivity = pgTable(
  "partner_clinic_activity",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => partnerOrgs.id, { onDelete: "cascade" }),
    clinicId: integer("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    // The rep who authored it (null for org-owner actions).
    repId: integer("rep_id").references(() => partnerReps.id, {
      onDelete: "set null",
    }),
    actorKind: commissionPayeeEnum("actor_kind").notNull(),
    actorName: varchar("actor_name", { length: 200 }),
    type: partnerClinicActivityTypeEnum("type").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("partner_clinic_activity_clinic_idx").on(t.clinicId, t.createdAt),
  ],
);

/**
 * Recurring sales goal / quota. `repId` null = an org-wide goal; otherwise the
 * target applies to that rep. One goal per (org, rep, metric, period); progress
 * is measured against the current period's attributed actuals.
 */
export const partnerGoals = pgTable(
  "partner_goals",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => partnerOrgs.id, { onDelete: "cascade" }),
    repId: integer("rep_id").references(() => partnerReps.id, {
      onDelete: "cascade",
    }),
    metric: partnerGoalMetricEnum("metric").notNull(),
    period: partnerGoalPeriodEnum("period").notNull(),
    targetCents: integer("target_cents").notNull(),
    createdBy: varchar("created_by", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    // At most one goal per scope + metric + period. `repId` NULL (org goal)
    // is treated as distinct by Postgres, so a partial unique index covers it.
    uniqueIndex("partner_goals_org_rep_metric_period_uniq").on(
      t.orgId,
      t.repId,
      t.metric,
      t.period,
    ),
    index("partner_goals_org_idx").on(t.orgId),
  ],
);

/**
 * Additional users on a partner organization beyond the owner (the owner is
 * `partner_orgs.clerkUserId`). Each member is an invited teammate with a role:
 * `admin` (full management) or `viewer` (read-only). Activates via the same
 * one-time ticket flow as reps.
 */
export const partnerOrgMembers = pgTable(
  "partner_org_members",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => partnerOrgs.id, { onDelete: "cascade" }),
    // Null until the member activates their account.
    clerkUserId: varchar("clerk_user_id", { length: 64 }).unique(),
    name: varchar("name", { length: 200 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    role: partnerOrgMemberRoleEnum("role").default("viewer").notNull(),
    status: partnerStatusEnum("status").default("active").notNull(),
    invitedBy: varchar("invited_by", { length: 64 }),
    invitedAt: timestamp("invited_at").defaultNow().notNull(),
    activatedAt: timestamp("activated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("partner_org_members_org_idx").on(t.orgId),
    uniqueIndex("partner_org_members_org_email_uniq").on(t.orgId, t.email),
  ],
);

/** Who executed a partner agreement: the org owner or one of its reps. */
export const partnerSignerKindEnum = pgEnum("partner_signer_kind", [
  "org",
  "rep",
]);

/**
 * Immutable record of an executed partner Marketing Services Agreement (MSA).
 *
 * One row is written each time an org owner or a rep e-signs. The row snapshots
 * everything needed to reproduce exactly what was agreed to — the document
 * version, a hash of the rendered text, the signer's identity/title, the legal
 * entity, the captured signature image, and request metadata (IP/user-agent).
 * The denormalized `partner_orgs.msa_signed_at` / `partner_reps.msa_signed_at`
 * flags drive the cheap portal gate; this table is the system of record and the
 * "copy on file" surfaced to both the pharmacy (admin) and the partner.
 *
 * Append-only by convention: never updated or deleted. A new MSA version that a
 * partner must re-accept simply writes a new row.
 */
export const partnerAgreements = pgTable("partner_agreements", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => partnerOrgs.id, { onDelete: "cascade" }),
  // Set when a rep signed; null for an org-owner signature.
  repId: integer("rep_id").references(() => partnerReps.id, {
    onDelete: "cascade",
  }),
  signerKind: partnerSignerKindEnum("signer_kind").notNull(),
  // Clerk user id of the person who signed.
  clerkUserId: varchar("clerk_user_id", { length: 64 }).notNull(),
  // Versioned document identity + integrity.
  documentVersion: varchar("document_version", { length: 40 }).notNull(),
  documentTitle: varchar("document_title", { length: 200 }).notNull(),
  // SHA-256 (hex) of the exact rendered agreement text the signer saw.
  documentHash: varchar("document_hash", { length: 64 }).notNull(),
  // Full text snapshot of the agreement as presented at signing.
  documentText: text("document_text").notNull(),
  // Signer-supplied identity captured at signing.
  legalEntityName: varchar("legal_entity_name", { length: 200 }),
  signerName: varchar("signer_name", { length: 200 }).notNull(),
  signerTitle: varchar("signer_title", { length: 120 }),
  signerEmail: varchar("signer_email", { length: 255 }),
  // PNG data URL from the signature pad (the drawn signature).
  signatureImage: text("signature_image").notNull(),
  // Best-effort request context for evidentiary value.
  signedIp: varchar("signed_ip", { length: 64 }),
  signedUserAgent: varchar("signed_user_agent", { length: 400 }),
  signedAt: timestamp("signed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("partner_agreements_org_id_idx").on(t.orgId),
  index("partner_agreements_rep_id_idx").on(t.repId),
  // One executed row per signer per document version (re-signs use a new
  // version). Postgres treats NULL repId as distinct, so org-owner rows
  // (repId NULL) are keyed by (orgId, NULL, version).
  uniqueIndex("partner_agreements_signer_version_uniq").on(
    t.orgId,
    t.repId,
    t.documentVersion,
  ),
]);

/**
 * Lifecycle of a prescription order submitted to LifeFile:
 *   - `submitted`         — row persisted; forward to LifeFile in flight (or
 *     crashed mid-flight; support can retry from the raw request).
 *   - `accepted`          — LifeFile acknowledged the order (`lfOrderId` set).
 *   - `pharmacy_rejected` — LifeFile returned a business error (`type: "error"`).
 *   - `failed`            — transport/config failure before LifeFile accepted.
 */
export const lifefileOrderStatusEnum = pgEnum("lifefile_order_status", [
  "submitted",
  "accepted",
  "pharmacy_rejected",
  "failed",
]);

/**
 * A clinic's saved patients for in-app prescribing. Clinic-scoped: every read
 * and write is filtered by `clinicId` (a clinic can never see another
 * clinic's patients). Allergies/conditions are free-text arrays rendered on
 * the prescription the pharmacy receives.
 */
export const patients = pgTable(
  "patients",
  {
    id: serial("id").primaryKey(),
    clinicId: integer("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    firstName: varchar("first_name", { length: 30 }).notNull(),
    lastName: varchar("last_name", { length: 30 }).notNull(),
    middleName: varchar("middle_name", { length: 20 }),
    // LifeFile gender codes: m | f | a (animal) | u (unknown).
    gender: varchar("gender", { length: 1 }).notNull(),
    // yyyy-mm-dd (kept as text; LifeFile wire format, no TZ ambiguity).
    dateOfBirth: varchar("date_of_birth", { length: 10 }).notNull(),
    address1: varchar("address1", { length: 60 }),
    address2: varchar("address2", { length: 60 }),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 2 }),
    zip: varchar("zip", { length: 10 }),
    phoneHome: varchar("phone_home", { length: 16 }),
    phoneMobile: varchar("phone_mobile", { length: 16 }),
    phoneWork: varchar("phone_work", { length: 16 }),
    email: varchar("email", { length: 100 }),
    allergies: jsonb("allergies").$type<string[]>().default([]).notNull(),
    conditions: jsonb("conditions").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("patients_clinic_id_idx").on(t.clinicId, t.lastName)],
);

/** Prescriber details snapshotted onto an order at submission time. */
export interface OrderPrescriber {
  npi: string;
  firstName: string;
  lastName: string;
  licenseState?: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
}

/** Shipping destination snapshotted onto an order at submission time. */
export interface OrderShipping {
  recipientType: "clinic" | "patient";
  recipientFirstName: string;
  recipientLastName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * A prescription order placed through the LogosRx dashboard and forwarded to
 * LifeFile. Clinic-scoped (hard isolation): every read filters on `clinicId`.
 *
 * Idempotency: `referenceId` (our generated `LGS-...` id) is unique per
 * clinic; retries of the same submission return the stored row instead of
 * double-submitting to the pharmacy.
 *
 * `rawRequest` / `rawResponse` hold the exact LifeFile payloads for support
 * and audit. They are never echoed to the clinic UI.
 */
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    clinicId: integer("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    // Our foreign-system order id (LGS-...). Unique per clinic (idempotency).
    referenceId: varchar("reference_id", { length: 64 }).notNull(),
    // LifeFile's order id, set once accepted.
    lfOrderId: varchar("lf_order_id", { length: 32 }),
    // message.id sent to LifeFile (unique integer; we use the order row id).
    messageId: integer("message_id"),
    status: lifefileOrderStatusEnum("status").default("submitted").notNull(),
    prescriber: jsonb("prescriber").$type<OrderPrescriber>().notNull(),
    shipping: jsonb("shipping").$type<OrderShipping>().notNull(),
    // LifeFile shipping-service code (see src/lib/lifefile/constants.ts).
    serviceId: integer("service_id"),
    // Who pays: "doc" (clinic account, default) or "pat" (patient).
    payorType: varchar("payor_type", { length: 3 }).default("doc").notNull(),
    memo: varchar("memo", { length: 120 }),
    // Short human-readable failure reason (safe to surface to the clinic).
    errorMessage: varchar("error_message", { length: 500 }),
    rawRequest: jsonb("raw_request"),
    rawResponse: jsonb("raw_response"),
    submittedBy: varchar("submitted_by", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("orders_clinic_reference_uniq").on(t.clinicId, t.referenceId),
    index("orders_clinic_created_idx").on(t.clinicId, t.createdAt),
    index("orders_lf_order_id_idx").on(t.lfOrderId),
    index("orders_status_idx").on(t.status),
  ],
);

/**
 * One prescription line on an order. Drug fields are snapshotted from
 * `catalog_products` at submission time so later catalog edits never mutate
 * the record of what was prescribed.
 */
export const orderRxs = pgTable(
  "order_rxs",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    catalogProductId: varchar("catalog_product_id", { length: 120 }),
    lfProductId: integer("lf_product_id").notNull(),
    drugName: varchar("drug_name", { length: 254 }).notNull(),
    drugStrength: varchar("drug_strength", { length: 254 }),
    drugForm: varchar("drug_form", { length: 255 }),
    directions: text("directions").notNull(),
    quantity: varchar("quantity", { length: 45 }),
    quantityUnits: varchar("quantity_units", { length: 45 }),
    daysSupply: integer("days_supply"),
    refills: integer("refills").default(0).notNull(),
    // yyyy-mm-dd.
    dateWritten: varchar("date_written", { length: 10 }).notNull(),
    clinicalDifferenceStatement: text("clinical_difference_statement"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("order_rxs_order_id_idx").on(t.orderId)],
);

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
export type CardUpdateLink = typeof cardUpdateLinks.$inferSelect;
export type NewCardUpdateLink = typeof cardUpdateLinks.$inferInsert;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
export type ClinicPayment = typeof clinicPayments.$inferSelect;
export type NewClinicPayment = typeof clinicPayments.$inferInsert;
export type ClinicSignatures = typeof clinicSignatures.$inferSelect;
export type NewClinicSignatures = typeof clinicSignatures.$inferInsert;
export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
export type FeaturedProduct = typeof featuredProducts.$inferSelect;
export type NewFeaturedProduct = typeof featuredProducts.$inferInsert;
export type PricingQuote = typeof pricingQuotes.$inferSelect;
export type NewPricingQuote = typeof pricingQuotes.$inferInsert;
export type PricingQuoteItem = typeof pricingQuoteItems.$inferSelect;
export type NewPricingQuoteItem = typeof pricingQuoteItems.$inferInsert;
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
export type PartnerClinicMeta = typeof partnerClinicMeta.$inferSelect;
export type NewPartnerClinicMeta = typeof partnerClinicMeta.$inferInsert;
export type PartnerClinicActivity = typeof partnerClinicActivity.$inferSelect;
export type NewPartnerClinicActivity =
  typeof partnerClinicActivity.$inferInsert;
export type PartnerGoal = typeof partnerGoals.$inferSelect;
export type NewPartnerGoal = typeof partnerGoals.$inferInsert;
export type PartnerOrgMember = typeof partnerOrgMembers.$inferSelect;
export type NewPartnerOrgMember = typeof partnerOrgMembers.$inferInsert;
export type PartnerApiKey = typeof partnerApiKeys.$inferSelect;
export type NewPartnerApiKey = typeof partnerApiKeys.$inferInsert;
export type PartnerWebhook = typeof partnerWebhooks.$inferSelect;
export type NewPartnerWebhook = typeof partnerWebhooks.$inferInsert;
export type PartnerWebhookDelivery =
  typeof partnerWebhookDeliveries.$inferSelect;
export type NewPartnerWebhookDelivery =
  typeof partnerWebhookDeliveries.$inferInsert;
export type PartnerAgreement = typeof partnerAgreements.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderRx = typeof orderRxs.$inferSelect;
export type NewOrderRx = typeof orderRxs.$inferInsert;
export type NewPartnerAgreement = typeof partnerAgreements.$inferInsert;
