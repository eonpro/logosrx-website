"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics } from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";

type VerificationStatus = "pending" | "verified" | "rejected";

const VALID: ReadonlySet<VerificationStatus> = new Set<VerificationStatus>([
  "pending",
  "verified",
  "rejected",
]);

/**
 * Sets a clinic's admin verification state. Restricted to full admins (viewers
 * are read-only). Records who acted and when so the review trail is auditable.
 */
export async function setClinicVerification(
  id: number,
  status: VerificationStatus,
) {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("invalid id");
  }
  if (!VALID.has(status)) {
    throw new Error("invalid status");
  }

  await db
    .update(clinics)
    .set({
      verificationStatus: status,
      verifiedAt: status === "pending" ? null : new Date(),
      verifiedBy: status === "pending" ? null : ctx.userId,
      updatedAt: new Date(),
    })
    .where(eq(clinics.id, id));

  revalidatePath("/admin/clinics");
  revalidatePath("/admin");
}
