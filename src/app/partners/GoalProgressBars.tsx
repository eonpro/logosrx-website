import { formatCents } from "@/lib/partners/commission";
import {
  GOAL_PERIOD_LABEL,
  type GoalProgress,
} from "@/lib/partners/goal-math";

const METRIC_LABEL: Record<string, string> = {
  revenue: "Revenue",
  commission: "Commission",
};

/** Read-only goal progress bars. `showScope` prefixes org/rep ownership. */
export default function GoalProgressBars({
  goals,
  showScope = false,
}: {
  goals: GoalProgress[];
  showScope?: boolean;
}) {
  if (goals.length === 0) return null;
  return (
    <div className="space-y-4">
      {goals.map((g) => {
        const reached = g.pct >= 100;
        return (
          <div key={g.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-medium text-navy">
                {showScope && (
                  <span className="text-navy/55">
                    {g.scope === "org" ? "Organization" : (g.repName ?? "Rep")} ·{" "}
                  </span>
                )}
                {METRIC_LABEL[g.metric] ?? g.metric} ·{" "}
                {GOAL_PERIOD_LABEL[g.period]}
              </span>
              <span className="tabular-nums text-navy/70">
                {formatCents(g.actualCents)} / {formatCents(g.targetCents)}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-beige">
              <div
                className={`h-full rounded-full ${reached ? "bg-emerald-500" : "bg-magenta"}`}
                style={{ width: `${g.pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-navy/55">
              {g.pct}% of target{reached ? " — reached 🎉" : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
