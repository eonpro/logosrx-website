import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { getClinicProfile } from "@/lib/onboarding/data";
import { getPartnerContext } from "@/lib/auth/partner";
import { getPrimaryEmail, roleForEmail } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Account Set Up",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { userId, sessionClaims } = await auth();

  // Anonymous visitors: this flow creates their account from the intake data.
  if (!userId) {
    return <OnboardingWizard mode="signup" />;
  }

  // Allowlisted admins and affiliate partners have their own surfaces and no
  // clinic profile — this clinic intake wizard isn't for them. Bounce them
  // instead of trapping them in the questionnaire (e.g. when they reach here
  // via the shared sign-up/sign-in fallbacks or /dashboard/account).
  const email = await getPrimaryEmail(userId, sessionClaims);
  if (roleForEmail(email)) redirect("/admin");
  if (await getPartnerContext()) redirect("/partners");

  // Already signed in: finished clinics go straight to their dashboard;
  // otherwise let them finish intake without minting a second account.
  const profile = await getClinicProfile(userId);
  if (profile.onboardingCompleted) redirect("/dashboard");

  // Pre-fill the contact email with the login email so the profile email and
  // the Clerk sign-in email stay aligned unless deliberately changed.
  if (email && !profile.state.contactEmail) {
    profile.state.contactEmail = email;
  }

  return (
    <OnboardingWizard
      mode="authenticated"
      initialState={profile.state}
      initialStep={profile.onboardingStep}
    />
  );
}
