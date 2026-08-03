"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { recordAdminAudit } from "@/lib/audit/log";
import { sendPricingUpdatedEmail } from "@/lib/notifications/email";
import {
  completeAndNotifyPricingRequestRow,
  updatePricingRequestStatus,
} from "@/lib/pricing-requests/data";

export type ReviewPricingRequestResult =
  | { ok: true }
  | { ok: false; error: string };

const STATUSES = new Set(["reviewed", "closed"]);
const MAX_NOTE = 2000;

/**
 * Marks a clinic pricing request as reviewed or closed (quiet close — no
 * email / banner). Full admins only.
 */
export async function reviewPricingRequest(input: {
  id: number;
  status: "reviewed" | "closed";
  adminNote: string;
}): Promise<ReviewPricingRequestResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });

  if (!Number.isFinite(input.id) || input.id <= 0) {
    return { ok: false, error: "Invalid request." };
  }
  if (!STATUSES.has(input.status)) {
    return { ok: false, error: "Invalid status." };
  }

  const note = input.adminNote.trim();
  if (note.length > MAX_NOTE) {
    return { ok: false, error: "Note is too long." };
  }

  const ok = await updatePricingRequestStatus({
    id: input.id,
    status: input.status,
    adminNote: note || null,
    reviewedBy: ctx.userId,
    reviewedByEmail: ctx.email,
  });
  if (!ok) return { ok: false, error: "Request not found." };

  await recordAdminAudit(
    ctx,
    "pricing_request.review",
    { type: "pricing_request", id: input.id },
    { status: input.status },
  );

  revalidatePath("/admin/pricing-requests");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Closes the request, stamps notifiedAt (catalog banner), and emails the
 * clinic. Pricing itself is applied via the clinic detail tools beforehand.
 */
export async function completeAndNotifyPricingRequest(input: {
  id: number;
  adminNote: string;
  clinicReply: string;
}): Promise<ReviewPricingRequestResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });

  if (!Number.isFinite(input.id) || input.id <= 0) {
    return { ok: false, error: "Invalid request." };
  }

  const note = input.adminNote.trim();
  const reply = input.clinicReply.trim();
  if (note.length > MAX_NOTE) {
    return { ok: false, error: "Admin note is too long." };
  }
  if (reply.length > MAX_NOTE) {
    return { ok: false, error: "Clinic reply is too long." };
  }

  const clinic = await completeAndNotifyPricingRequestRow({
    id: input.id,
    adminNote: note || null,
    clinicReply: reply || null,
    reviewedBy: ctx.userId,
    reviewedByEmail: ctx.email,
  });
  if (!clinic) return { ok: false, error: "Request not found." };

  await recordAdminAudit(
    ctx,
    "pricing_request.complete_notify",
    { type: "pricing_request", id: input.id },
    { clinicId: clinic.clinicId, emailed: Boolean(clinic.contactEmail) },
  );

  const to = clinic.contactEmail?.trim();
  if (to) {
    void sendPricingUpdatedEmail({
      to,
      contactName: clinic.contactName?.trim() || "",
      clinicName: clinic.clinicName?.trim() || "your practice",
      clinicReply: reply || null,
    });
  }

  revalidatePath("/admin/pricing-requests");
  revalidatePath("/admin");
  revalidatePath(`/admin/clinics/${clinic.clinicId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pricing-request");
  return { ok: true };
}
