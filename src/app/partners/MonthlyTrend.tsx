import { formatCents } from "@/lib/partners/commission";
import type { MonthPoint } from "@/lib/partners/crm";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function label(month: string): string {
  const m = Number(month.slice(5, 7));
  return MONTH_LABELS[m - 1] ?? month;
}

/**
 * Lightweight revenue-by-month bar chart (no chart lib). Each bar's height is
 * proportional to that month's revenue; commission is shown on hover via the
 * native title. Pure server component.
 */
export default function MonthlyTrend({ data }: { data: MonthPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenueCents));
  const totalRev = data.reduce((s, d) => s + d.revenueCents, 0);
  const totalComm = data.reduce((s, d) => s + d.commissionCents, 0);

  return (
    <div className="rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Revenue — last 12 months
        </h2>
        <p className="text-xs text-navy/60">
          {formatCents(totalRev)} revenue ·{" "}
          <span className="font-semibold text-navy">
            {formatCents(totalComm)} commission
          </span>
        </p>
      </div>

      <div className="mt-6 flex h-40 items-end gap-1.5">
        {data.map((d) => {
          const pct = Math.round((d.revenueCents / max) * 100);
          return (
            <div
              key={d.month}
              className="flex flex-1 flex-col items-center gap-1"
              title={`${d.month}: ${formatCents(d.revenueCents)} revenue, ${formatCents(d.commissionCents)} commission`}
            >
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-magenta/80"
                  style={{ height: `${Math.max(pct, d.revenueCents > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-navy/50">{label(d.month)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
