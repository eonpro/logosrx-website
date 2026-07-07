export const dynamic = "force-dynamic";

import { getPartnerContext } from "@/lib/auth/partner";
import { formatCents } from "@/lib/partners/commission";
import { formatTransactionDate, resolveDateRange } from "@/lib/partners/dates";
import {
  getCommissionSummary,
  getRevenueSummary,
  listPartnerTransactions,
} from "@/lib/partners/queries";
import { PageHeader, EmptyState, tableWrapClass, theadClass, rowClass } from "@/components/ui/portal";
import PartnerNoAccess from "../PartnerNoAccess";
import RangeFilter from "../RangeFilter";

export default async function PartnerTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  const { range } = await searchParams;
  const resolved = resolveDateRange(range);

  const [transactions, revenue, commission] = await Promise.all([
    listPartnerTransactions(ctx, resolved.from),
    getRevenueSummary(ctx, resolved.from),
    getCommissionSummary(ctx, resolved.from),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Partner Portal"
        title="Transactions"
        description={
          <>
            {revenue.transactionCount} transaction
            {revenue.transactionCount === 1 ? "" : "s"} ·{" "}
            {formatCents(revenue.revenueCents)} revenue ·{" "}
            <span className="font-semibold text-navy">
              {formatCents(commission.ownCents)} your commission
            </span>
            {ctx.kind === "org" && commission.repCents > 0 && (
              <> · {formatCents(commission.repCents)} to reps</>
            )}
          </>
        }
        actions={
          <RangeFilter current={resolved.id} basePath="/partners/transactions" />
        }
      />

      {transactions.length === 0 ? (
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="No transactions in this period"
            body="Try a wider date range, or share your referral links to start earning."
          />
        </div>
      ) : (
        <div className={`overflow-x-auto ${tableWrapClass}`}>
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Clinic</th>
                {ctx.kind === "org" && (
                  <th className="px-5 py-4 font-semibold">Rep</th>
                )}
                <th className="px-5 py-4 font-semibold">Reference</th>
                <th className="px-5 py-4 font-semibold text-right">Revenue</th>
                <th className="px-5 py-4 font-semibold text-right">
                  Your commission
                </th>
                {ctx.kind === "org" && (
                  <th className="px-5 py-4 font-semibold text-right">
                    Rep commission
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-navy">
              {transactions.map((tx) => (
                <tr key={tx.id} className={rowClass}>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {formatTransactionDate(tx.transactionDate)}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-medium">{tx.clinicName ?? "—"}</span>
                    {tx.description && (
                      <span className="block text-xs text-navy/55">
                        {tx.description}
                      </span>
                    )}
                  </td>
                  {ctx.kind === "org" && (
                    <td className="px-5 py-4">{tx.repName ?? "—"}</td>
                  )}
                  <td className="px-5 py-4 font-mono text-xs">
                    {tx.reference ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatCents(tx.revenueCents)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums font-semibold">
                    {formatCents(tx.ownCommissionCents)}
                  </td>
                  {ctx.kind === "org" && (
                    <td className="px-5 py-4 text-right tabular-nums text-navy/70">
                      {tx.repCommissionCents > 0
                        ? formatCents(tx.repCommissionCents)
                        : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
