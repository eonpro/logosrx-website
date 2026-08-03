import "server-only";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinics,
  pricingRequests,
  type PricingRequest,
} from "@/lib/db/schema";
import type { VolumeBand } from "./validate";
import {
  shouldShowPricingUpdatedBanner,
  type PricingRequestStatus,
} from "./status";

export type { PricingRequestStatus };

export interface PricingRequestListItem {
  id: number;
  status: PricingRequestStatus;
  volumeBand: VolumeBand;
  productIds: string[];
  message: string | null;
  adminNote: string | null;
  clinicReply: string | null;
  reviewedAt: Date | null;
  reviewedByEmail: string | null;
  notifiedAt: Date | null;
  createdAt: Date;
  clinicId: number;
  clinicName: string | null;
  contactName: string | null;
  contactEmail: string | null;
}

/** Slim shape clinics see for their own request history. */
export interface ClinicPricingRequestItem {
  id: number;
  status: PricingRequestStatus;
  volumeBand: VolumeBand;
  productIds: string[];
  message: string | null;
  clinicReply: string | null;
  notifiedAt: Date | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

function mapRow(r: {
  id: number;
  status: PricingRequest["status"];
  volumeBand: PricingRequest["volumeBand"];
  productIds: string[] | null;
  message: string | null;
  adminNote: string | null;
  clinicReply: string | null;
  reviewedAt: Date | null;
  reviewedByEmail: string | null;
  notifiedAt: Date | null;
  createdAt: Date;
  clinicId: number;
  clinicName: string | null;
  contactName: string | null;
  contactEmail: string | null;
}): PricingRequestListItem {
  return {
    id: r.id,
    status: r.status,
    volumeBand: r.volumeBand as VolumeBand,
    productIds: Array.isArray(r.productIds) ? r.productIds : [],
    message: r.message,
    adminNote: r.adminNote,
    clinicReply: r.clinicReply,
    reviewedAt: r.reviewedAt,
    reviewedByEmail: r.reviewedByEmail,
    notifiedAt: r.notifiedAt,
    createdAt: r.createdAt,
    clinicId: r.clinicId,
    clinicName: r.clinicName,
    contactName: r.contactName,
    contactEmail: r.contactEmail,
  };
}

/** All pricing requests, newest first (admin queue). */
export async function listPricingRequests(): Promise<PricingRequestListItem[]> {
  const rows = await db
    .select({
      id: pricingRequests.id,
      status: pricingRequests.status,
      volumeBand: pricingRequests.volumeBand,
      productIds: pricingRequests.productIds,
      message: pricingRequests.message,
      adminNote: pricingRequests.adminNote,
      clinicReply: pricingRequests.clinicReply,
      reviewedAt: pricingRequests.reviewedAt,
      reviewedByEmail: pricingRequests.reviewedByEmail,
      notifiedAt: pricingRequests.notifiedAt,
      createdAt: pricingRequests.createdAt,
      clinicId: pricingRequests.clinicId,
      clinicName: clinics.clinicName,
      contactName: clinics.contactName,
      contactEmail: clinics.contactEmail,
    })
    .from(pricingRequests)
    .innerJoin(clinics, eq(pricingRequests.clinicId, clinics.id))
    .orderBy(desc(pricingRequests.createdAt));

  return rows.map(mapRow);
}

/** A single clinic's requests, newest first. */
export async function listPricingRequestsForClinic(
  clinicId: number,
): Promise<ClinicPricingRequestItem[]> {
  const rows = await db
    .select({
      id: pricingRequests.id,
      status: pricingRequests.status,
      volumeBand: pricingRequests.volumeBand,
      productIds: pricingRequests.productIds,
      message: pricingRequests.message,
      clinicReply: pricingRequests.clinicReply,
      notifiedAt: pricingRequests.notifiedAt,
      createdAt: pricingRequests.createdAt,
      reviewedAt: pricingRequests.reviewedAt,
    })
    .from(pricingRequests)
    .where(eq(pricingRequests.clinicId, clinicId))
    .orderBy(desc(pricingRequests.createdAt));

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    volumeBand: r.volumeBand as VolumeBand,
    productIds: Array.isArray(r.productIds) ? r.productIds : [],
    message: r.message,
    clinicReply: r.clinicReply,
    notifiedAt: r.notifiedAt,
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt,
  }));
}

/**
 * Newest closed request that has been notified — used for the catalog banner.
 */
export async function getLatestNotifiedPricingRequest(
  clinicId: number,
): Promise<{ id: number; notifiedAt: Date } | null> {
  const [row] = await db
    .select({
      id: pricingRequests.id,
      notifiedAt: pricingRequests.notifiedAt,
    })
    .from(pricingRequests)
    .where(
      and(
        eq(pricingRequests.clinicId, clinicId),
        eq(pricingRequests.status, "closed"),
        isNotNull(pricingRequests.notifiedAt),
      ),
    )
    .orderBy(desc(pricingRequests.notifiedAt))
    .limit(1);

  if (!row?.notifiedAt) return null;
  return { id: row.id, notifiedAt: row.notifiedAt };
}

export async function getClinicPricingBannerState(clinicId: number): Promise<{
  show: boolean;
  latestNotifiedAt: Date | null;
}> {
  const [[clinic], latest] = await Promise.all([
    db
      .select({ pricingUpdateSeenAt: clinics.pricingUpdateSeenAt })
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1),
    getLatestNotifiedPricingRequest(clinicId),
  ]);

  const latestNotifiedAt = latest?.notifiedAt ?? null;
  return {
    show: shouldShowPricingUpdatedBanner({
      latestNotifiedAt,
      pricingUpdateSeenAt: clinic?.pricingUpdateSeenAt ?? null,
    }),
    latestNotifiedAt,
  };
}

export async function dismissPricingUpdateBanner(
  clinicId: number,
): Promise<void> {
  await db
    .update(clinics)
    .set({
      pricingUpdateSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(clinics.id, clinicId));
}

export async function countPendingPricingRequests(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(pricingRequests)
    .where(eq(pricingRequests.status, "pending"));
  return row?.n ?? 0;
}

export async function createPricingRequest(args: {
  clinicId: number;
  volumeBand: VolumeBand;
  productIds: string[];
  message: string | null;
}): Promise<number> {
  const [row] = await db
    .insert(pricingRequests)
    .values({
      clinicId: args.clinicId,
      volumeBand: args.volumeBand,
      productIds: args.productIds,
      message: args.message,
      status: "pending",
    })
    .returning({ id: pricingRequests.id });
  return row.id;
}

export async function updatePricingRequestStatus(args: {
  id: number;
  status: Exclude<PricingRequestStatus, "pending">;
  adminNote: string | null;
  reviewedBy: string;
  reviewedByEmail: string | null;
}): Promise<boolean> {
  const [row] = await db
    .update(pricingRequests)
    .set({
      status: args.status,
      adminNote: args.adminNote,
      reviewedAt: new Date(),
      reviewedBy: args.reviewedBy,
      reviewedByEmail: args.reviewedByEmail,
      updatedAt: new Date(),
    })
    .where(eq(pricingRequests.id, args.id))
    .returning({ id: pricingRequests.id });
  return Boolean(row);
}

/**
 * Closes a request, stamps notification metadata, and returns clinic contact
 * info for the follow-up email. Returns null when the id is unknown.
 */
export async function completeAndNotifyPricingRequestRow(args: {
  id: number;
  adminNote: string | null;
  clinicReply: string | null;
  reviewedBy: string;
  reviewedByEmail: string | null;
}): Promise<{
  clinicId: number;
  clinicName: string | null;
  contactName: string | null;
  contactEmail: string | null;
} | null> {
  const now = new Date();
  const [row] = await db
    .update(pricingRequests)
    .set({
      status: "closed",
      adminNote: args.adminNote,
      clinicReply: args.clinicReply,
      reviewedAt: now,
      reviewedBy: args.reviewedBy,
      reviewedByEmail: args.reviewedByEmail,
      notifiedAt: now,
      updatedAt: now,
    })
    .where(eq(pricingRequests.id, args.id))
    .returning({
      clinicId: pricingRequests.clinicId,
    });

  if (!row) return null;

  const [clinic] = await db
    .select({
      clinicName: clinics.clinicName,
      contactName: clinics.contactName,
      contactEmail: clinics.contactEmail,
    })
    .from(clinics)
    .where(eq(clinics.id, row.clinicId))
    .limit(1);

  return {
    clinicId: row.clinicId,
    clinicName: clinic?.clinicName ?? null,
    contactName: clinic?.contactName ?? null,
    contactEmail: clinic?.contactEmail ?? null,
  };
}
