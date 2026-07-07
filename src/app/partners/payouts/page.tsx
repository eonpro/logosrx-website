export const dynamic = "force-dynamic";

import { getPartnerContext } from "@/lib/auth/partner";
import { formatCents } from "@/lib/partners/commission";
import {
  getAwaitingApprovalCents,
  getUnpaidBalanceCents,
  listPayouts,
} from "@/lib/partners/queries";
import { PageHeader, StatCard, EmptyState, tableWrapClass, theadClass, rowClass } from "@/components/ui/portal";
import PartnerNoAccess from "../PartnerNoAccess";

export default async function PartnerPayoutsPage() {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  const [unpaidCents, awaitingCents, payoutList] = await Promise.all([
    getUnpaidBalanceCents(ctx),
    getAwaitingApprovalCents(ctx),
    listPayouts(ctx),
  ]);

  const receivedCents = payoutList
    .filter((p) => (ctx.kind === "org" ? p.payee === "org" : true))
    .reduce((sum, p) => sum + p.amountCents, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Partner Portal"
        title="Payouts"
        description={`Commission payments from Logos RX${
          ctx.kind === "org" ? " to your organization and your reps." : "."
        }`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Payable now"
          value={formatCents(unpaidCents)}
          sub="Approved, awaiting payout"
          accent
        />
        <StatCard
          label="Awaiting approval"
          value={formatCents(awaitingCents)}
          sub="Earned, pending Logos RX review"
        />
        <StatCard
          label="Total received"
          value={formatCents(receivedCents)}
          sub={`${payoutList.length} payout${payoutList.length === 1 ? "" : "s"} on record`}
        />
      </div>

      {payoutList.length === 0 ? (
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="No payouts yet"
            body="Once Logos RX sends your commission, it will show up here."
          />
        </div>
      ) : (
        <div className={`overflow-x-auto ${tableWrapClass}`}>
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Date</th>
                {ctx.kind === "org" && (
                  <th className="px-5 py-4 font-semibold">Paid to</th>
                )}
                <th className="px-5 py-4 font-semibold">Method</th>
                <th className="px-5 py-4 font-semibold">Reference</th>
                <th className="px-5 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {payoutList.map((p) => (
                <tr key={p.id} className={rowClass}>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {p.paidAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  {ctx.kind === "org" && (
                    <td className="px-5 py-4">
                      {p.payee === "org"
                        ? "Your organization"
                        : (p.repName ?? "Rep")}
                    </td>
                  )}
                  <td className="px-5 py-4 capitalize">{p.method ?? "—"}</td>
                  <td className="px-5 py-4 font-mono text-xs">
                    {p.reference ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums font-semibold">
                    {formatCents(p.amountCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
