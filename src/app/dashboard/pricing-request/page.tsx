import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import PricingRequestForm from "@/components/dashboard/PricingRequestForm";
import PricingRequestHistory from "@/components/dashboard/PricingRequestHistory";
import { getClinicGate } from "@/lib/onboarding/data";
import { getClinicStorefrontFor } from "@/lib/portal/storefront";
import { listPricingRequestsForClinic } from "@/lib/pricing-requests/data";

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
  if (gate.clinicId === null) redirect("/dashboard");

  const { product } = await searchParams;
  const [storefront, history] = await Promise.all([
    getClinicStorefrontFor({
      clinicId: gate.clinicId,
      pricingTier: gate.pricingTier,
      discountPct: gate.discountPct,
    }),
    listPricingRequestsForClinic(gate.clinicId),
  ]);

  const initialProductIds =
    product && storefront.products.some((p) => p.id === product)
      ? [product]
      : [];

  const productNames: Record<string, string> = {};
  for (const p of storefront.products) productNames[p.id] = p.name;

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
          better pricing. Track prior requests below.
        </p>
      </header>

      <PricingRequestHistory
        requests={history}
        productNames={productNames}
      />

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
