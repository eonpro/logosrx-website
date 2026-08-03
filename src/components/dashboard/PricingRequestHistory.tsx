import { Badge, cardClass, type BadgeTone } from "@/components/ui/portal";
import type { ClinicPricingRequestItem } from "@/lib/pricing-requests/data";
import { clinicStatusLabel } from "@/lib/pricing-requests/status";
import {
  VOLUME_BAND_LABELS,
  type VolumeBand,
} from "@/lib/pricing-requests/validate";

function toneFor(
  status: ClinicPricingRequestItem["status"],
): BadgeTone {
  if (status === "pending") return "warning";
  if (status === "reviewed") return "accent";
  return "success";
}

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PricingRequestHistoryProps {
  requests: ClinicPricingRequestItem[];
  productNames: Record<string, string>;
}

export default function PricingRequestHistory({
  requests,
  productNames,
}: PricingRequestHistoryProps) {
  if (requests.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold tracking-tight text-navy">
        Your requests
      </h2>
      <ul className="space-y-3">
        {requests.map((r) => (
          <li key={r.id} className={`${cardClass} p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-navy">
                  {VOLUME_BAND_LABELS[r.volumeBand as VolumeBand] ??
                    r.volumeBand}
                </p>
                <p className="mt-0.5 text-xs text-navy/50">
                  Submitted {fmtDate(r.createdAt)}
                  {r.status === "closed" && r.notifiedAt
                    ? ` · Completed ${fmtDate(r.notifiedAt)}`
                    : r.reviewedAt
                      ? ` · Updated ${fmtDate(r.reviewedAt)}`
                      : ""}
                </p>
              </div>
              <Badge tone={toneFor(r.status)}>
                {clinicStatusLabel(r.status)}
              </Badge>
            </div>

            {r.productIds.length > 0 && (
              <p className="mt-3 text-xs leading-relaxed text-navy/60">
                <span className="font-semibold text-navy/45">Products: </span>
                {r.productIds.map((id) => productNames[id] ?? id).join(", ")}
              </p>
            )}

            {r.message && (
              <p className="mt-2 text-sm leading-relaxed text-navy/70">
                {r.message}
              </p>
            )}

            {r.clinicReply && (
              <div className="mt-3 rounded-2xl border border-beige/80 bg-cream/60 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy/40">
                  From Logos RX
                </p>
                <p className="mt-1 text-sm leading-relaxed text-navy/80">
                  {r.clinicReply}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
