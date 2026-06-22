/** Small KPI stat card shared across the CRM detail pages. */
export function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? "border-magenta/20 bg-magenta/5" : "border-beige bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-navy/55">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-navy">{value}</p>
      {sub != null && <p className="mt-1 text-xs text-navy/60">{sub}</p>}
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  verified: "bg-emerald-100 text-emerald-700",
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-gray-100 text-gray-500",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        STATUS_BADGE[status] ?? "bg-gray-100 text-gray-500"
      }`}
    >
      {status}
    </span>
  );
}

const STAGE_STYLE: Record<string, { label: string; cls: string }> = {
  lead: { label: "Lead", cls: "bg-sky-100 text-sky-700" },
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700" },
  at_risk: { label: "At risk", cls: "bg-amber-100 text-amber-700" },
  dormant: { label: "Dormant", cls: "bg-gray-100 text-gray-500" },
};

export function StageBadge({ stage }: { stage: string }) {
  const s = STAGE_STYLE[stage] ?? { label: stage, cls: "bg-gray-100 text-gray-500" };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
