export const dynamic = "force-dynamic";

import { getPartnerContext } from "@/lib/auth/partner";
import { formatCents } from "@/lib/partners/commission";
import { resolveDateRange } from "@/lib/partners/dates";
import {
  getCommissionSummary,
  getRevenueSummary,
  listPartnerTransactions,
} from "@/lib/partners/queries";
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Transactions</h1>
          <p className="text-navy/70 text-sm mt-1">
            {revenue.transactionCount} transaction
            {revenue.transactionCount === 1 ? "" : "s"} ·{" "}
            {formatCents(revenue.revenueCents)} revenue ·{" "}
            <span className="font-semibold text-navy">
              {formatCents(commission.ownCents)} your commission
            </span>
            {ctx.kind === "org" && commission.repCents > 0 && (
              <> · {formatCents(commission.repCents)} to reps</>
            )}
          </p>
        </div>
        <RangeFilter current={resolved.id} basePath="/partners/transactions" />
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/65 text-sm">
            No transactions in this period.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Clinic</th>
                {ctx.kind === "org" && (
                  <th className="px-5 py-3 font-semibold">Rep</th>
                )}
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold text-right">Revenue</th>
                <th className="px-5 py-3 font-semibold text-right">
                  Your commission
                </th>
                {ctx.kind === "org" && (
                  <th className="px-5 py-3 font-semibold text-right">
                    Rep commission
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {tx.transactionDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium">{tx.clinicName ?? "—"}</span>
                    {tx.description && (
                      <span className="block text-xs text-navy/55">
                        {tx.description}
                      </span>
                    )}
                  </td>
                  {ctx.kind === "org" && (
                    <td className="px-5 py-3">{tx.repName ?? "—"}</td>
                  )}
                  <td className="px-5 py-3 font-mono text-xs">
                    {tx.reference ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatCents(tx.revenueCents)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
                    {formatCents(tx.ownCommissionCents)}
                  </td>
                  {ctx.kind === "org" && (
                    <td className="px-5 py-3 text-right tabular-nums text-navy/70">
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
