import "server-only";
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import {
  authenticateClinicApiKey,
  type ClinicApiAuth,
} from "@/lib/orders/api-auth";
import { rateLimitKey, rateLimitHeaders } from "@/lib/security/rate-limit";
import type { SubmitOrderFailureCode } from "@/lib/orders/service";

/**
 * Shared plumbing for the clinic ordering API (`/api/clinic/v1/*`).
 *
 * Response conventions (ObsidianRx-style, familiar to pharmacy integrators):
 * every response carries `requestId` (echoed in the `X-Request-Id` header),
 * and the top-level `success` boolean discriminates. Errors use a stable
 * envelope: `{ success: false, error: { type, code, message }, requestId }`.
 */

export type ApiErrorType =
  | "invalid_request"
  | "permission_error"
  | "pharmacy_error"
  | "api_error";

export function newRequestId(): string {
  return `req_${randomBytes(12).toString("hex")}`;
}

export function jsonOk(
  requestId: string,
  body: Record<string, unknown>,
  init?: { headers?: Record<string, string> },
): NextResponse {
  return NextResponse.json(
    { success: true, ...body, requestId },
    { status: 200, headers: { "X-Request-Id": requestId, ...init?.headers } },
  );
}

export function jsonError(
  requestId: string,
  status: number,
  type: ApiErrorType,
  code: string,
  message: string,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { success: false, error: { type, code, message }, requestId },
    { status, headers: { "X-Request-Id": requestId, ...headers } },
  );
}

/** Maps order-pipeline failure codes to HTTP status + error type. */
export function failureToHttp(code: SubmitOrderFailureCode): {
  status: number;
  type: ApiErrorType;
} {
  switch (code) {
    case "CLINIC_NOT_FOUND":
    case "CLINIC_NOT_VERIFIED":
    case "ORDERING_NOT_ENABLED":
      return { status: 403, type: "permission_error" };
    case "VALIDATION_FAILED":
    case "PATIENT_NOT_FOUND":
    case "PRESCRIBER_NOT_FOUND":
    case "PRODUCT_NOT_AVAILABLE":
    case "PRODUCT_NOT_ORDERABLE":
    case "CONTROLLED_SUBSTANCE":
      return { status: 422, type: "invalid_request" };
    case "PHARMACY_REJECTED":
      return { status: 502, type: "pharmacy_error" };
    case "PHARMACY_UNREACHABLE":
      return { status: 503, type: "pharmacy_error" };
    case "INTERNAL_ERROR":
      return { status: 500, type: "api_error" };
  }
}

export type AuthedHandlerResult =
  | { ok: true; auth: ClinicApiAuth; requestId: string }
  | { ok: false; response: NextResponse };

/**
 * Authenticates + rate limits a clinic API request. Key resolution enforces
 * clinic isolation; the ordering-enabled gate stays in the order pipeline so
 * read endpoints keep working for enrolled-but-disabled clinics.
 */
export async function authenticateRequest(
  req: NextRequest,
): Promise<AuthedHandlerResult> {
  const requestId = newRequestId();

  const auth = await authenticateClinicApiKey(req.headers);
  if (!auth) {
    return {
      ok: false,
      response: jsonError(
        requestId,
        401,
        "permission_error",
        "UNAUTHORIZED",
        "Missing or invalid API key. Send `Authorization: Bearer lxck_...` or `X-Api-Key: lxck_...`.",
      ),
    };
  }

  const limit = await rateLimitKey("api", `clinic-api:${auth.keyId}`);
  if (!limit.success) {
    return {
      ok: false,
      response: jsonError(
        requestId,
        429,
        "api_error",
        "RATE_LIMITED",
        "Too many requests. Slow down and retry shortly.",
        rateLimitHeaders(limit),
      ),
    };
  }

  return { ok: true, auth, requestId };
}
