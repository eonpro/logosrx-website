"use server";

import { auth } from "@clerk/nextjs/server";

import { rateLimitKey } from "@/lib/security/rate-limit";
import {
  createClinicPatient,
  getClinicOrderingContext,
} from "@/lib/orders/data";
import {
  submitClinicOrder,
  type SubmitOrderResult,
} from "@/lib/orders/service";
import type { Patient } from "@/lib/db/schema";

/**
 * Server actions for the clinic order wizard. Thin wrappers: authenticate
 * with Clerk, rate limit, and delegate to the clinic-isolated order library
 * (which re-resolves the clinic from the Clerk id — clinic identity never
 * comes from the client).
 */

export type PatientActionResult =
  | { ok: true; patient: Patient }
  | { ok: false; error: string };

export async function createPatientAction(
  input: unknown,
): Promise<PatientActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const limit = await rateLimitKey("form", `patient-create:${userId}`);
  if (!limit.success) {
    return { ok: false, error: "Too many requests — try again in a minute." };
  }

  const ctx = await getClinicOrderingContext(userId);
  if (!ctx || !ctx.verified) {
    return { ok: false, error: "Your account is not verified yet." };
  }

  return createClinicPatient(ctx.clinicId, input);
}

export async function submitOrderAction(
  input: unknown,
): Promise<SubmitOrderResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Not authenticated.", code: "CLINIC_NOT_FOUND" };
  }

  const limit = await rateLimitKey("form", `order-submit:${userId}`);
  if (!limit.success) {
    return {
      ok: false,
      error: "Too many requests — try again in a minute.",
      code: "INTERNAL_ERROR",
    };
  }

  return submitClinicOrder(userId, input);
}
