export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { employmentApplications } from "@/lib/db/schema";
import { count, desc } from "drizzle-orm";
import { ApplicationsTable } from "./ApplicationsTable";
import { requireAdmin } from "@/lib/auth/admin";
import { ADMIN_LIST_LIMIT } from "@/lib/constants";
import { Card, EmptyState, PageHeader } from "@/components/ui/portal";

export default async function ApplicationsPage() {
  await requireAdmin();
  // Render the most recent N; header shows the true total via a separate COUNT.
  const [applications, [{ total }]] = await Promise.all([
    db
      .select()
      .from(employmentApplications)
      .orderBy(desc(employmentApplications.createdAt))
      .limit(ADMIN_LIST_LIMIT),
    db.select({ total: count() }).from(employmentApplications),
  ]);
  const overflow = total > applications.length;

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Employment Applications"
        description={
          <>
            {total} total application{total !== 1 ? "s" : ""}
            {overflow && (
              <span className="block text-xs text-navy/45">
                Showing the {applications.length} most recent of {total}.
              </span>
            )}
          </>
        }
      />

      {applications.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            title="No applications yet"
            body="Employment applications submitted on the careers page will show up here."
          />
        </Card>
      ) : (
        <ApplicationsTable applications={applications} />
      )}
    </div>
  );
}
