import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { authenticateRequest, jsonError, jsonOk } from "../../shared";
import { orderSnapshot } from "../snapshot";

export const dynamic = "force-dynamic";

/**
 * GET /api/clinic/v1/orders/{orderId} — order snapshot by our numeric order
 * id (returned from POST). Scoped to the authenticated clinic: another
 * clinic's order id returns the same 404 as a nonexistent one.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const authed = await authenticateRequest(req);
  if (!authed.ok) return authed.response;
  const { auth, requestId } = authed;

  const { id } = await ctx.params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return jsonError(
      requestId,
      422,
      "invalid_request",
      "VALIDATION_FAILED",
      "Order id must be a positive integer.",
    );
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.clinicId, auth.clinic.id)))
    .limit(1);

  if (!order) {
    return jsonError(
      requestId,
      404,
      "invalid_request",
      "ORDER_NOT_FOUND",
      `Order ${orderId} not found.`,
    );
  }

  return jsonOk(requestId, { order: await orderSnapshot(order) });
}
