export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { clinics, clinicPayments } from "@/lib/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import { ClinicsTable } from "./ClinicsTable";
import { requireAdmin } from "@/lib/auth/admin";
import { ADMIN_LIST_LIMIT } from "@/lib/constants";

export default async function ClinicsPage() {
  await requireAdmin();

  // Only completed intakes show up in the verification queue. Pull the card's
  // last 4 for display; sensitive card data stays in clinic_payments.
  //
  // Projection: select only the columns the table renders. Crucially this omits
  // the large base64 `*_signature` blobs (and other unused columns), which would
  // otherwise be shipped for every clinic. Capped to the most recent N; the
  // header still shows the true total via a separate COUNT.
  const [list, [stats]] = await Promise.all([
    db
      .select({
        id: clinics.id,
        clinicName: clinics.clinicName,
        practiceLegalName: clinics.practiceLegalName,
        practiceDba: clinics.practiceDba,
        ein: clinics.ein,
        practiceType: clinics.practiceType,
        contactName: clinics.contactName,
        contactEmail: clinics.contactEmail,
        contactPhone: clinics.contactPhone,
        addressLine1: clinics.addressLine1,
        addressSuite: clinics.addressSuite,
        practicePhone: clinics.practicePhone,
        website: clinics.website,
        productsOfInterest: clinics.productsOfInterest,
        orderVolume: clinics.orderVolume,
        referralSource: clinics.referralSource,
        shippingMethod: clinics.shippingMethod,
        providers: clinics.providers,
        verificationStatus: clinics.verificationStatus,
        createdAt: clinics.createdAt,
        cardLast4: clinicPayments.cardLast4,
      })
      .from(clinics)
      .leftJoin(
        clinicPayments,
        eq(clinicPayments.clerkUserId, clinics.clerkUserId),
      )
      .where(eq(clinics.onboardingCompleted, true))
      .orderBy(desc(clinics.createdAt))
      .limit(ADMIN_LIST_LIMIT),
    db
      .select({
        total: count(),
        pending: sql<number>`count(*) filter (where ${clinics.verificationStatus} = 'pending')`.mapWith(
          Number,
        ),
      })
      .from(clinics)
      .where(eq(clinics.onboardingCompleted, true)),
  ]);

  const total = stats.total;
  const pending = stats.pending;
  const overflow = total > list.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Clinics</h1>
        <p className="text-navy/70 text-sm mt-1">
          {total} onboarded clinic{total !== 1 ? "s" : ""}
          {pending > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {pending} pending verification
            </span>
          )}
        </p>
        {overflow && (
          <p className="mt-1 text-xs text-navy/55">
            Showing the {list.length} most recent of {total}.
          </p>
        )}
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
