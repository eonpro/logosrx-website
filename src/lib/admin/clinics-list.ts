import "server-only";

import { unstable_cache } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicPayments, clinics } from "@/lib/db/schema";
import { ADMIN_LIST_LIMIT } from "@/lib/constants";
import { ADMIN_CLINICS_LIST_TAG } from "@/lib/admin/cache-tags";
import {
  stripClinicListAggregates,
  type AdminClinicListResult,
  type AdminClinicListRow,
} from "@/lib/admin/clinics-list-shape";

export type { AdminClinicListResult, AdminClinicListRow } from "@/lib/admin/clinics-list-shape";
export { stripClinicListAggregates } from "@/lib/admin/clinics-list-shape";

/**
 * Loads the admin verification queue in a **single** round-trip.
 *
 * Previously this was `Promise.all([list, count])`, which opened two pooled
 * connections at once. Under Vercel + Aurora IAM that burst routinely hit
 * `connectionTimeoutMillis` and surfaced as "Couldn't load this view"
 * (digest e.g. 2013802586). Window aggregates give us total + pending on the
 * same statement that returns the page of rows, so we only need one connect.
 */
async function queryOnboardedClinicsForAdmin(): Promise<AdminClinicListResult> {
  const rows = await db
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
      verificationStatus: clinics.verificationStatus,
      createdAt: clinics.createdAt,
      cardLast4: clinicPayments.cardLast4,
      // Computed over the full WHERE set, before LIMIT — so header totals stay
      // accurate even when we only render the most recent N clinics.
      total: sql<number>`count(*) over()`.mapWith(Number),
      pending: sql<number>`count(*) filter (where ${clinics.verificationStatus} = 'pending') over()`.mapWith(
        Number,
      ),
    })
    .from(clinics)
    .leftJoin(
      clinicPayments,
      eq(clinicPayments.clerkUserId, clinics.clerkUserId),
    )
    .where(eq(clinics.onboardingCompleted, true))
    .orderBy(desc(clinics.createdAt))
    .limit(ADMIN_LIST_LIMIT);

  if (rows.length === 0) {
    return { list: [], total: 0, pending: 0 };
  }

  const total = rows[0].total;
  const pending = rows[0].pending;
  const list = rows.map(stripClinicListAggregates) as AdminClinicListRow[];

  return { list, total, pending };
}

export const listOnboardedClinicsForAdmin = unstable_cache(
  queryOnboardedClinicsForAdmin,
  ["admin-clinics-list"],
  { tags: [ADMIN_CLINICS_LIST_TAG], revalidate: 30 },
);
