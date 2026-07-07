export const dynamic = "force-dynamic";

import Link from "next/link";
import { getPartnerContext } from "@/lib/auth/partner";
import { roleAtLeast } from "@/lib/auth/partner-roles";
import { getOrgFloorMap } from "@/lib/partners/pricing";
import { getCatalogProducts } from "@/lib/catalog/store";
import { PageHeader, EmptyState, btnGhost } from "@/components/ui/portal";
import PartnerNoAccess from "../../PartnerNoAccess";
import PartnerQuoteBuilder, { type FloorOption } from "../PartnerQuoteBuilder";

export default async function NewPartnerQuotePage() {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;
  // Quote creation mutates pricing state — org viewers are read-only (the
  // createPartnerQuote action enforces the same minRole).
  if (ctx.kind === "org" && !roleAtLeast(ctx.role, "admin")) {
    return <PartnerNoAccess />;
  }

  if (ctx.org.compensationModel !== "margin") {
    return (
      <div>
        <PageHeader eyebrow="Partner Portal" title="New pricing quote" />
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="Quotes are unavailable on your plan"
            body="Custom pricing quotes are available on the wholesale/margin model."
          />
        </div>
      </div>
    );
  }

  const floorMap = await getOrgFloorMap(ctx.org.id);
  const catalogProducts = await getCatalogProducts();
  const strengthById = new Map(
    catalogProducts.map((p) => [p.id, p.strength ?? null]),
  );

  const floorOptions: FloorOption[] = Array.from(floorMap.values()).map((f) => {
    const strength = strengthById.get(f.productId);
    return {
      productId: f.productId,
      name: strength ? `${f.productName} ${strength}` : f.productName,
      unit: f.unit,
      floorDollars: f.floorCents / 100,
    };
  });

  if (floorOptions.length === 0) {
    return (
      <div>
        <div className="mb-2">
          <Link href="/partners/quotes" className={`${btnGhost} -ml-4`}>
            ← Quotes
          </Link>
        </div>
        <PageHeader eyebrow="Partner Portal" title="New pricing quote" />
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="No wholesale floor prices yet"
            body="No wholesale floor prices are set for your organization yet. Contact Logos RX to configure your price list before creating quotes."
          />
        </div>
      </div>
    );
  }

  return <PartnerQuoteBuilder floorOptions={floorOptions} />;
}
