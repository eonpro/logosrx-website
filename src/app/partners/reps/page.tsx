export const dynamic = "force-dynamic";

import Link from "next/link";
import { getPartnerContext } from "@/lib/auth/partner";
import { roleAtLeast } from "@/lib/auth/partner-roles";
import { bpsToPercent, formatBps, formatCents } from "@/lib/partners/commission";
import { listOrgReps } from "@/lib/partners/queries";
import { getRepProduction } from "@/lib/partners/crm";
import { PageHeader, tableWrapClass, theadClass, rowClass } from "@/components/ui/portal";
import PartnerNoAccess from "../PartnerNoAccess";
import RepsManager from "./RepsManager";

export default async function PartnerRepsPage() {
  const ctx = await getPartnerContext();
  // Rep management is org admin+ only: reps don't get to see (or edit) each
  // other's rates, and org viewers are read-only (matches the nav's adminOnly
  // flag and the rep-management server actions).
  if (!ctx || ctx.kind !== "org" || !roleAtLeast(ctx.role, "admin")) {
    return <PartnerNoAccess />;
  }

  const [reps, production] = await Promise.all([
    listOrgReps(ctx.org.id),
    getRepProduction(ctx.org.id),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Partner Portal"
        title="Reps"
        description={
          <>
            Invite reps and sub-groups under {ctx.org.name}. Each rep&rsquo;s
            rate comes out of your {formatBps(ctx.org.commissionRateBps)}{" "}
            commission. Rate changes apply to future transactions only.
          </>
        }
      />

      {production.some((r) => r.revenueCents > 0) && (
        <div className={`mb-8 overflow-x-auto ${tableWrapClass}`}>
          <div className="border-b border-beige px-5 py-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
              Production leaderboard
            </h2>
          </div>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Rep</th>
                <th className="px-5 py-4 font-semibold text-right">Companies</th>
                <th className="px-5 py-4 font-semibold text-right">Revenue</th>
                <th className="px-5 py-4 font-semibold text-right">Commission</th>
                <th className="px-5 py-4 font-semibold text-right">Paid</th>
                <th className="px-5 py-4 font-semibold text-right">Payable</th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {production.map((rep) => (
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
                  <td className="px-5 py-4 text-right tabular-nums text-navy/70">
                    {formatCents(rep.paidCents)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-navy/70">
                    {formatCents(rep.payableCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RepsManager
        reps={reps.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          status: r.status,
          ratePercent: bpsToPercent(r.commissionRateBps),
          activated: r.activatedAt != null,
          clinicCount: r.clinicCount,
        }))}
        orgRatePercent={bpsToPercent(ctx.org.commissionRateBps)}
      />
    </div>
  );
}
