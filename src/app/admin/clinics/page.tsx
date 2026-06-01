export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { clinics, clinicPayments } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ClinicsTable } from "./ClinicsTable";
import { requireAdmin } from "@/lib/auth/admin";

export default async function ClinicsPage() {
  await requireAdmin();

  // Only completed intakes show up in the verification queue. Pull the card's
  // last 4 for display; sensitive card data stays in clinic_payments.
  const rows = await db
    .select({
      clinic: clinics,
      cardLast4: clinicPayments.cardLast4,
    })
    .from(clinics)
    .leftJoin(clinicPayments, eq(clinicPayments.clerkUserId, clinics.clerkUserId))
    .where(eq(clinics.onboardingCompleted, true))
    .orderBy(desc(clinics.createdAt));

  const list = rows.map((r) => ({ ...r.clinic, cardLast4: r.cardLast4 }));
  const pending = list.filter((c) => c.verificationStatus === "pending").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Clinics</h1>
        <p className="text-navy/70 text-sm mt-1">
          {list.length} onboarded clinic{list.length !== 1 ? "s" : ""}
          {pending > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {pending} pending verification
            </span>
          )}
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/65 text-sm">No onboarded clinics yet.</p>
        </div>
      ) : (
        <ClinicsTable clinics={list} />
      )}
    </div>
  );
}
