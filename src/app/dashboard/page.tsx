import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import DashboardEditor from "@/components/dashboard/DashboardEditor";
import { getClinicProfile } from "@/lib/onboarding/data";

export const metadata: Metadata = {
  title: "Your Profile",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard");

  const profile = await getClinicProfile(userId);
  // Gate: incomplete intake must finish onboarding first.
  if (!profile.onboardingCompleted) redirect("/onboarding");

  return (
    <DashboardEditor
      initialState={profile.state}
      cardLast4={profile.cardLast4}
    />
  );
}
