export const dynamic = "force-dynamic";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerOrgs, partnerReps } from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { standardCatalogPrice } from "@/data/catalog";
import { getCatalogProducts } from "@/lib/catalog/store";
import QuoteBuilder, {
  type ProductOption,
  type ReferrerOrg,
} from "../QuoteBuilder";

export default async function NewQuotePage() {
  await requireAdmin({ minRole: ADMIN_ROLE });

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

  return (
    <QuoteBuilder productOptions={productOptions} referrerOrgs={referrerOrgs} />
  );
}
