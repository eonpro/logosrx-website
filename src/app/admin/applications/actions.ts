"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { employmentApplications } from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";

export async function updateApplicationStatus(
  id: number,
  status: "new" | "reviewed" | "archived",
) {
  await requireAdmin({ minRole: ADMIN_ROLE });

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("invalid id");
  }
  if (status !== "new" && status !== "reviewed" && status !== "archived") {
    throw new Error("invalid status");
  }

  await db
    .update(employmentApplications)
    .set({ status })
    .where(eq(employmentApplications.id, id));

  revalidatePath("/admin/applications");
  revalidatePath("/admin");
}
