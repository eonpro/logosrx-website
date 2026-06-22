import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerGoals } from "@/lib/db/schema";
import type { PartnerContext } from "@/lib/auth/partner";
import {
  getCommissionSummary,
  getRevenueSummary,
} from "@/lib/partners/queries";
import { getRepProduction } from "@/lib/partners/crm";
import {
  goalProgressPct,
  periodStart,
  type GoalMetric,
  type GoalPeriod,
  type GoalProgress,
} from "@/lib/partners/goal-math";

export {
  goalProgressPct,
  periodStart,
  GOAL_PERIOD_LABEL,
} from "@/lib/partners/goal-math";
export type { GoalMetric, GoalPeriod, GoalProgress } from "@/lib/partners/goal-math";

interface GoalRow {
  id: number;
  repId: number | null;
  metric: GoalMetric;
  period: GoalPeriod;
  targetCents: number;
}

/** Raw goals for an org. */
export async function listGoals(orgId: number): Promise<GoalRow[]> {
  const rows = await db
    .select({
      id: partnerGoals.id,
      repId: partnerGoals.repId,
      metric: partnerGoals.metric,
      period: partnerGoals.period,
      targetCents: partnerGoals.targetCents,
    })
    .from(partnerGoals)
    .where(eq(partnerGoals.orgId, orgId));
  return rows as GoalRow[];
}

/**
 * Goals applicable to the CURRENT viewer (org owner → org-wide goals; rep →
 * their own), each with this-period actuals. Used on the dashboard.
 */
export async function getViewerGoalProgress(
  ctx: PartnerContext,
): Promise<GoalProgress[]> {
  const all = await listGoals(ctx.org.id);
  const mine = all.filter((g) =>
    ctx.kind === "org" ? g.repId == null : g.repId === ctx.rep!.id,
  );
  if (mine.length === 0) return [];

  // getRevenueSummary/getCommissionSummary are already scoped to the viewer
  // (org → org totals; rep → that rep's totals), so a per-period lookup works
  // for both. Cache by period to avoid duplicate queries.
  const revByPeriod = new Map<GoalPeriod, number>();
  const commByPeriod = new Map<GoalPeriod, number>();

  const out: GoalProgress[] = [];
  for (const g of mine) {
    const from = periodStart(g.period);
    let actual: number;
    if (g.metric === "revenue") {
      if (!revByPeriod.has(g.period)) {
        revByPeriod.set(g.period, (await getRevenueSummary(ctx, from)).revenueCents);
      }
      actual = revByPeriod.get(g.period)!;
    } else {
      if (!commByPeriod.has(g.period)) {
        commByPeriod.set(g.period, (await getCommissionSummary(ctx, from)).ownCents);
      }
      actual = commByPeriod.get(g.period)!;
    }
    out.push({
      id: g.id,
      scope: ctx.kind === "org" ? "org" : "rep",
      repId: g.repId,
      repName: ctx.kind === "rep" ? ctx.rep!.name : null,
      metric: g.metric,
      period: g.period,
      targetCents: g.targetCents,
      actualCents: actual,
      pct: goalProgressPct(actual, g.targetCents),
    });
  }
  return out;
}

/**
 * Every goal in the org (org-wide + per-rep) with this-period progress. Used on
 * the org-only goals management page. Org-owner context required.
 */
export async function getAllGoalProgress(
  ctx: PartnerContext,
): Promise<GoalProgress[]> {
  const goals = await listGoals(ctx.org.id);
  if (goals.length === 0) return [];

  const periods = Array.from(new Set(goals.map((g) => g.period)));

  // Org-scope actuals per period.
  const orgRev = new Map<GoalPeriod, number>();
  const orgComm = new Map<GoalPeriod, number>();
  // Per-rep actuals per period: repId -> { rev, comm }.
  const repByPeriod = new Map<
    GoalPeriod,
    Map<number, { rev: number; comm: number; name: string }>
  >();

  for (const period of periods) {
    const from = periodStart(period);
    const [rev, comm, production] = await Promise.all([
      getRevenueSummary(ctx, from),
      getCommissionSummary(ctx, from),
      getRepProduction(ctx.org.id, from),
    ]);
    orgRev.set(period, rev.revenueCents);
    orgComm.set(period, comm.ownCents);
    repByPeriod.set(
      period,
      new Map(
        production.map((r) => [
          r.id,
          { rev: r.revenueCents, comm: r.commissionCents, name: r.name },
        ]),
      ),
    );
  }

  return goals.map((g) => {
    let actual = 0;
    let repName: string | null = null;
    if (g.repId == null) {
      actual = g.metric === "revenue" ? orgRev.get(g.period)! : orgComm.get(g.period)!;
    } else {
      const r = repByPeriod.get(g.period)!.get(g.repId);
      repName = r?.name ?? null;
      actual = g.metric === "revenue" ? (r?.rev ?? 0) : (r?.comm ?? 0);
    }
    return {
      id: g.id,
      scope: g.repId == null ? ("org" as const) : ("rep" as const),
      repId: g.repId,
      repName,
      metric: g.metric,
      period: g.period,
      targetCents: g.targetCents,
      actualCents: actual,
      pct: goalProgressPct(actual, g.targetCents),
    };
  });
}

/** Finds an existing goal for a scope/metric/period (handles NULL repId). */
export async function findGoal(
  orgId: number,
  repId: number | null,
  metric: GoalMetric,
  period: GoalPeriod,
): Promise<{ id: number } | null> {
  const rows = await db
    .select({ id: partnerGoals.id, repId: partnerGoals.repId })
    .from(partnerGoals)
    .where(
      and(
        eq(partnerGoals.orgId, orgId),
        eq(partnerGoals.metric, metric),
        eq(partnerGoals.period, period),
      ),
    );
  const match = rows.find((r) => (r.repId ?? null) === (repId ?? null));
  return match ? { id: match.id } : null;
}
