"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db, type DbTransaction } from "@/lib/db";
import { clinics, clinicPayments, clinicSignatures } from "@/lib/db/schema";
import {
  clerkErrorMessage,
  deriveUsername,
  toE164,
} from "@/lib/auth/clerk-users";
import { encrypt } from "@/lib/onboarding/encryption";
import { stampClinicAttribution } from "@/lib/partners/attribution";
import { applyClaimedQuote } from "@/lib/quotes/apply";
import { notifyNewClinic } from "@/lib/notifications/slack";
import { log } from "@/lib/observability/logger";
import { runAfterResponse } from "@/lib/runtime/after";
import {
  clientKeyFromHeaders,
  rateLimitKey,
} from "@/lib/security/rate-limit";
import {
  STEP_IDS,
  validateStep,
  type OnboardingFormState,
} from "@/lib/onboarding/steps";

type OrderVolume = "0_5000" | "5000_15000" | "15000_50000" | "50000_plus";
type ShippingMethod = "direct_to_patient" | "ship_to_practice";

const ORDER_VOLUMES = new Set([
  "0_5000",
  "5000_15000",
  "15000_50000",
  "50000_plus",
]);
const SHIPPING_METHODS = new Set(["direct_to_patient", "ship_to_practice"]);

export interface ActionResult {
  ok: boolean;
  error?: string;
  /** Non-fatal problem the user should know about (e.g. quote not applied). */
  warning?: string;
}

export interface CreateAccountResult extends ActionResult {
  /** Short-lived Clerk sign-in ticket used to establish the session client-side. */
  ticket?: string;
}

const MIN_PASSWORD_LENGTH = 8;

const QUOTE_APPLY_WARNING =
  "Your account was created, but the pricing quote you accepted could not be applied — it may have already been claimed. Please contact us so we can honor your quoted pricing.";

const PRODUCT_LABELS: Record<string, string> = {
  weight_loss: "Weight Loss",
  peptides: "Peptides",
  hormone_replacement: "Hormone Replacement",
  other: "Other",
};

/** Builds the admin Slack notification payload from the intake state. */
function toClinicNotification(s: OnboardingFormState) {
  return {
    clinicName: s.clinicName.trim() || s.practiceLegalName.trim(),
    contactName: s.contactName.trim(),
    contactEmail: s.contactEmail.trim().toLowerCase(),
    contactPhone: s.contactPhone.trim(),
    practiceType: s.practiceType.replace(/_/g, " "),
    products: s.productsOfInterest.map((p) => PRODUCT_LABELS[p] ?? p),
    orderVolume: s.orderVolume,
    providerCount: s.providers.length,
    state: s.providers[0]?.licenseState ?? "",
  };
}

/** Maps the in-memory wizard state to the `clinics` row columns. */
function toClinicColumns(s: OnboardingFormState) {
  return {
    productsOfInterest: s.productsOfInterest,
    orderVolume: ORDER_VOLUMES.has(s.orderVolume)
      ? (s.orderVolume as OrderVolume)
      : null,
    referralSource: s.referralSource || null,
    clinicName: s.clinicName.trim() || null,
    practiceLegalName: s.practiceLegalName.trim() || null,
    practiceDba: s.practiceDba.trim() || null,
    ein: s.ein.trim() || null,
    practiceType: s.practiceType || null,
    addressLine1: s.addressLine1.trim() || null,
    addressSuite: s.addressSuite.trim() || null,
    practicePhone: s.practicePhone.trim() || null,
    website: s.website.trim() || null,
    contactName: s.contactName.trim() || null,
    contactPhone: s.contactPhone.trim() || null,
    contactEmail: s.contactEmail.trim().toLowerCase() || null,
    privacyAccepted: s.privacyAccepted,
    providers: s.providers,
    shippingMethod: SHIPPING_METHODS.has(s.shippingMethod)
      ? (s.shippingMethod as ShippingMethod)
      : null,
    signatureRequired: s.signatureRequired,
    shippingDisclosureAccepted: s.shippingDisclosureAccepted,
    providerAgreementAccepted: s.providerAgreementAccepted,
    paymentAuthAccepted: s.paymentAuthAccepted,
  };
}

async function upsertClinic(
  tx: DbTransaction,
  clerkUserId: string,
  s: OnboardingFormState,
  extra: { onboardingStep?: number; onboardingCompleted?: boolean },
) {
  const columns = toClinicColumns(s);
  const now = new Date();
  await tx
    .insert(clinics)
    .values({
      clerkUserId,
      ...columns,
      ...extra,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: clinics.clerkUserId,
      set: { ...columns, ...extra, updatedAt: now },
    });
}

/**
 * Persists the signature blobs (base64 data-URL text from the signature pad) to
 * the isolated `clinic_signatures` table. Kept out of `clinics` so the common
 * clinic read paths never pull these large values incidentally.
 */
async function upsertSignatures(
  tx: DbTransaction,
  clerkUserId: string,
  s: OnboardingFormState,
) {
  const cols = {
    shippingSignature: s.shippingSignature || null,
    providerAgreementSignature: s.providerAgreementSignature || null,
    paymentSignature: s.paymentSignature || null,
  };
  const now = new Date();
  await tx
    .insert(clinicSignatures)
    .values({ clerkUserId, ...cols, updatedAt: now })
    .onConflictDoUpdate({
      target: clinicSignatures.clerkUserId,
      set: { ...cols, updatedAt: now },
    });
}

const MIN_CARD_DIGITS = 13;

/**
 * Persists card details to the isolated `clinic_payments` table. Sensitive
 * values are AES-256-GCM encrypted.
 *
 * Behavior depends on what was entered:
 * - New card number (>= 13 digits): full upsert. The CVV is only overwritten
 *   when one was entered, so replacing metadata never silently wipes it.
 * - No / partial card number: metadata-only UPDATE of the existing row
 *   (cardholder, type, expiration, billing). The stored card + CVV are kept —
 *   the dashboard's "leave blank to keep current" contract.
 */
async function upsertPayment(
  tx: DbTransaction,
  clerkUserId: string,
  s: OnboardingFormState,
) {
  const number = s.payment.cardNumber.replace(/\s/g, "");
  const now = new Date();
  const metadata = {
    cardholderName: s.payment.cardholderName.trim() || null,
    cardType: s.payment.cardType || null,
    expiration: s.payment.expiration.trim() || null,
    billingAddress: s.payment.billingAddress.trim() || null,
    billingZip: s.payment.billingZip.trim() || null,
    updatedAt: now,
  };

  if (number.length < MIN_CARD_DIGITS) {
    // No (valid) new card entered: update metadata on the existing row only.
    // Never insert — a payment row without a card number is meaningless.
    await tx
      .update(clinicPayments)
      .set(metadata)
      .where(eq(clinicPayments.clerkUserId, clerkUserId));
    return;
  }

  const cvv = s.payment.cvv.trim();
  const values = {
    clerkUserId,
    ...metadata,
    cardNumberEnc: encrypt(number),
    cardLast4: number.slice(-4),
    // Only overwrite the stored CVV when one was entered.
    ...(cvv ? { cvvEnc: encrypt(cvv) } : {}),
  };
  const { clerkUserId: _target, ...set } = values;
  void _target;
  await tx
    .insert(clinicPayments)
    .values(values)
    .onConflictDoUpdate({ target: clinicPayments.clerkUserId, set });
}

/**
 * Autosaves wizard progress. `stepIndex` is the highest step the user has
 * reached. Always re-checks Clerk auth (never trust the client).
 */
export async function saveProgress(
  state: OnboardingFormState,
  stepIndex: number,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  try {
    const step = Math.max(0, Math.min(stepIndex, STEP_IDS.length - 1));
    // One transaction so the profile + payment + signatures commit together;
    // a partial write would leave an inconsistent intake.
    await db.transaction(async (tx) => {
      await upsertClinic(tx, userId, state, { onboardingStep: step });
      await upsertPayment(tx, userId, state);
      await upsertSignatures(tx, userId, state);
    });
    return { ok: true };
  } catch (err) {
    log.error("onboarding saveProgress failed", { error: err });
    return { ok: false, error: "Could not save your progress." };
  }
}

/**
 * Final submission. Server-side validates every step before marking the
 * intake complete, so a tampered client cannot skip required fields.
 */
export async function completeOnboarding(
  state: OnboardingFormState,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  for (const id of STEP_IDS) {
    const err = validateStep(id, state);
    if (err) return { ok: false, error: err };
  }

  try {
    await db.transaction(async (tx) => {
      await upsertClinic(tx, userId, state, {
        onboardingStep: STEP_IDS.length - 1,
        onboardingCompleted: true,
      });
      await upsertPayment(tx, userId, state);
      await upsertSignatures(tx, userId, state);
    });
    // Partner referral attribution (from the /join/<code> cookie, if any).
    // Best-effort by design; runs after the profile write so the row exists.
    await stampClinicAttribution(userId);
    // Apply an accepted custom pricing quote (from the `quote_claim` cookie),
    // if this clinic reached onboarding by accepting one. Never blocks
    // completion, but the user is told when their quote could not be applied.
    const quoteResult = await applyClaimedQuote(userId);
    // Admin Slack ping is non-critical: don't make the clinic wait on it.
    runAfterResponse(notifyNewClinic(toClinicNotification(state)));
    return {
      ok: true,
      warning: quoteResult === "failed" ? QUOTE_APPLY_WARNING : undefined,
    };
  } catch (err) {
    log.error("onboarding completeOnboarding failed", { error: err });
    return { ok: false, error: "Could not submit your application." };
  }
}

/**
 * Public account-creation submission. Anonymous visitors complete the entire
 * intake at `/onboarding`; on submit we use the collected info to create their
 * Clerk account, persist the clinic profile, and return a short-lived sign-in
 * ticket so the client can establish the session and land on the dashboard.
 *
 * Server-side validates every step (a tampered client cannot skip fields) and
 * is rate-limited by caller IP to blunt automated abuse.
 */
export async function createAccountAndComplete(
  state: OnboardingFormState,
  password: string,
): Promise<CreateAccountResult> {
  // Reject anyone already signed in — they have an account; route them to the
  // authenticated completion flow instead of minting a second one.
  const { userId: existingUserId } = await auth();
  if (existingUserId) {
    return {
      ok: false,
      error: "You're already signed in. Continue from your dashboard.",
    };
  }

  const requestHeaders = await headers();
  try {
    const limit = await rateLimitKey(
      "form",
      `onboarding-signup:${clientKeyFromHeaders(requestHeaders)}`,
    );
    if (!limit.success) {
      return {
        ok: false,
        error: "Too many attempts. Please wait a minute and try again.",
      };
    }
  } catch (err) {
    // Fail open: never let a rate-limiter backend issue block account creation.
    log.warn("onboarding rate-limit check failed; allowing request", {
      error: err instanceof Error ? err.message : "unknown",
    });
  }

  // The full first + last contact name is only demanded here: this is the one
  // path that creates the Clerk account (which requires a last name) from it.
  for (const id of STEP_IDS) {
    const err = validateStep(id, state, { requireFullContactName: true });
    if (err) return { ok: false, error: err };
  }

  const email = state.contactEmail.trim().toLowerCase();
  if (!email) return { ok: false, error: "A contact email is required." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  const [firstName, ...rest] = state.contactName.trim().split(/\s+/);
  // The Clerk instance requires a last name on every user. Step validation
  // demands a two-part contact name, but fall back to repeating the first
  // name so a single-word name can never fail account creation with Clerk's
  // raw "data doesn't match user requirements" error.
  const lastName = rest.join(" ") || firstName;

  const client = await clerkClient();

  // 1. Create the Clerk account from the intake data.
  let newUserId: string;
  try {
    const phoneNumber = toE164(state.contactPhone);
    const user = await client.users.createUser({
      emailAddress: [email],
      // Some Clerk instances require username/phone on every user. We supply a
      // derived username and the contact phone so creation succeeds; clinics
      // still sign in with email + password.
      username: deriveUsername(email, "clinic"),
      phoneNumber: phoneNumber ? [phoneNumber] : undefined,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      skipLegalChecks: true,
    });
    newUserId = user.id;
  } catch (err) {
    const detail =
      err && typeof err === "object" && "errors" in err
        ? JSON.stringify(
            (err as { errors?: unknown }).errors ?? err,
          )
        : String(err);
    log.error("onboarding createUser failed", { error: err, detail });
    return {
      ok: false,
      error: clerkErrorMessage(err, "Could not create your account."),
    };
  }

  // 2. Persist the profile. If this fails, roll back the orphaned Clerk user so
  //    the visitor can retry cleanly.
  try {
    await db.transaction(async (tx) => {
      await upsertClinic(tx, newUserId, state, {
        onboardingStep: STEP_IDS.length - 1,
        onboardingCompleted: true,
      });
      await upsertPayment(tx, newUserId, state);
      await upsertSignatures(tx, newUserId, state);
    });
  } catch (err) {
    log.error("onboarding profile persist failed; rolling back user", {
      error: err,
    });
    try {
      await client.users.deleteUser(newUserId);
    } catch (rollbackErr) {
      log.error("onboarding rollback deleteUser failed", {
        error: rollbackErr,
      });
    }
    return {
      ok: false,
      error: "Could not save your application. Please try again.",
    };
  }

  // Partner referral attribution (from the /join/<code> cookie, if any).
  await stampClinicAttribution(newUserId);
  // Apply an accepted custom pricing quote (from the `quote_claim` cookie), if
  // this visitor reached onboarding by accepting one. Never blocks account
  // creation, but the user is told when their quote could not be applied.
  const quoteResult = await applyClaimedQuote(newUserId);
  const warning =
    quoteResult === "failed" ? QUOTE_APPLY_WARNING : undefined;

  // Notify admins (resilient: never throws / never blocks the response).
  runAfterResponse(notifyNewClinic(toClinicNotification(state)));

  // 3. Mint a one-time sign-in ticket for immediate, password-less session setup.
  try {
    const token = await client.signInTokens.createSignInToken({
      userId: newUserId,
      expiresInSeconds: 600,
    });
    return { ok: true, ticket: token.token, warning };
  } catch (err) {
    // Account + profile exist; the client can fall back to /sign-in.
    log.warn("onboarding createSignInToken failed", {
      error: err instanceof Error ? err.message : "unknown",
    });
    return { ok: true, warning };
  }
}

/**
 * Dashboard-specific payment validation: an empty card number means "keep the
 * card on file" (unlike the wizard, where a card is required), but a partial
 * card or a new card without its CVV is rejected.
 */
function validateDashboardPayment(s: OnboardingFormState): string | null {
  const number = s.payment.cardNumber.replace(/\s/g, "");
  if (!number) return null;
  if (number.length < MIN_CARD_DIGITS) return "Enter a valid card number.";
  if (!s.payment.cvv.trim())
    return "Enter the CVV for your new card.";
  return null;
}

/** Saves profile edits from the dashboard (no completion-state change). */
export async function updateClinicProfile(
  state: OnboardingFormState,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  // Server-side validation mirrors the wizard so a completed profile can't be
  // degraded below the intake requirements. The payment step is special-cased:
  // dashboard edits may keep the existing card instead of re-entering it.
  for (const id of STEP_IDS) {
    const err =
      id === "payment"
        ? validateDashboardPayment(state)
        : validateStep(id, state);
    if (err) return { ok: false, error: err };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(clinics)
        .set({ ...toClinicColumns(state), updatedAt: new Date() })
        .where(eq(clinics.clerkUserId, userId));
      await upsertPayment(tx, userId, state);
      await upsertSignatures(tx, userId, state);
    });
    return { ok: true };
  } catch (err) {
    log.error("onboarding updateClinicProfile failed", { error: err });
    return { ok: false, error: "Could not save your changes." };
  }
}
