export const dynamic = "force-dynamic";

import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { catalogProducts, standardCatalogPrice } from "@/data/catalog";
import QuoteBuilder, { type ProductOption } from "../QuoteBuilder";

export default async function NewQuotePage() {
  await requireAdmin({ minRole: ADMIN_ROLE });

  const productOptions: ProductOption[] = catalogProducts.map((p) => ({
    id: p.id,
    name: p.strength ? `${p.name} ${p.strength}` : p.name,
    unit: p.unit ?? null,
    standardDollars: standardCatalogPrice(p),
  }));

  return <QuoteBuilder productOptions={productOptions} />;
}
