import { db } from "@/lib/db";
import { employmentApplications } from "@/lib/db/schema";
import { desc, getTableColumns, sql } from "drizzle-orm";
import { ApplicationsTable } from "./ApplicationsTable";
import { requireAdmin } from "@/lib/auth/admin";
import { ADMIN_LIST_LIMIT } from "@/lib/constants";
import { Card, EmptyState, PageHeader } from "@/components/ui/portal";

export default async function ApplicationsPage() {
  await requireAdmin();
  const rows = await db
    .select({
      ...getTableColumns(employmentApplications),
      total: sql<number>`count(*) over()`.mapWith(Number),
    })
    .from(employmentApplications)
    .orderBy(desc(employmentApplications.createdAt))
    .limit(ADMIN_LIST_LIMIT);
  const total = rows[0]?.total ?? 0;
  const applications = rows.map(({ total: _total, ...row }) => row);
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
