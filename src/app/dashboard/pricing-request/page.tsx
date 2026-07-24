import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import PricingRequestForm from "@/components/dashboard/PricingRequestForm";
import { getClinicGate } from "@/lib/onboarding/data";
import { getClinicStorefrontFor } from "@/lib/portal/storefront";

export const metadata: Metadata = {
  title: "Request custom pricing",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PricingRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard/pricing-request");
  }

  const gate = await getClinicGate(userId);
  if (!gate.onboardingCompleted) redirect("/onboarding");
  if (gate.verificationStatus !== "verified") redirect("/dashboard");

  const { product } = await searchParams;
  const storefront = await getClinicStorefrontFor({
    clinicId: gate.clinicId,
    pricingTier: gate.pricingTier,
    discountPct: gate.discountPct,
  });

  const initialProductIds =
    product && storefront.products.some((p) => p.id === product)
      ? [product]
      : [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="text-sm font-semibold text-navy/50 transition-colors hover:text-navy"
      >
        ← Back to catalog
      </Link>
      <header className="mt-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Request custom pricing
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-navy/55">
          Tell us your expected monthly volume and we&rsquo;ll send your practice
          better pricing.
        </p>
      </header>
      <PricingRequestForm
        products={storefront.products.map((p) => ({
          id: p.id,
          name: p.name,
          strength: p.strength,
        }))}
        initialProductIds={initialProductIds}
      />
    </main>
  );
}
