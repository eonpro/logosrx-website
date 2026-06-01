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
  if (!userId) redirect("/sign-in?redirect_url=/onboarding");

  const profile = await getClinicProfile(userId);
  if (profile.onboardingCompleted) redirect("/dashboard");

  return (
    <OnboardingWizard
      initialState={profile.state}
      initialStep={profile.onboardingStep}
    />
  );
}
