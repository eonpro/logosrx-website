export const dynamic = "force-dynamic";

import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicPricing } from "@/lib/db/schema";
import { getPartnerContext } from "@/lib/auth/partner";
import { getOrgFloorMap } from "@/lib/partners/pricing";
import { listNetworkClinics } from "@/lib/partners/queries";
import { catalogProducts } from "@/data/catalog";
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
        <h1 className="text-2xl font-bold text-navy">Clinic Pricing</h1>
        <div className="mt-6 rounded-2xl border border-beige bg-white p-10 text-center">
          <p className="text-sm text-navy/65">
            Clinic pricing control is available on the wholesale/margin model.
            Your organization currently earns a commission percentage, so
            pricing is managed by Logos RX.
          </p>
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Clinic Pricing</h1>
        <p className="text-navy/70 text-sm mt-1">
          Set each clinic&rsquo;s selling price at or above your wholesale
          floor. You earn the spread on every sale.
        </p>
      </div>

      {floorMap.size === 0 ? (
        <div className="rounded-2xl border border-beige bg-white p-10 text-center">
          <p className="text-sm text-navy/65">
            No wholesale floor prices are set for your organization yet. Contact
            Logos RX to configure your price list.
          </p>
        </div>
      ) : clinicList.length === 0 ? (
        <div className="rounded-2xl border border-beige bg-white p-10 text-center">
          <p className="text-sm text-navy/65">
            No clinics in your network yet. Share your{" "}
            <Link href="/partners/links" className="text-magenta hover:underline">
              referral links
            </Link>{" "}
            to add clinics.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-beige bg-white p-3">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-navy/55">
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
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-navy text-white"
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
              <div className="rounded-2xl border border-beige bg-white p-10 text-center">
                <p className="text-sm text-navy/65">
                  Select a clinic to set its pricing.
                </p>
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
