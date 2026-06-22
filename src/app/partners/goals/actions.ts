"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerGoals, partnerReps } from "@/lib/db/schema";
import { requirePartner } from "@/lib/auth/partner";
import { findGoal, type GoalMetric, type GoalPeriod } from "@/lib/partners/goals";
import { recordPartnerAudit } from "@/lib/audit/log";

export interface GoalActionResult {
  ok: boolean;
  error?: string;
}

const METRICS = ["revenue", "commission"] as const;
const PERIODS = ["month", "quarter", "year"] as const;

/**
 * Creates or updates a goal/quota. Org owners only. `repId` null = an org-wide
 * goal. Idempotent per (org, rep, metric, period): re-setting updates the
 * target rather than creating a duplicate.
 */
export async function setGoal(input: {
  repId: number | null;
  metric: string;
  period: string;
  targetDollars: number;
}): Promise<GoalActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });

  if (!METRICS.includes(input.metric as GoalMetric)) {
    return { ok: false, error: "Invalid metric." };
  }
  if (!PERIODS.includes(input.period as GoalPeriod)) {
    return { ok: false, error: "Invalid period." };
  }
  if (!Number.isFinite(input.targetDollars) || input.targetDollars <= 0) {
    return { ok: false, error: "Enter a target greater than zero." };
  }
  const metric = input.metric as GoalMetric;
  const period = input.period as GoalPeriod;
  const targetCents = Math.round(input.targetDollars * 100);

  // Validate the rep belongs to this org.
  if (input.repId != null) {
    const [rep] = await db
      .select({ id: partnerReps.id })
      .from(partnerReps)
      .where(
        and(eq(partnerReps.id, input.repId), eq(partnerReps.orgId, ctx.org.id)),
      )
      .limit(1);
    if (!rep) return { ok: false, error: "Rep not found." };
  }

  const existing = await findGoal(ctx.org.id, input.repId, metric, period);
  if (existing) {
    await db
      .update(partnerGoals)
      .set({ targetCents, updatedAt: new Date() })
      .where(eq(partnerGoals.id, existing.id));
  } else {
    await db.insert(partnerGoals).values({
      orgId: ctx.org.id,
      repId: input.repId,
      metric,
      period,
      targetCents,
      createdBy: ctx.userId,
    });
  }

  await recordPartnerAudit(
    ctx,
    "partner.goal_set",
    { type: "partner_org", id: ctx.org.id },
    { repId: input.repId, metric, period, targetCents },
  );

  revalidatePath("/partners/goals");
  revalidatePath("/partners");
  return { ok: true };
}

/** Deletes a goal (org owners only, must belong to the org). */
export async function deleteGoal(goalId: number): Promise<GoalActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });
  if (!Number.isInteger(goalId) || goalId <= 0) {
    return { ok: false, error: "Invalid goal." };
  }

  const deleted = await db
    .delete(partnerGoals)
    .where(and(eq(partnerGoals.id, goalId), eq(partnerGoals.orgId, ctx.org.id)))
    .returning({ id: partnerGoals.id });
  if (deleted.length === 0) return { ok: false, error: "Goal not found." };

  await recordPartnerAudit(ctx, "partner.goal_delete", {
    type: "partner_org",
    id: ctx.org.id,
  });

  revalidatePath("/partners/goals");
  revalidatePath("/partners");
  return { ok: true };
}
