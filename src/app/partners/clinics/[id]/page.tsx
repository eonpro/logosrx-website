export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPartnerContext } from "@/lib/auth/partner";
import { formatCents } from "@/lib/partners/commission";
import { formatTransactionDate } from "@/lib/partners/dates";
import {
  getClinicDetail,
  getClinicMeta,
  getClinicTimeline,
} from "@/lib/partners/crm";
import { EmptyState, btnGhost, tableWrapClass, theadClass, rowClass } from "@/components/ui/portal";
import PartnerNoAccess from "../../PartnerNoAccess";
import MonthlyTrend from "../../MonthlyTrend";
import { KpiCard, StageBadge, StatusBadge } from "../../Kpi";
import ClinicRelationship from "./ClinicRelationship";
import ActivityTimeline from "./ActivityTimeline";

export default async function PartnerClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  const { id: raw } = await params;
  const clinicId = Number(raw);
  if (!Number.isInteger(clinicId) || clinicId <= 0) notFound();

  const clinic = await getClinicDetail(ctx, clinicId);
  if (!clinic) notFound();

  const [meta, timeline] = await Promise.all([
    getClinicMeta(ctx, clinicId),
    getClinicTimeline(ctx, clinicId, clinic.createdAt),
  ]);

  return (
    <div>
      <div className="mb-8">
        <Link href="/partners/network" className={`${btnGhost} -ml-4`}>
          ← Book of business
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            {clinic.clinicName ?? `Clinic #${clinic.id}`}
          </h1>
          <StageBadge stage={meta.stage} />
          <StatusBadge status={clinic.verificationStatus} />
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-navy/55">
          {clinic.contactName}
          {clinic.contactEmail ? ` · ${clinic.contactEmail}` : ""}
          {clinic.contactPhone ? ` · ${clinic.contactPhone}` : ""}
          {ctx.kind === "org" && (
            <>
              {" "}
              · Rep:{" "}
              {clinic.repId ? (
                <Link
                  href={`/partners/reps/${clinic.repId}`}
                  className="text-magenta hover:underline"
                >
                  {clinic.repName}
                </Link>
              ) : (
                "Organization (direct)"
              )}
            </>
          )}
          {" · Joined "}
          {clinic.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Lifetime revenue"
          value={formatCents(clinic.revenueCents)}
          sub={`${clinic.txCount} transaction${clinic.txCount === 1 ? "" : "s"}`}
        />
        <KpiCard
          label="Commission earned"
          value={formatCents(clinic.commission.earnedCents)}
          accent
        />
        <KpiCard
          label="Payable now"
          value={formatCents(clinic.commission.payableCents)}
          sub={
            clinic.commission.awaitingCents > 0
              ? `+ ${formatCents(clinic.commission.awaitingCents)} awaiting`
              : undefined
          }
        />
        <KpiCard
          label="Paid to date"
          value={formatCents(clinic.commission.paidCents)}
        />
      </div>

      <div className="mt-6">
        <MonthlyTrend data={clinic.trend} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ClinicRelationship
          clinicId={clinic.id}
          stage={meta.stage}
          tags={meta.tags}
        />
        <ActivityTimeline events={timeline} />
      </div>

      <div className={`mt-6 overflow-x-auto ${tableWrapClass}`}>
        <div className="border-b border-beige px-5 py-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Transactions ({clinic.transactions.length})
          </h2>
        </div>
        {clinic.transactions.length === 0 ? (
          <EmptyState title="No transactions recorded for this company yet" />
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Description</th>
                <th className="px-5 py-4 font-semibold">Reference</th>
                <th className="px-5 py-4 font-semibold text-right">Revenue</th>
                <th className="px-5 py-4 font-semibold text-right">
                  Your commission
                </th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {clinic.transactions.map((tx) => (
                <tr key={tx.id} className={rowClass}>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {formatTransactionDate(tx.transactionDate)}
                  </td>
                  <td className="px-5 py-4">{tx.description ?? "—"}</td>
                  <td className="px-5 py-4 font-mono text-xs">
                    {tx.reference ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatCents(tx.revenueCents)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums font-semibold">
                    {formatCents(tx.commissionCents)}
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
