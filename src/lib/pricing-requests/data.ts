import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinics,
  pricingRequests,
  type PricingRequest,
} from "@/lib/db/schema";
import type { VolumeBand } from "./validate";

export type PricingRequestStatus = PricingRequest["status"];

export interface PricingRequestListItem {
  id: number;
  status: PricingRequestStatus;
  volumeBand: VolumeBand;
  productIds: string[];
  message: string | null;
  adminNote: string | null;
  reviewedAt: Date | null;
  reviewedByEmail: string | null;
  createdAt: Date;
  clinicId: number;
  clinicName: string | null;
  contactName: string | null;
  contactEmail: string | null;
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
      reviewedAt: pricingRequests.reviewedAt,
      reviewedByEmail: pricingRequests.reviewedByEmail,
      createdAt: pricingRequests.createdAt,
      clinicId: pricingRequests.clinicId,
      clinicName: clinics.clinicName,
      contactName: clinics.contactName,
      contactEmail: clinics.contactEmail,
    })
    .from(pricingRequests)
    .innerJoin(clinics, eq(pricingRequests.clinicId, clinics.id))
    .orderBy(desc(pricingRequests.createdAt));

  return rows.map((r) => ({
    ...r,
    volumeBand: r.volumeBand as VolumeBand,
    productIds: Array.isArray(r.productIds) ? r.productIds : [],
  }));
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
