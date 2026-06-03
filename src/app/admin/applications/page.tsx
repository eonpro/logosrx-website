export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { employmentApplications } from "@/lib/db/schema";
import { count, desc } from "drizzle-orm";
import { ApplicationsTable } from "./ApplicationsTable";
import { requireAdmin } from "@/lib/auth/admin";
import { ADMIN_LIST_LIMIT } from "@/lib/constants";

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Employment Applications</h1>
        <p className="text-navy/70 text-sm mt-1">
          {total} total application{total !== 1 ? "s" : ""}
        </p>
        {overflow && (
          <p className="mt-1 text-xs text-navy/55">
            Showing the {applications.length} most recent of {total}.
          </p>
        )}
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/65 text-sm">No applications yet.</p>
        </div>
      ) : (
        <ApplicationsTable applications={applications} />
      )}
    </div>
  );
}
