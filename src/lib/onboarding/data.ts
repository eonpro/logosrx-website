import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics, clinicPayments, clinicSignatures } from "@/lib/db/schema";
import { timed } from "@/lib/observability/timing";
import {
  initialFormState,
  type OnboardingFormState,
} from "@/lib/onboarding/steps";

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface ClinicProfile {
  exists: boolean;
  onboardingStep: number;
  onboardingCompleted: boolean;
  /** Admin review state for the completed intake. */
  verificationStatus: VerificationStatus;
  /** Last 4 of the card on file, if any (full number is never returned). */
  cardLast4: string | null;
  state: OnboardingFormState;
}

/**
 * Loads the clinic profile for a Clerk user into the wizard/dashboard form
 * shape. Sensitive card fields are intentionally NOT decrypted or returned --
 * only the last 4 digits, for display. Returns a blank profile if none exists.
 */
export async function getClinicProfile(
  clerkUserId: string,
): Promise<ClinicProfile> {
  // Independent reads — issue them together rather than in series.
  const [[row], [payment], [sig]] = await timed("clinic.profile", () =>
    Promise.all([
      db
        .select()
        .from(clinics)
        .where(eq(clinics.clerkUserId, clerkUserId))
        .limit(1),
      db
        .select({
          cardLast4: clinicPayments.cardLast4,
          // Non-sensitive metadata is hydrated into the form so dashboard
          // edits don't silently drop it. Card number + CVV stay server-only.
          cardholderName: clinicPayments.cardholderName,
          cardType: clinicPayments.cardType,
          expiration: clinicPayments.expiration,
          billingAddress: clinicPayments.billingAddress,
          billingZip: clinicPayments.billingZip,
        })
        .from(clinicPayments)
        .where(eq(clinicPayments.clerkUserId, clerkUserId))
        .limit(1),
      // Signatures live in their own isolated table; pulled only here where the
      // wizard/account editor actually need them.
      db
        .select({
          shippingSignature: clinicSignatures.shippingSignature,
          providerAgreementSignature:
            clinicSignatures.providerAgreementSignature,
          paymentSignature: clinicSignatures.paymentSignature,
        })
        .from(clinicSignatures)
        .where(eq(clinicSignatures.clerkUserId, clerkUserId))
        .limit(1),
    ]),
  );

  const base = initialFormState();
  if (!row) {
    return {
      exists: false,
      onboardingStep: 0,
      onboardingCompleted: false,
      verificationStatus: "pending",
      cardLast4: payment?.cardLast4 ?? null,
      state: base,
    };
  }

  const state: OnboardingFormState = {
    ...base,
    payment: {
      ...base.payment,
      cardholderName: payment?.cardholderName ?? "",
      cardType: payment?.cardType ?? "",
      expiration: payment?.expiration ?? "",
      billingAddress: payment?.billingAddress ?? "",
      billingZip: payment?.billingZip ?? "",
    },
    productsOfInterest: row.productsOfInterest ?? [],
    orderVolume: row.orderVolume ?? "",
    referralSource: row.referralSource ?? "",
    clinicName: row.clinicName ?? "",
    practiceLegalName: row.practiceLegalName ?? "",
    practiceDba: row.practiceDba ?? "",
    ein: row.ein ?? "",
    practiceType: row.practiceType ?? "",
    addressLine1: row.addressLine1 ?? "",
    addressSuite: row.addressSuite ?? "",
    practicePhone: row.practicePhone ?? "",
    website: row.website ?? "",
    contactName: row.contactName ?? "",
    contactPhone: row.contactPhone ?? "",
    contactEmail: row.contactEmail ?? "",
    privacyAccepted: row.privacyAccepted,
    providers: row.providers?.length ? row.providers : base.providers,
    shippingMethod: row.shippingMethod ?? "",
    signatureRequired: row.signatureRequired,
    shippingDisclosureAccepted: row.shippingDisclosureAccepted,
    shippingSignature: sig?.shippingSignature ?? "",
    providerAgreementAccepted: row.providerAgreementAccepted,
    providerAgreementSignature: sig?.providerAgreementSignature ?? "",
    paymentAuthAccepted: row.paymentAuthAccepted,
    paymentSignature: sig?.paymentSignature ?? "",
  };

  return {
    exists: true,
    onboardingStep: row.onboardingStep,
    onboardingCompleted: row.onboardingCompleted,
    verificationStatus: row.verificationStatus,
    cardLast4: payment?.cardLast4 ?? null,
    state,
  };
}

/**
 * Lightweight gate read for the hot authed paths (`/catalog`, `/dashboard`).
 *
 * Unlike `getClinicProfile`, this selects only the columns needed to make the
 * access decision plus the clinic's pricing inputs. Crucially it never joins the
 * isolated `clinic_signatures` table or pulls the `providers` JSONB, so the gate
 * query stays small on every request. Callers that also render the storefront
 * can hand `clinicId`/`pricingTier`/`discountPct` straight to
 * `getClinicStorefrontFor` to avoid re-querying the same row.
 */
export interface ClinicGate {
  /** Row id, or null when the user has no clinic profile yet. */
  clinicId: number | null;
  onboardingCompleted: boolean;
  verificationStatus: VerificationStatus;
  pricingTier: "standard" | "preferred" | "vip";
  discountPct: number;
  /** True when the clinic can place prescription orders in-app. */
  orderingEnabled: boolean;
}

export async function getClinicGate(clerkUserId: string): Promise<ClinicGate> {
  const [row] = await timed("clinic.gate", () =>
    db
      .select({
        id: clinics.id,
        onboardingCompleted: clinics.onboardingCompleted,
        verificationStatus: clinics.verificationStatus,
        pricingTier: clinics.pricingTier,
        pricingDiscountPct: clinics.pricingDiscountPct,
        lifefileOrderingEnabled: clinics.lifefileOrderingEnabled,
      })
      .from(clinics)
      .where(eq(clinics.clerkUserId, clerkUserId))
      .limit(1),
  );

  if (!row) {
    return {
      clinicId: null,
      onboardingCompleted: false,
      verificationStatus: "pending",
      pricingTier: "standard",
      discountPct: 0,
      orderingEnabled: false,
    };
  }

  return {
    clinicId: row.id,
    onboardingCompleted: row.onboardingCompleted,
    verificationStatus: row.verificationStatus,
    pricingTier: row.pricingTier,
    discountPct: row.pricingDiscountPct,
    orderingEnabled: row.lifefileOrderingEnabled,
  };
}

/** True when the user has finished the intake. Used to gate `/dashboard`. */
export async function hasCompletedOnboarding(
  clerkUserId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ done: clinics.onboardingCompleted })
    .from(clinics)
    .where(eq(clinics.clerkUserId, clerkUserId))
    .limit(1);
  return row?.done ?? false;
}
