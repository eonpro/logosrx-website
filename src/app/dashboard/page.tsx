import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Storefront from "@/components/dashboard/Storefront";
import VerificationBanner from "@/components/dashboard/VerificationBanner";
import { getClinicGate } from "@/lib/onboarding/data";
import { getClinicStorefrontFor } from "@/lib/portal/storefront";
import {
  getActivePromotions,
  getFeaturedProductIds,
} from "@/lib/portal/merchandising";
import { getPrimaryEmail, roleForEmail } from "@/lib/auth/admin";
import { getPartnerContext } from "@/lib/auth/partner";
import { getOrderableProductIds } from "@/lib/orders/products";
import { btnSecondary } from "@/components/ui/portal";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Storefront",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard");

  const gate = await getClinicGate(userId);
  // Gate: incomplete intake must finish onboarding first. Allowlisted admins
  // and affiliate partners don't have a clinic profile — never trap them in the
  // clinic account-setup wizard; route them to their own surface instead.
  if (!gate.onboardingCompleted) {
    const email = await getPrimaryEmail(userId, sessionClaims);
    if (roleForEmail(email)) redirect("/admin");
    if (await getPartnerContext()) redirect("/partners");
    redirect("/onboarding");
  }

  // Pricing + storefront are reserved for verified clinics. Pending/rejected
  // accounts see their status and a prompt to review their details.
  if (gate.verificationStatus !== "verified") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Storefront
        </h1>
        <p className="mb-6 text-[15px] leading-relaxed text-navy/55">
          Your catalog and pricing unlock once your account is approved.
        </p>
        <VerificationBanner status={gate.verificationStatus} />
        <div className="rounded-3xl border border-dashed border-beige-dark bg-white px-6 py-16 text-center">
          <p className="mx-auto max-w-md text-sm text-navy/60">
            We&rsquo;re reviewing your account. You&rsquo;ll get full access to
            product pricing and prescribing as soon as you&rsquo;re verified.
          </p>
          <Link href="/dashboard/account" className={`mt-5 ${btnSecondary}`}>
            Review your account details
          </Link>
        </div>
      </main>
    );
  }

  const storefront = await getClinicStorefrontFor({
    clinicId: gate.clinicId,
    pricingTier: gate.pricingTier,
    discountPct: gate.discountPct,
  });
  // Merchandising is supplementary — never let it take down the clinic's main
  // page (e.g. before the merchandising tables are migrated). Degrade to empty.
  const [promotions, featuredIds, orderableIds] = await Promise.all([
    getActivePromotions(storefront.pricingTier).catch(() => []),
    getFeaturedProductIds().catch(() => []),
    // In-app ordering is additive — degrade to the LifeFile hand-off.
    gate.orderingEnabled
      ? getOrderableProductIds().catch(() => new Set<string>())
      : Promise.resolve(new Set<string>()),
  ]);

  return (
    <Storefront
      products={storefront.products}
      discountPct={storefront.discountPct}
      pricingTier={storefront.pricingTier}
      promotions={promotions}
      featuredIds={featuredIds}
      lifefileUrl={SITE.lifefilePortal}
      orderableIds={[...orderableIds]}
    />
  );
}
