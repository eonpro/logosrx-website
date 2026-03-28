export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { employmentApplications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ApplicationsTable } from "./ApplicationsTable";

export default async function ApplicationsPage() {
  const applications = await db
    .select()
    .from(employmentApplications)
    .orderBy(desc(employmentApplications.createdAt));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Employment Applications</h1>
        <p className="text-navy/50 text-sm mt-1">
          {applications.length} total application{applications.length !== 1 ? "s" : ""}
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/40 text-sm">No applications yet.</p>
        </div>
      ) : (
        <ApplicationsTable applications={applications} />
      )}
    </div>
  );
}
