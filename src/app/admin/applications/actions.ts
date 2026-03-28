"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { employmentApplications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateApplicationStatus(
  id: number,
  status: "new" | "reviewed" | "archived",
) {
  await db
    .update(employmentApplications)
    .set({ status })
    .where(eq(employmentApplications.id, id));

  revalidatePath("/admin/applications");
  revalidatePath("/admin");
}
