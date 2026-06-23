export const dynamic = "force-dynamic";

import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { standardCatalogPrice } from "@/data/catalog";
import { getCatalogProducts } from "@/lib/catalog/store";
import QuoteBuilder, { type ProductOption } from "../QuoteBuilder";

export default async function NewQuotePage() {
  await requireAdmin({ minRole: ADMIN_ROLE });

  const catalogProducts = await getCatalogProducts();
  const productOptions: ProductOption[] = catalogProducts.map((p) => ({
    id: p.id,
    name: p.strength ? `${p.name} ${p.strength}` : p.name,
    unit: p.unit ?? null,
    standardDollars: standardCatalogPrice(p),
  }));

  return <QuoteBuilder productOptions={productOptions} />;
}
