"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getClinicGate } from "@/lib/onboarding/data";
import { dismissPricingUpdateBanner } from "@/lib/pricing-requests/data";

export type DismissBannerResult = { ok: true } | { ok: false; error: string };

/** Clinic dismisses the catalog “pricing updated” banner. */
export async function dismissPricingUpdatedBanner(): Promise<DismissBannerResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Please sign in." };

  const gate = await getClinicGate(userId);
  if (!gate.clinicId || gate.verificationStatus !== "verified") {
    return { ok: false, error: "Not available." };
  }

  await dismissPricingUpdateBanner(gate.clinicId);
  revalidatePath("/dashboard");
  return { ok: true };
}
