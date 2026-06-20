import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerOrgPricing } from "@/lib/db/schema";

/**
 * Read/write helpers for a margin-model org's per-product wholesale floor
 * prices. Writes are performed by admin actions; reads are used by the partner
 * pricing UI (to enforce sell ≥ floor) and by transaction accounting.
 */

export interface OrgFloor {
  productId: string;
  productName: string;
  floorCents: number;
  unit: string | null;
}

/** All floor prices set for an org, keyed by catalog SKU id. */
export async function getOrgFloorMap(
  orgId: number,
): Promise<Map<string, OrgFloor>> {
  const rows = await db
    .select({
      productId: partnerOrgPricing.productId,
      productName: partnerOrgPricing.productName,
      floorCents: partnerOrgPricing.floorCents,
      unit: partnerOrgPricing.unit,
    })
    .from(partnerOrgPricing)
    .where(eq(partnerOrgPricing.orgId, orgId));
  return new Map(rows.map((r) => [r.productId, r]));
}

/** Upserts a single floor price for an org's SKU. */
export async function upsertOrgFloor(args: {
  orgId: number;
  productId: string;
  productName: string;
  floorCents: number;
  unit: string | null;
}): Promise<void> {
  await db
    .insert(partnerOrgPricing)
    .values(args)
    .onConflictDoUpdate({
      target: [partnerOrgPricing.orgId, partnerOrgPricing.productId],
      set: {
        floorCents: args.floorCents,
        productName: args.productName,
        unit: args.unit,
        updatedAt: new Date(),
      },
    });
}

/** Removes an org's floor for a SKU (reverts it to "no floor"). */
export async function deleteOrgFloor(
  orgId: number,
  productId: string,
): Promise<void> {
  await db
    .delete(partnerOrgPricing)
    .where(
      and(
        eq(partnerOrgPricing.orgId, orgId),
        eq(partnerOrgPricing.productId, productId),
      ),
    );
}
