"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clinicSignups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateClinicStatus(
  id: number,
  status: "new" | "contacted" | "onboarded" | "archived",
) {
  await db
    .update(clinicSignups)
    .set({ status })
    .where(eq(clinicSignups.id, id));

  revalidatePath("/admin/clinic-signups");
  revalidatePath("/admin");
}
