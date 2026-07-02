export const dynamic = "force-dynamic";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerOrgs, partnerReps } from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { standardCatalogPrice } from "@/data/catalog";
import { getCatalogProducts } from "@/lib/catalog/store";
import { getQuoteWithItemsById } from "@/lib/quotes/data";
import QuoteBuilder, {
  type ProductOption,
  type QuotePrefill,
  type ReferrerOrg,
} from "../QuoteBuilder";

interface PageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function NewQuotePage({ searchParams }: PageProps) {
  await requireAdmin({ minRole: ADMIN_ROLE });
  const { from } = await searchParams;

  const [catalogProducts, orgs, reps] = await Promise.all([
    getCatalogProducts(),
    db
      .select({ id: partnerOrgs.id, name: partnerOrgs.name })
      .from(partnerOrgs)
      .where(eq(partnerOrgs.status, "active"))
      .orderBy(asc(partnerOrgs.name)),
    db
      .select({
        id: partnerReps.id,
        orgId: partnerReps.orgId,
        name: partnerReps.name,
      })
      .from(partnerReps)
      .where(eq(partnerReps.status, "active"))
      .orderBy(asc(partnerReps.name)),
  ]);

  const productOptions: ProductOption[] = catalogProducts.map((p) => ({
    id: p.id,
    name: p.strength ? `${p.name} ${p.strength}` : p.name,
    unit: p.unit ?? null,
    standardDollars: standardCatalogPrice(p),
  }));

  const repsByOrg = new Map<number, { id: number; name: string }[]>();
  for (const rep of reps) {
    const list = repsByOrg.get(rep.orgId) ?? [];
    list.push({ id: rep.id, name: rep.name });
    repsByOrg.set(rep.orgId, list);
  }
  const referrerOrgs: ReferrerOrg[] = orgs.map((org) => ({
    id: org.id,
    name: org.name,
    reps: repsByOrg.get(org.id) ?? [],
  }));

  let prefill: QuotePrefill | null = null;
  const fromId = Number(from);
  if (Number.isInteger(fromId) && fromId > 0) {
    const source = await getQuoteWithItemsById(fromId);
    if (source) {
      prefill = {
        intro: source.quote.intro ?? "",
        tier: source.quote.tier,
        discountPct: source.quote.discountPct,
        partnerOrgId: source.quote.partnerOrgId,
        partnerRepId: source.quote.partnerRepId,
        items: source.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          priceDollars: it.priceCents / 100,
          unit: it.unit,
        })),
      };
    }
  }

  return (
    <QuoteBuilder
      productOptions={productOptions}
      referrerOrgs={referrerOrgs}
      prefill={prefill}
    />
  );
}
