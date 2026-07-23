import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import OrderWizard from "@/components/dashboard/orders/OrderWizard";
import { PageHeader, btnSecondary } from "@/components/ui/portal";
import { LIFEFILE_SHIPPING_SERVICES } from "@/lib/lifefile/constants";
import {
  getClinicOrderingContext,
  listClinicPatients,
} from "@/lib/orders/data";
import { getOrderableProducts } from "@/lib/orders/products";

export const metadata: Metadata = {
  title: "New order",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/orders/new");

  const ctx = await getClinicOrderingContext(userId);
  if (!ctx || !ctx.onboardingCompleted) redirect("/dashboard");
  if (!ctx.verified || !ctx.orderingEnabled) redirect("/dashboard/orders");

  const [{ product }, patients, products] = await Promise.all([
    searchParams,
    listClinicPatients(ctx.clinicId),
    getOrderableProducts({
      clinicId: ctx.clinicId,
      pricingTier: ctx.pricingTier,
      discountPct: ctx.discountPct,
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="New order"
        title="New prescription"
        description="Sent directly to Logos Pharmacy — no LifeFile login needed."
        actions={
          <Link href="/dashboard/orders" className={btnSecondary}>
            Back to orders
          </Link>
        }
      />
      <OrderWizard
        clinicKey={`clinic-${ctx.clinicId}`}
        patients={patients}
        providers={ctx.providers}
        products={products}
        services={[...LIFEFILE_SHIPPING_SERVICES]}
        defaultServiceId={ctx.defaultServiceId}
        preselectedProductId={product ?? null}
      />
    </main>
  );
}
