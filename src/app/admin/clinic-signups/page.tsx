export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { clinicSignups } from "@/lib/db/schema";
import { count, desc } from "drizzle-orm";
import { ClinicSignupsTable } from "./ClinicSignupsTable";
import { requireAdmin } from "@/lib/auth/admin";
import { ADMIN_LIST_LIMIT } from "@/lib/constants";

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Clinic Sign-ups</h1>
        <p className="text-navy/70 text-sm mt-1">
          {total} total sign-up{total !== 1 ? "s" : ""}
        </p>
        {overflow && (
          <p className="mt-1 text-xs text-navy/55">
            Showing the {signups.length} most recent of {total}.
          </p>
        )}
      </div>

      {signups.length === 0 ? (
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/65 text-sm">No clinic sign-ups yet.</p>
        </div>
      ) : (
        <ClinicSignupsTable signups={signups} />
      )}
    </div>
  );
}
