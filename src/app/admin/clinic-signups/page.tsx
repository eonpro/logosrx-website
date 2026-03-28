export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { clinicSignups } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ClinicSignupsTable } from "./ClinicSignupsTable";

export default async function ClinicSignupsPage() {
  const signups = await db
    .select()
    .from(clinicSignups)
    .orderBy(desc(clinicSignups.createdAt));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Clinic Sign-ups</h1>
        <p className="text-navy/50 text-sm mt-1">
          {signups.length} total sign-up{signups.length !== 1 ? "s" : ""}
        </p>
      </div>

      {signups.length === 0 ? (
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/40 text-sm">No clinic sign-ups yet.</p>
        </div>
      ) : (
        <ClinicSignupsTable signups={signups} />
      )}
    </div>
  );
}
