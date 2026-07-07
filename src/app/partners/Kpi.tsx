import { Badge, type BadgeTone } from "@/components/ui/portal";

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
      className={`rounded-3xl p-6 ${
        accent
          ? "bg-navy text-white shadow-soft-lg"
          : "border border-beige/70 bg-white shadow-soft"
      }`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
          accent ? "text-white/55" : "text-navy/45"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-3 text-3xl font-bold tracking-tight tabular-nums ${
          accent ? "text-white" : "text-navy"
        }`}
      >
        {value}
      </p>
      {sub != null && (
        <p className={`mt-1.5 text-[13px] ${accent ? "text-white/55" : "text-navy/50"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

const STATUS_TONE: Record<string, BadgeTone> = {
  verified: "success",
  active: "success",
  pending: "warning",
  rejected: "danger",
  suspended: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge>;
}

const STAGE_STYLE: Record<string, { label: string; tone: BadgeTone }> = {
  lead: { label: "Lead", tone: "neutral" },
  active: { label: "Active", tone: "success" },
  at_risk: { label: "At risk", tone: "warning" },
  dormant: { label: "Dormant", tone: "neutral" },
};

export function StageBadge({ stage }: { stage: string }) {
  const s = STAGE_STYLE[stage] ?? { label: stage, tone: "neutral" as BadgeTone };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
