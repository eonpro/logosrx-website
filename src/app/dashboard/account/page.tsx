import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import DashboardEditor from "@/components/dashboard/DashboardEditor";
import { getClinicProfile } from "@/lib/onboarding/data";
import { getPrimaryEmail, roleForEmail } from "@/lib/auth/admin";
import { getPartnerContext } from "@/lib/auth/partner";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/account");

  const profile = await getClinicProfile(userId);
  // Gate: incomplete intake must finish onboarding first. Allowlisted admins
  // and affiliate partners have no clinic profile — route them to their own
  // surface instead of pushing them into the clinic intake wizard.
  if (!profile.onboardingCompleted) {
    const email = await getPrimaryEmail(userId, sessionClaims);
    if (roleForEmail(email)) redirect("/admin");
    if (await getPartnerContext()) redirect("/partners");
    redirect("/onboarding");
  }

  return (
    <DashboardEditor
      initialState={profile.state}
      cardLast4={profile.cardLast4}
      verificationStatus={profile.verificationStatus}
    />
  );
}
