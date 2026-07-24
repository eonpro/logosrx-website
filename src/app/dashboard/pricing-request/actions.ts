"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics } from "@/lib/db/schema";
import { getClinicGate } from "@/lib/onboarding/data";
import { recordAudit } from "@/lib/audit/log";
import { rateLimitKey } from "@/lib/security/rate-limit";
import { notifyPricingRequest } from "@/lib/notifications/slack";
import { getCatalogProducts } from "@/lib/catalog/store";
import { createPricingRequest } from "@/lib/pricing-requests/data";
import {
  validatePricingRequestInput,
  type VolumeBand,
} from "@/lib/pricing-requests/validate";

export type SubmitPricingRequestResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

/**
 * Verified clinics can request volume/custom pricing. Creates a
 * `pricing_requests` row and Slack-alerts super admins.
 */
export async function submitPricingRequest(input: {
  volumeBand: string;
  productIds: string[];
  message: string;
}): Promise<SubmitPricingRequestResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Please sign in to continue." };

  const limit = await rateLimitKey("form", `pricing-request:${userId}`);
  if (!limit.success) {
    return {
      ok: false,
      error: "Too many requests. Please wait a minute and try again.",
    };
  }

  const gate = await getClinicGate(userId);
  if (!gate.onboardingCompleted || gate.clinicId === null) {
    return { ok: false, error: "Finish account setup before requesting pricing." };
  }
  if (gate.verificationStatus !== "verified") {
    return {
      ok: false,
      error: "Custom pricing is available after your account is verified.",
    };
  }

  const volumeBand = input.volumeBand;
  const productIds = Array.isArray(input.productIds)
    ? [...new Set(input.productIds.map((id) => id.trim()).filter(Boolean))]
    : [];
  const message = (input.message ?? "").trim();

  const validationError = validatePricingRequestInput({
    volumeBand,
    productIds,
    message,
  });
  if (validationError) return { ok: false, error: validationError };

  // Drop unknown SKUs so admins never see stale ids.
  const catalog = await getCatalogProducts();
  const known = new Set(catalog.map((p) => p.id));
  const filteredIds = productIds.filter((id) => known.has(id));

  let requestId: number;
  try {
    requestId = await createPricingRequest({
      clinicId: gate.clinicId,
      volumeBand: volumeBand as VolumeBand,
      productIds: filteredIds,
      message: message || null,
    });
  } catch {
    return { ok: false, error: "Could not submit your request. Please try again." };
  }

  const [clinic] = await db
    .select({
      clinicName: clinics.clinicName,
      contactEmail: clinics.contactEmail,
      contactName: clinics.contactName,
    })
    .from(clinics)
    .where(eq(clinics.id, gate.clinicId))
    .limit(1);

  const nameById = new Map(catalog.map((p) => [p.id, p.name]));
  const productNames = filteredIds.map(
    (id) => nameById.get(id) ?? id,
  );

  await recordAudit({
    actorType: "clinic",
    actorId: userId,
    actorEmail: clinic?.contactEmail ?? null,
    action: "clinic.pricing_request_create",
    targetType: "pricing_request",
    targetId: requestId,
    metadata: {
      clinicId: gate.clinicId,
      volumeBand,
      productCount: filteredIds.length,
    },
  });

  // Best-effort Slack — never fail the clinic submit if the webhook is down.
  void notifyPricingRequest({
    requestId,
    clinicId: gate.clinicId,
    clinicName: clinic?.clinicName?.trim() || "Clinic",
    contactEmail: clinic?.contactEmail?.trim() || "",
    volumeBand,
    productNames,
    message,
  });

  return { ok: true, id: requestId };
}
