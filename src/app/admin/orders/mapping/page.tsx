export const dynamic = "force-dynamic";

import Link from "next/link";

import { requireAdmin } from "@/lib/auth/admin";
import { getCatalogProductsForAdmin } from "@/lib/catalog/store";
import { PageHeader, btnGhost } from "@/components/ui/portal";
import MappingTable from "./MappingTable";

/**
 * LifeFile product mapping: which catalog SKUs can be prescribed in-app.
 * A SKU is orderable once it has a LifeFile product id and isn't a controlled
 * schedule (2-5). Unmapped SKUs keep the external LifeFile portal hand-off.
 */
export default async function LifeFileMappingPage() {
  await requireAdmin();

  const rows = await getCatalogProductsForAdmin();

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/orders" className={`${btnGhost} -ml-4`}>
          ← Back to orders
        </Link>
      </div>

      <PageHeader
        eyebrow="Commerce"
        title="LifeFile product mapping"
        description="Map catalog SKUs to LifeFile product ids to enable in-app prescribing. Unmapped or controlled (schedule 2-5) products fall back to the LifeFile portal."
      />

      <MappingTable
        products={rows.map((r) => ({
          id: r.id,
          name: r.name,
          strength: r.strength,
          form: r.form,
          active: r.active,
          lfProductId: r.lfProductId,
          scheduleCode: r.scheduleCode,
          quantityUnits: r.quantityUnits,
          defaultQuantity: r.defaultQuantity,
        }))}
      />
    </div>
  );
}
