import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics, clinicPayments } from "@/lib/db/schema";
import {
  initialFormState,
  type OnboardingFormState,
} from "@/lib/onboarding/steps";

export interface ClinicProfile {
  exists: boolean;
  onboardingStep: number;
  onboardingCompleted: boolean;
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
  const [row] = await db
    .select()
    .from(clinics)
    .where(eq(clinics.clerkUserId, clerkUserId))
    .limit(1);

  const [payment] = await db
    .select({ cardLast4: clinicPayments.cardLast4 })
    .from(clinicPayments)
    .where(eq(clinicPayments.clerkUserId, clerkUserId))
    .limit(1);

  const base = initialFormState();
  if (!row) {
    return {
      exists: false,
      onboardingStep: 0,
      onboardingCompleted: false,
      cardLast4: payment?.cardLast4 ?? null,
      state: base,
    };
  }

  const state: OnboardingFormState = {
    ...base,
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
    shippingSignature: row.shippingSignature ?? "",
    providerAgreementAccepted: row.providerAgreementAccepted,
    providerAgreementSignature: row.providerAgreementSignature ?? "",
    paymentAuthAccepted: row.paymentAuthAccepted,
    paymentSignature: row.paymentSignature ?? "",
  };

  return {
    exists: true,
    onboardingStep: row.onboardingStep,
    onboardingCompleted: row.onboardingCompleted,
    cardLast4: payment?.cardLast4 ?? null,
    state,
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
