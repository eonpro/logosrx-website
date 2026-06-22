export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPartnerContext } from "@/lib/auth/partner";
import { formatCents } from "@/lib/partners/commission";
import { getClinicDetail } from "@/lib/partners/crm";
import PartnerNoAccess from "../../PartnerNoAccess";
import MonthlyTrend from "../../MonthlyTrend";
import { KpiCard, StatusBadge } from "../../Kpi";

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

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/partners/network"
          className="text-xs font-medium text-navy/55 hover:text-magenta"
        >
          ← Book of business
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-navy">
            {clinic.clinicName ?? `Clinic #${clinic.id}`}
          </h1>
          <StatusBadge status={clinic.verificationStatus} />
        </div>
        <p className="mt-1 text-sm text-navy/70">
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

      <div className="mt-6 overflow-x-auto rounded-2xl border border-beige bg-white">
        <div className="border-b border-beige px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">
            Transactions ({clinic.transactions.length})
          </h2>
        </div>
        {clinic.transactions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-navy/65">
            No transactions recorded for this company yet.
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold text-right">Revenue</th>
                <th className="px-5 py-3 font-semibold text-right">
                  Your commission
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {clinic.transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {tx.transactionDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3">{tx.description ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs">
                    {tx.reference ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatCents(tx.revenueCents)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
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
