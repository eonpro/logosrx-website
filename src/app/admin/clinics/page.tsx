export const dynamic = "force-dynamic";

import { ClinicsTable } from "./ClinicsTable";
import { requireAdmin } from "@/lib/auth/admin";
import { listOnboardedClinicsForAdmin } from "@/lib/admin/clinics-list";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/portal";

export default async function ClinicsPage() {
  await requireAdmin();

  // Single round-trip: page of clinics + total/pending via window aggregates.
  // Avoids the parallel list+count burst that was timing out the Aurora pool
  // (admin error digest 2013802586).
  const { list, total, pending } = await listOnboardedClinicsForAdmin();
  const overflow = total > list.length;

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Clinics"
        description={
          <>
            {total} onboarded clinic{total !== 1 ? "s" : ""}
            {pending > 0 && (
              <span className="ml-2 inline-flex align-middle">
                <Badge tone="warning">{pending} pending verification</Badge>
              </span>
            )}
            {overflow && (
              <span className="block text-xs text-navy/45">
                Showing the {list.length} most recent of {total}.
              </span>
            )}
          </>
        }
      />

      {list.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            title="No onboarded clinics yet"
            body="Clinics that finish onboarding will land here for verification."
          />
        </Card>
      ) : (
        <ClinicsTable clinics={list} />
      )}
    </div>
  );
}
