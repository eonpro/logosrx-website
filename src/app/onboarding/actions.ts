"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics, clinicPayments } from "@/lib/db/schema";
import { encrypt } from "@/lib/onboarding/encryption";
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
}

export interface CreateAccountResult extends ActionResult {
  /** Short-lived Clerk sign-in ticket used to establish the session client-side. */
  ticket?: string;
}

const MIN_PASSWORD_LENGTH = 8;

/** Extracts a user-facing message from a Clerk Backend API error. */
function clerkErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (
      err as {
        errors?: Array<{ code?: string; message?: string; longMessage?: string }>;
      }
    ).errors;
    const first = errors?.[0];
    if (first) {
      if (first.code === "form_identifier_exists") {
        return "An account with this email already exists. Please sign in instead.";
      }
      return first.longMessage || first.message || "Could not create your account.";
    }
  }
  return "Could not create your account.";
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
    shippingSignature: s.shippingSignature || null,
    providerAgreementAccepted: s.providerAgreementAccepted,
    providerAgreementSignature: s.providerAgreementSignature || null,
    paymentAuthAccepted: s.paymentAuthAccepted,
    paymentSignature: s.paymentSignature || null,
  };
}

async function upsertClinic(
  clerkUserId: string,
  s: OnboardingFormState,
  extra: { onboardingStep?: number; onboardingCompleted?: boolean },
) {
  const columns = toClinicColumns(s);
  const now = new Date();
  await db
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
 * Persists card details to the isolated `clinic_payments` table. Sensitive
 * values are AES-256-GCM encrypted. Skips writing when no card number was
 * entered (e.g. editing other fields later without re-entering the card).
 */
async function upsertPayment(clerkUserId: string, s: OnboardingFormState) {
  const number = s.payment.cardNumber.replace(/\s/g, "");
  if (!number) return;
  const now = new Date();
  const values = {
    clerkUserId,
    cardholderName: s.payment.cardholderName.trim() || null,
    cardNumberEnc: encrypt(number),
    cardLast4: number.slice(-4),
    cardType: s.payment.cardType || null,
    expiration: s.payment.expiration.trim() || null,
    cvvEnc: encrypt(s.payment.cvv.trim()),
    billingAddress: s.payment.billingAddress.trim() || null,
    billingZip: s.payment.billingZip.trim() || null,
    updatedAt: now,
  };
  await db
    .insert(clinicPayments)
    .values(values)
    .onConflictDoUpdate({ target: clinicPayments.clerkUserId, set: values });
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
    await upsertClinic(userId, state, { onboardingStep: step });
    await upsertPayment(userId, state);
    return { ok: true };
  } catch {
    console.error("[onboarding] saveProgress failed");
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
    await upsertClinic(userId, state, {
      onboardingStep: STEP_IDS.length - 1,
      onboardingCompleted: true,
    });
    await upsertPayment(userId, state);
    return { ok: true };
  } catch {
    console.error("[onboarding] completeOnboarding failed");
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

  for (const id of STEP_IDS) {
    const err = validateStep(id, state);
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
  const lastName = rest.join(" ");

  const client = await clerkClient();

  // 1. Create the Clerk account from the intake data.
  let newUserId: string;
  try {
    const user = await client.users.createUser({
      emailAddress: [email],
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      skipLegalChecks: true,
    });
    newUserId = user.id;
  } catch (err) {
    console.error("[onboarding] createUser failed");
    return { ok: false, error: clerkErrorMessage(err) };
  }

  // 2. Persist the profile. If this fails, roll back the orphaned Clerk user so
  //    the visitor can retry cleanly.
  try {
    await upsertClinic(newUserId, state, {
      onboardingStep: STEP_IDS.length - 1,
      onboardingCompleted: true,
    });
    await upsertPayment(newUserId, state);
  } catch {
    console.error("[onboarding] profile persist failed; rolling back user");
    try {
      await client.users.deleteUser(newUserId);
    } catch {
      console.error("[onboarding] rollback deleteUser failed");
    }
    return {
      ok: false,
      error: "Could not save your application. Please try again.",
    };
  }

  // 3. Mint a one-time sign-in ticket for immediate, password-less session setup.
  try {
    const token = await client.signInTokens.createSignInToken({
      userId: newUserId,
      expiresInSeconds: 600,
    });
    return { ok: true, ticket: token.token };
  } catch {
    // Account + profile exist; the client can fall back to /sign-in.
    console.error("[onboarding] createSignInToken failed");
    return { ok: true };
  }
}

/** Saves profile edits from the dashboard (no completion-state change). */
export async function updateClinicProfile(
  state: OnboardingFormState,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  try {
    await db
      .update(clinics)
      .set({ ...toClinicColumns(state), updatedAt: new Date() })
      .where(eq(clinics.clerkUserId, userId));
    await upsertPayment(userId, state);
    return { ok: true };
  } catch {
    console.error("[onboarding] updateClinicProfile failed");
    return { ok: false, error: "Could not save your changes." };
  }
}
