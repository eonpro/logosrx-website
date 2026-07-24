"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { recordAdminAudit } from "@/lib/audit/log";
import { updatePricingRequestStatus } from "@/lib/pricing-requests/data";

export type ReviewPricingRequestResult =
  | { ok: true }
  | { ok: false; error: string };

const STATUSES = new Set(["reviewed", "closed"]);

/**
 * Marks a clinic pricing request as reviewed or closed. Full admins only.
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
  if (note.length > 2000) {
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
