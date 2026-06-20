export const dynamic = "force-dynamic";

import { getPartnerContext } from "@/lib/auth/partner";
import { formatCents } from "@/lib/partners/commission";
import {
  getUnpaidBalanceCents,
  listPayouts,
} from "@/lib/partners/queries";
import PartnerNoAccess from "../PartnerNoAccess";

export default async function PartnerPayoutsPage() {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  const [unpaidCents, payoutList] = await Promise.all([
    getUnpaidBalanceCents(ctx),
    listPayouts(ctx),
  ]);

  const receivedCents = payoutList
    .filter((p) => (ctx.kind === "org" ? p.payee === "org" : true))
    .reduce((sum, p) => sum + p.amountCents, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Payouts</h1>
        <p className="text-navy/70 text-sm mt-1">
          Commission payments from Logos RX
          {ctx.kind === "org" ? " to your organization and your reps." : "."}
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-magenta/20 bg-magenta/5 p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-navy/55">
            Unpaid balance
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-navy">
            {formatCents(unpaidCents)}
          </p>
          <p className="mt-1 text-xs text-navy/60">
            Earned commission awaiting payout
          </p>
        </div>
        <div className="rounded-2xl border border-beige bg-white p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-navy/55">
            Total received
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-navy">
            {formatCents(receivedCents)}
          </p>
          <p className="mt-1 text-xs text-navy/60">
            {payoutList.length} payout{payoutList.length === 1 ? "" : "s"} on
            record
          </p>
        </div>
      </div>

      {payoutList.length === 0 ? (
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/65 text-sm">
            No payouts yet. Once Logos RX sends your commission, it will show
            up here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                {ctx.kind === "org" && (
                  <th className="px-5 py-3 font-semibold">Paid to</th>
                )}
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {payoutList.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {p.paidAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  {ctx.kind === "org" && (
                    <td className="px-5 py-3">
                      {p.payee === "org"
                        ? "Your organization"
                        : (p.repName ?? "Rep")}
                    </td>
                  )}
                  <td className="px-5 py-3 capitalize">{p.method ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs">
                    {p.reference ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
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
