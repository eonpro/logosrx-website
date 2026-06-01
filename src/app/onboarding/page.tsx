import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { getClinicProfile } from "@/lib/onboarding/data";

export const metadata: Metadata = {
  title: "Account Set Up",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { userId } = await auth();

  // Anonymous visitors: this flow creates their account from the intake data.
  if (!userId) {
    return <OnboardingWizard mode="signup" />;
  }

  // Already signed in: finished clinics go straight to their dashboard;
  // otherwise let them finish intake without minting a second account.
  const profile = await getClinicProfile(userId);
  if (profile.onboardingCompleted) redirect("/dashboard");

  return (
    <OnboardingWizard
      mode="authenticated"
      initialState={profile.state}
      initialStep={profile.onboardingStep}
    />
  );
}
