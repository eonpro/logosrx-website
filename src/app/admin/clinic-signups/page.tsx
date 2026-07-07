export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { clinicSignups } from "@/lib/db/schema";
import { count, desc } from "drizzle-orm";
import { ClinicSignupsTable } from "./ClinicSignupsTable";
import { requireAdmin } from "@/lib/auth/admin";
import { ADMIN_LIST_LIMIT } from "@/lib/constants";
import { Card, EmptyState, PageHeader } from "@/components/ui/portal";

export default async function ClinicSignupsPage() {
  await requireAdmin();
  // Render the most recent N; header shows the true total via a separate COUNT.
  const [signups, [{ total }]] = await Promise.all([
    db
      .select()
      .from(clinicSignups)
      .orderBy(desc(clinicSignups.createdAt))
      .limit(ADMIN_LIST_LIMIT),
    db.select({ total: count() }).from(clinicSignups),
  ]);
  const overflow = total > signups.length;

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Clinic Sign-ups"
        description={
          <>
            {total} total sign-up{total !== 1 ? "s" : ""}
            {overflow && (
              <span className="block text-xs text-navy/45">
                Showing the {signups.length} most recent of {total}.
              </span>
            )}
          </>
        }
      />

      {signups.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            title="No clinic sign-ups yet"
            body="Clinics that request info through the marketing site will show up here."
          />
        </Card>
      ) : (
        <ClinicSignupsTable signups={signups} />
      )}
    </div>
  );
}
