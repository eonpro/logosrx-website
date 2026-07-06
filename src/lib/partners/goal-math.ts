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

/**
 * Start of the current period (UTC), for measuring goal progress.
 *
 * UTC on purpose: transaction dates are stored as UTC midnights (CSV imports
 * parse `YYYY-MM-DD` with the Date constructor's UTC semantics), so a
 * server-local boundary would drop early-period transactions on any non-UTC
 * deployment.
 */
export function periodStart(period: GoalPeriod, now: Date = new Date()): Date {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  if (period === "month") return new Date(Date.UTC(y, m, 1));
  if (period === "quarter") {
    return new Date(Date.UTC(y, Math.floor(m / 3) * 3, 1));
  }
  return new Date(Date.UTC(y, 0, 1));
}

/** Progress percent, clamped to 0..100 (0 target → 0%). */
export function goalProgressPct(
  actualCents: number,
  targetCents: number,
): number {
  if (targetCents <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((actualCents / targetCents) * 100)));
}
