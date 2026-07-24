import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import PortalProductDetail from "@/components/dashboard/PortalProductDetail";
import { getProductBySlug } from "@/data/products";
import { getClinicGate } from "@/lib/onboarding/data";
import { getClinicStorefrontFor } from "@/lib/portal/storefront";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: decodeURIComponent(id),
    robots: { index: false, follow: false },
  };
}

export default async function DashboardProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard");

  const gate = await getClinicGate(userId);
  if (!gate.onboardingCompleted) redirect("/onboarding");
  if (gate.verificationStatus !== "verified") redirect("/dashboard");

  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  const storefront = await getClinicStorefrontFor({
    clinicId: gate.clinicId,
    pricingTier: gate.pricingTier,
    discountPct: gate.discountPct,
  });
  const sku = storefront.products.find((p) => p.id === id);
  if (!sku) notFound();

  const marketing = sku.detailSlug
    ? (getProductBySlug(sku.detailSlug) ?? null)
    : null;

  return <PortalProductDetail sku={sku} marketing={marketing} />;
}
