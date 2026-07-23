import "server-only";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orderRxs, type Order } from "@/lib/db/schema";

/**
 * The public order representation returned by the clinic API. Statuses are
 * the internal lifecycle values; raw pharmacy payloads are never exposed.
 * The caller's own reference id is returned without the internal `LGS-`
 * prefix so it round-trips exactly as submitted.
 */
export interface OrderSnapshot {
  orderId: number;
  referenceId: string;
  lfOrderId: string | null;
  status: Order["status"];
  /** Short, safe failure summary when status is an error state. */
  errorMessage: string | null;
  rxs: {
    drugName: string;
    drugStrength: string | null;
    quantity: string | null;
    daysSupply: number | null;
    refills: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export async function orderSnapshot(order: Order): Promise<OrderSnapshot> {
  const rxs = await db
    .select({
      drugName: orderRxs.drugName,
      drugStrength: orderRxs.drugStrength,
      quantity: orderRxs.quantity,
      daysSupply: orderRxs.daysSupply,
      refills: orderRxs.refills,
    })
    .from(orderRxs)
    .where(eq(orderRxs.orderId, order.id));

  return {
    orderId: order.id,
    referenceId: order.referenceId.replace(/^LGS-/, ""),
    lfOrderId: order.lfOrderId,
    status: order.status,
    errorMessage:
      order.status === "pharmacy_rejected" || order.status === "failed"
        ? order.errorMessage
        : null,
    rxs,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
