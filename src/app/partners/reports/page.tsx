export const dynamic = "force-dynamic";

import Link from "next/link";
import { getPartnerContext } from "@/lib/auth/partner";
import { formatCents } from "@/lib/partners/commission";
import { resolveDateRange } from "@/lib/partners/dates";
import {
  getCommissionSummary,
  getRevenueSummary,
} from "@/lib/partners/queries";
import {
  getPartnerTrend,
  getRepProduction,
  listBookOfBusiness,
} from "@/lib/partners/crm";
import { PageHeader, EmptyState, tableWrapClass, theadClass, rowClass } from "@/components/ui/portal";
import PartnerNoAccess from "../PartnerNoAccess";
import RangeFilter from "../RangeFilter";
import MonthlyTrend from "../MonthlyTrend";
import { KpiCard } from "../Kpi";

function ExportButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-beige-dark bg-white px-4 py-1.5 text-xs font-semibold text-navy/75 transition-all hover:border-navy/40 hover:text-navy active:scale-[0.98]"
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M7 1v8m0 0L4 6m3 3l3-3M2 11v1a1 1 0 001 1h8a1 1 0 001-1v-1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </a>
  );
}

export default async function PartnerReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  const { range } = await searchParams;
  const resolved = resolveDateRange(range);
  const rangeParam = `?range=${resolved.id}`;

  const [revenue, commission, trend, repProduction, book] = await Promise.all([
    getRevenueSummary(ctx, resolved.from),
    getCommissionSummary(ctx, resolved.from),
    getPartnerTrend(ctx),
    ctx.kind === "org"
      ? getRepProduction(ctx.org.id, resolved.from)
      : Promise.resolve([]),
    listBookOfBusiness(ctx, resolved.from),
  ]);

  const topCompanies = [...book]
    .filter((c) => c.revenueCents > 0)
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 10);

  return (
    <div>
      <PageHeader
        eyebrow="Partner Portal"
        title="Reports"
        description={`Performance for ${resolved.label.toLowerCase()}. Export any view as CSV.`}
        actions={<RangeFilter current={resolved.id} basePath="/partners/reports" />}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <ExportButton
          href={`/partners/exports/book${rangeParam}`}
          label="Export book of business"
        />
        <ExportButton
          href={`/partners/exports/transactions${rangeParam}`}
          label="Export transactions"
        />
        {ctx.kind === "org" && (
          <ExportButton
            href={`/partners/exports/reps${rangeParam}`}
            label="Export rep production"
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`Revenue (${resolved.label})`}
          value={formatCents(revenue.revenueCents)}
          sub={`${revenue.transactionCount} transaction${revenue.transactionCount === 1 ? "" : "s"}`}
        />
        <KpiCard
          label="Commission earned"
          value={formatCents(commission.ownCents)}
          accent
        />
        <KpiCard
          label="Paid to date"
          value={formatCents(commission.paidCents)}
        />
        <KpiCard
          label="Unpaid"
          value={formatCents(commission.unpaidCents)}
        />
      </div>

      <div className="mt-6">
        <MonthlyTrend data={trend} />
      </div>

      {ctx.kind === "org" && repProduction.length > 0 && (
        <div className={`mt-6 overflow-x-auto ${tableWrapClass}`}>
          <div className="border-b border-beige px-5 py-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
              Revenue by rep ({resolved.label})
            </h2>
          </div>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Rep</th>
                <th className="px-5 py-4 font-semibold text-right">Companies</th>
                <th className="px-5 py-4 font-semibold text-right">Revenue</th>
                <th className="px-5 py-4 font-semibold text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {repProduction.map((rep) => (
                <tr key={rep.id} className={rowClass}>
                  <td className="px-5 py-4">
                    <Link
                      href={`/partners/reps/${rep.id}`}
                      className="font-medium text-navy hover:text-magenta"
                    >
                      {rep.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {rep.clinicCount}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatCents(rep.revenueCents)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums font-semibold">
                    {formatCents(rep.commissionCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={`mt-6 overflow-x-auto ${tableWrapClass}`}>
        <div className="border-b border-beige px-5 py-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Top companies ({resolved.label})
          </h2>
        </div>
        {topCompanies.length === 0 ? (
          <EmptyState title="No revenue in this period yet" />
        ) : (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Company</th>
                <th className="px-5 py-4 font-semibold text-right">Revenue</th>
                <th className="px-5 py-4 font-semibold text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {topCompanies.map((c) => (
                <tr key={c.id} className={rowClass}>
                  <td className="px-5 py-4">
                    <Link
                      href={`/partners/clinics/${c.id}`}
                      className="font-medium text-navy hover:text-magenta"
                    >
                      {c.clinicName ?? `Clinic #${c.id}`}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatCents(c.revenueCents)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums font-semibold">
                    {formatCents(c.commissionCents)}
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
