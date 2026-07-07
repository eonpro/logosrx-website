"use client";

import { useState, useTransition } from "react";
import { formatCents } from "@/lib/partners/commission";
import type { GoalProgress } from "@/lib/partners/goal-math";
import { EmptyState, btnAccent, btnDanger } from "@/components/ui/portal";
import { deleteGoal, setGoal } from "./actions";

const PERIOD_LABEL: Record<string, string> = {
  month: "This month",
  quarter: "This quarter",
  year: "This year",
};
const METRIC_LABEL: Record<string, string> = {
  revenue: "Revenue",
  commission: "Commission",
};

const inputClass =
  "h-10 rounded-full border border-beige-dark bg-white px-4 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-plum focus:ring-2 focus:ring-plum/10";

export default function GoalsManager({
  goals,
  reps,
}: {
  goals: GoalProgress[];
  reps: { id: number; name: string }[];
}) {
  const [scope, setScope] = useState("org");
  const [metric, setMetric] = useState("revenue");
  const [period, setPeriod] = useState("month");
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setError("");
    setNotice("");
    const targetDollars = Number(target);
    if (!Number.isFinite(targetDollars) || targetDollars <= 0) {
      setError("Enter a target greater than zero.");
      return;
    }
    startTransition(async () => {
      const res = await setGoal({
        repId: scope === "org" ? null : Number(scope),
        metric,
        period,
        targetDollars,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save the goal.");
        return;
      }
      setTarget("");
      setNotice("Goal saved.");
    });
  }

  function remove(id: number) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await deleteGoal(id);
      if (!res.ok) setError(res.error ?? "Could not delete the goal.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Set a goal
        </h2>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">Applies to</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className={`${inputClass} w-52`}
            >
              <option value="org">Whole organization</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">Metric</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className={`${inputClass} w-40`}
            >
              <option value="revenue">Revenue</option>
              <option value="commission">Commission</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">Period</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={`${inputClass} w-36`}
            >
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="year">Yearly</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">Target ($)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="50000"
              className={`${inputClass} w-36`}
            />
          </label>
          <button type="submit" disabled={pending} className={btnAccent}>
            {pending ? "Saving…" : "Save goal"}
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-3 text-sm text-emerald-700">
            {notice}
          </p>
        )}
      </div>

      {goals.length === 0 ? (
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="No goals yet"
            body="Set a revenue or commission target above to track progress for your org or a rep."
          />
        </div>
      ) : (
        <div className="rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Active goals ({goals.length})
          </h2>
          <div className="space-y-5">
            {goals.map((g) => {
              const reached = g.pct >= 100;
              return (
                <div key={g.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                    <span className="font-medium text-navy">
                      <span className="text-navy/55">
                        {g.scope === "org" ? "Organization" : (g.repName ?? "Rep")} ·{" "}
                      </span>
                      {METRIC_LABEL[g.metric]} · {PERIOD_LABEL[g.period]}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="tabular-nums text-navy/70">
                        {formatCents(g.actualCents)} / {formatCents(g.targetCents)}
                      </span>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => remove(g.id)}
                        className={`${btnDanger} !px-4 !py-1 !text-xs`}
                      >
                        Remove
                      </button>
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
        </div>
      )}
    </div>
  );
}
