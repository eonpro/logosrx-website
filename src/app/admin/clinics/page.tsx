export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { clinics, clinicPayments } from "@/lib/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import { ClinicsTable } from "./ClinicsTable";
import { requireAdmin } from "@/lib/auth/admin";
import { ADMIN_LIST_LIMIT } from "@/lib/constants";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/portal";

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
        addressCity: clinics.addressCity,
        addressState: clinics.addressState,
        addressZip: clinics.addressZip,
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
