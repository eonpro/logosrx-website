export const dynamic = "force-dynamic";

import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { getCatalogProducts } from "@/lib/catalog/store";
import { listPricingRequests } from "@/lib/pricing-requests/data";
import PricingRequestsManager from "@/components/admin/PricingRequestsManager";
import { Card, PageHeader } from "@/components/ui/portal";

export default async function PricingRequestsPage() {
  const ctx = await requireAdmin();
  const canEdit = ctx.role === ADMIN_ROLE;
  const [requests, catalog] = await Promise.all([
    listPricingRequests(),
    getCatalogProducts(),
  ]);

  const productNames: Record<string, string> = {};
  for (const p of catalog) productNames[p.id] = p.name;

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Admin"
        title="Pricing Requests"
        description="Volume and custom pricing asks from verified clinics. Fulfill via clinic pricing or a quote link."
        actions={
          pendingCount > 0 ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              {pendingCount} pending
            </span>
          ) : undefined
        }
      />

      <Card pad={false} className="p-4 sm:p-6">
        <PricingRequestsManager
          requests={requests}
          canEdit={canEdit}
          productNames={productNames}
        />
      </Card>
    </div>
  );
}
