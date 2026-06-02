import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Storefront from "@/components/dashboard/Storefront";
import VerificationBanner from "@/components/dashboard/VerificationBanner";
import { getClinicProfile } from "@/lib/onboarding/data";
import { getClinicStorefront } from "@/lib/portal/storefront";
import {
  getActivePromotions,
  getFeaturedProductIds,
} from "@/lib/portal/merchandising";
import { getPrimaryEmail, roleForEmail } from "@/lib/auth/admin";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Storefront",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard");

  const profile = await getClinicProfile(userId);
  // Gate: incomplete intake must finish onboarding first. Allowlisted admins
  // don't have a clinic profile — never trap them in the clinic account-setup
  // wizard; route them to the admin console instead.
  if (!profile.onboardingCompleted) {
    const email = await getPrimaryEmail(userId);
    if (roleForEmail(email)) redirect("/admin");
    redirect("/onboarding");
  }

  // Pricing + storefront are reserved for verified clinics. Pending/rejected
  // accounts see their status and a prompt to review their details.
  if (profile.verificationStatus !== "verified") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-bold text-navy">Storefront</h1>
        <p className="mb-6 text-sm text-navy/60">
          Your catalog and pricing unlock once your account is approved.
        </p>
        <VerificationBanner status={profile.verificationStatus} />
        <div className="rounded-2xl border border-dashed border-beige-dark bg-white px-6 py-16 text-center">
          <p className="mx-auto max-w-md text-sm text-navy/60">
            We&rsquo;re reviewing your account. You&rsquo;ll get full access to
            product pricing and prescribing as soon as you&rsquo;re verified.
          </p>
          <Link
            href="/dashboard/account"
            className="mt-5 inline-flex rounded-full border border-navy/20 px-5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
          >
            Review your account details
          </Link>
        </div>
      </main>
    );
  }

  const storefront = await getClinicStorefront(userId);
  // Merchandising is supplementary — never let it take down the clinic's main
  // page (e.g. before the merchandising tables are migrated). Degrade to empty.
  const [promotions, featuredIds] = await Promise.all([
    getActivePromotions(storefront.pricingTier).catch(() => []),
    getFeaturedProductIds().catch(() => []),
  ]);

  return (
    <Storefront
      products={storefront.products}
      discountPct={storefront.discountPct}
      pricingTier={storefront.pricingTier}
      promotions={promotions}
      featuredIds={featuredIds}
      lifefileUrl={SITE.lifefilePortal}
    />
  );
}
