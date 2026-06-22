export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPartnerContext } from "@/lib/auth/partner";
import { formatBps, formatCents } from "@/lib/partners/commission";
import { getRepDetail } from "@/lib/partners/crm";
import PartnerNoAccess from "../../PartnerNoAccess";
import MonthlyTrend from "../../MonthlyTrend";
import { KpiCard, StatusBadge } from "../../Kpi";

export default async function PartnerRepDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getPartnerContext();
  // Rep production is an org-owner view.
  if (!ctx || ctx.kind !== "org") return <PartnerNoAccess />;

  const { id: raw } = await params;
  const repId = Number(raw);
  if (!Number.isInteger(repId) || repId <= 0) notFound();

  const rep = await getRepDetail(ctx.org.id, repId, ctx);
  if (!rep) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/partners/reps"
          className="text-xs font-medium text-navy/55 hover:text-magenta"
        >
          ← Reps
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-navy">{rep.name}</h1>
          <StatusBadge
            status={
              rep.status === "active" && !rep.activated ? "pending" : rep.status
            }
          />
        </div>
        <p className="mt-1 text-sm text-navy/70">
          {rep.email} · {formatBps(rep.commissionRateBps)} commission rate
          {rep.status === "active" && !rep.activated && " · invite not yet activated"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Companies" value={String(rep.clinicCount)} />
        <KpiCard
          label="Revenue generated"
          value={formatCents(rep.revenueCents)}
        />
        <KpiCard
          label="Commission earned"
          value={formatCents(rep.commission.earnedCents)}
          accent
        />
        <KpiCard
          label="Payable now"
          value={formatCents(rep.commission.payableCents)}
          sub={
            rep.commission.awaitingCents > 0
              ? `+ ${formatCents(rep.commission.awaitingCents)} awaiting`
              : undefined
          }
        />
        <KpiCard label="Paid to date" value={formatCents(rep.commission.paidCents)} />
      </div>

      <div className="mt-6">
        <MonthlyTrend data={rep.trend} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-beige bg-white">
        <div className="border-b border-beige px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">
            Book of business ({rep.clinics.length})
          </h2>
        </div>
        {rep.clinics.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-navy/65">
            No companies linked to this rep yet.
          </p>
        ) : (
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Revenue</th>
                <th className="px-5 py-3 font-semibold text-right">Commission</th>
                <th className="px-5 py-3 font-semibold">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {rep.clinics.map((c) => (
                <tr key={c.id} className="hover:bg-cream/40">
                  <td className="px-5 py-3">
                    <Link
                      href={`/partners/clinics/${c.id}`}
                      className="font-medium text-navy hover:text-magenta"
                    >
                      {c.clinicName ?? `Clinic #${c.id}`}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={c.verificationStatus} />
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatCents(c.revenueCents)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
                    {formatCents(c.commissionCents)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-navy/70">
                    {c.lastTransactionDate
                      ? c.lastTransactionDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
