export const dynamic = "force-dynamic";

import Link from "next/link";
import { getPartnerContext } from "@/lib/auth/partner";
import { getOrgFloorMap } from "@/lib/partners/pricing";
import { getCatalogProducts } from "@/lib/catalog/store";
import PartnerNoAccess from "../../PartnerNoAccess";
import PartnerQuoteBuilder, { type FloorOption } from "../PartnerQuoteBuilder";

export default async function NewPartnerQuotePage() {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  if (ctx.org.compensationModel !== "margin") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy">New pricing quote</h1>
        <div className="mt-6 rounded-2xl border border-beige bg-white p-10 text-center">
          <p className="text-sm text-navy/65">
            Custom pricing quotes are available on the wholesale/margin model.
          </p>
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
        <div className="mb-6">
          <Link href="/partners/quotes" className="text-sm text-navy/60 hover:text-navy">
            ← Quotes
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-navy">New pricing quote</h1>
        </div>
        <div className="rounded-2xl border border-beige bg-white p-10 text-center">
          <p className="text-sm text-navy/65">
            No wholesale floor prices are set for your organization yet. Contact
            Logos RX to configure your price list before creating quotes.
          </p>
        </div>
      </div>
    );
  }

  return <PartnerQuoteBuilder floorOptions={floorOptions} />;
}
