export const dynamic = "force-dynamic";

import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicPricing } from "@/lib/db/schema";
import { getPartnerContext } from "@/lib/auth/partner";
import { getOrgFloorMap } from "@/lib/partners/pricing";
import { listNetworkClinics } from "@/lib/partners/queries";
import { getCatalogProducts } from "@/lib/catalog/store";
import { PageHeader, EmptyState, btnGhost } from "@/components/ui/portal";
import PartnerNoAccess from "../PartnerNoAccess";
import ClinicPricingManager from "./ClinicPricingManager";

export default async function PartnerPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ clinic?: string }>;
}) {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  if (ctx.org.compensationModel !== "margin") {
    return (
      <div>
        <PageHeader eyebrow="Partner Portal" title="Clinic Pricing" />
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="Pricing is managed by Logos RX"
            body="Clinic pricing control is available on the wholesale/margin model. Your organization currently earns a commission percentage, so pricing is managed by Logos RX."
          />
        </div>
      </div>
    );
  }

  const { clinic: clinicParam } = await searchParams;
  const selectedClinicId = clinicParam ? Number(clinicParam) : null;

  const [clinicList, floorMap] = await Promise.all([
    listNetworkClinics(ctx),
    getOrgFloorMap(ctx.org.id),
  ]);

  // Validate the selected clinic is in the caller's network.
  const selected =
    selectedClinicId != null
      ? clinicList.find((c) => c.id === selectedClinicId) ?? null
      : null;

  // Catalog strength lookup for display.
  const catalogProducts = await getCatalogProducts();
  const strengthById = new Map(
    catalogProducts.map((p) => [p.id, p.strength ?? null]),
  );

  let rows: {
    productId: string;
    name: string;
    strength: string | null;
    unit: string | null;
    floorCents: number;
    currentPriceCents: number | null;
  }[] = [];

  if (selected) {
    const overrides = await db
      .select({
        productId: clinicPricing.productId,
        priceCents: clinicPricing.priceCents,
      })
      .from(clinicPricing)
      .where(eq(clinicPricing.clinicId, selected.id));
    const priceByProduct = new Map(
      overrides
        .filter((o) => o.productId != null)
        .map((o) => [o.productId as string, o.priceCents]),
    );

    rows = Array.from(floorMap.values()).map((f) => ({
      productId: f.productId,
      name: f.productName,
      strength: strengthById.get(f.productId) ?? null,
      unit: f.unit,
      floorCents: f.floorCents,
      currentPriceCents: priceByProduct.get(f.productId) ?? null,
    }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Partner Portal"
        title="Clinic Pricing"
        description="Set each clinic's selling price at or above your wholesale floor. You earn the spread on every sale."
      />

      {floorMap.size === 0 ? (
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="No wholesale floor prices yet"
            body="No wholesale floor prices are set for your organization yet. Contact Logos RX to configure your price list."
          />
        </div>
      ) : clinicList.length === 0 ? (
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="No clinics in your network yet"
            body="Share your referral links to add clinics."
            action={
              <Link href="/partners/links" className={btnGhost}>
                Go to referral links →
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-3xl border border-beige/70 bg-white p-3 shadow-soft">
            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
              Clinics
            </p>
            <ul className="mt-1 space-y-0.5">
              {clinicList.map((c) => {
                const active = c.id === selected?.id;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/partners/pricing?clinic=${c.id}`}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-full px-4 py-2 text-sm transition-colors ${
                        active
                          ? "bg-plum font-semibold text-white shadow-soft"
                          : "text-navy/75 hover:bg-cream"
                      }`}
                    >
                      {c.clinicName ?? `Clinic #${c.id}`}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div>
            {!selected ? (
              <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
                <EmptyState title="Select a clinic to set its pricing" />
              </div>
            ) : (
              <ClinicPricingManager
                clinicId={selected.id}
                clinicName={selected.clinicName ?? `Clinic #${selected.id}`}
                rows={rows}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
