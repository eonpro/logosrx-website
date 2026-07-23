import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { submitOrderForClinic } from "@/lib/orders/service";
import {
  authenticateRequest,
  failureToHttp,
  jsonError,
  jsonOk,
} from "../shared";
import { orderSnapshot } from "./snapshot";

export const dynamic = "force-dynamic";

/**
 * POST /api/clinic/v1/orders — submit a prescription order.
 *
 * The body mirrors the dashboard submission with two API affordances:
 * `referenceId` (the caller's idempotency key — retries with the same value
 * return the stored outcome) and an inline `patient` block instead of a
 * saved-patient id. Clinic identity always comes from the API key.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const authed = await authenticateRequest(req);
  if (!authed.ok) return authed.response;
  const { auth, requestId } = authed;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError(
      requestId,
      400,
      "invalid_request",
      "INVALID_JSON",
      "Body is not parseable JSON.",
    );
  }

  // Map the API surface onto the internal submission shape. `referenceId`
  // doubles as the idempotency key (`submissionKey`).
  const referenceId = body.referenceId;
  if (typeof referenceId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(referenceId)) {
    return jsonError(
      requestId,
      422,
      "invalid_request",
      "VALIDATION_FAILED",
      "referenceId is required: 8-64 characters, letters/digits/_/- only. " +
        "Use the same value when retrying a submission.",
    );
  }

  const result = await submitOrderForClinic(
    auth.clinic,
    {
      patient: body.patient,
      patientId: body.patientId,
      prescriberNpi: body.prescriberNpi,
      shipping: body.shipping,
      payorType: body.payorType ?? "doc",
      memo: body.memo,
      rxs: body.rxs,
      submissionKey: referenceId,
    },
    `apikey:${auth.keyId}`,
  );

  if (!result.ok) {
    const { status, type } = failureToHttp(result.code);
    return jsonError(requestId, status, type, result.code, result.error);
  }

  return jsonOk(requestId, {
    orderId: result.orderId,
    lfOrderId: result.lfOrderId,
    referenceId,
    status: result.status,
    deduped: result.deduped,
  });
}

/**
 * GET /api/clinic/v1/orders?referenceId=... — look up one order by the
 * caller's own reference id (scoped to the authenticated clinic).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authed = await authenticateRequest(req);
  if (!authed.ok) return authed.response;
  const { auth, requestId } = authed;

  const referenceId = req.nextUrl.searchParams.get("referenceId")?.trim();
  if (!referenceId) {
    return jsonError(
      requestId,
      422,
      "invalid_request",
      "VALIDATION_FAILED",
      "Pass ?referenceId=<your reference id>.",
    );
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.clinicId, auth.clinic.id),
        eq(orders.referenceId, `LGS-${referenceId}`),
      ),
    )
    .limit(1);

  if (!order) {
    return jsonError(
      requestId,
      404,
      "invalid_request",
      "ORDER_NOT_FOUND",
      `No order with referenceId ${referenceId}.`,
    );
  }

  return jsonOk(requestId, { order: await orderSnapshot(order) });
}
