/**
 * Pure goal/quota math (no DB, no server-only) so it's unit-testable and
 * shareable with client components. The DB-backed progress queries live in
 * `goals.ts`.
 */

export type GoalMetric = "revenue" | "commission";
export type GoalPeriod = "month" | "quarter" | "year";

export const GOAL_PERIOD_LABEL: Record<GoalPeriod, string> = {
  month: "This month",
  quarter: "This quarter",
  year: "This year",
};

export interface GoalProgress {
  id: number;
  scope: "org" | "rep";
  repId: number | null;
  repName: string | null;
  metric: GoalMetric;
  period: GoalPeriod;
  targetCents: number;
  actualCents: number;
  pct: number;
}

/** Start of the current period (server-local), for measuring goal progress. */
export function periodStart(period: GoalPeriod, now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (period === "month") {
    d.setDate(1);
  } else if (period === "quarter") {
    d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
  } else {
    d.setMonth(0, 1);
  }
  return d;
}

/** Progress percent, clamped to 0..100 (0 target → 0%). */
export function goalProgressPct(
  actualCents: number,
  targetCents: number,
): number {
  if (targetCents <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((actualCents / targetCents) * 100)));
}
