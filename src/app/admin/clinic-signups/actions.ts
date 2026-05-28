"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicSignups } from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";

export async function updateClinicStatus(
  id: number,
  status: "new" | "contacted" | "onboarded" | "archived",
) {
  await requireAdmin({ minRole: ADMIN_ROLE });

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("invalid id");
  }
  if (
    status !== "new" &&
    status !== "contacted" &&
    status !== "onboarded" &&
    status !== "archived"
  ) {
    throw new Error("invalid status");
  }

  await db
    .update(clinicSignups)
    .set({ status })
    .where(eq(clinicSignups.id, id));

  revalidatePath("/admin/clinic-signups");
  revalidatePath("/admin");
}
