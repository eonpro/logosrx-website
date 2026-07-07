export const dynamic = "force-dynamic";

import Link from "next/link";
import { getPartnerContext } from "@/lib/auth/partner";
import { formatBps, formatCents } from "@/lib/partners/commission";
import { getRepProduction, listBookOfBusiness } from "@/lib/partners/crm";
import { formatTransactionDate } from "@/lib/partners/dates";
import { PageHeader, EmptyState, InitialsAvatar, tableWrapClass, theadClass, rowClass, btnGhost } from "@/components/ui/portal";
import PartnerNoAccess from "../PartnerNoAccess";
import BookTable from "./BookTable";

export default async function PartnerNetworkPage() {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  const [book, reps] = await Promise.all([
    listBookOfBusiness(ctx),
    ctx.kind === "org" ? getRepProduction(ctx.org.id) : Promise.resolve([]),
  ]);

  const totalRevenue = book.reduce((s, c) => s + c.revenueCents, 0);
  const totalCommission = book.reduce((s, c) => s + c.commissionCents, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Partner Portal"
        title="Book of Business"
        description={
          <>
            {book.length} compan{book.length === 1 ? "y" : "ies"} linked to{" "}
            {ctx.kind === "rep" ? "you" : "your organization"} ·{" "}
            {formatCents(totalRevenue)} lifetime revenue ·{" "}
            <span className="font-semibold text-navy">
              {formatCents(totalCommission)} commission
            </span>
          </>
        }
      />

      {ctx.kind === "org" && reps.length > 0 && (
        <div className={`mb-8 overflow-x-auto ${tableWrapClass}`}>
          <div className="flex items-center justify-between border-b border-beige px-5 py-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
              Rep production
            </h2>
            <Link href="/partners/reps" className={btnGhost}>
              Manage reps →
            </Link>
          </div>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Rep</th>
                <th className="px-5 py-4 font-semibold text-right">Companies</th>
                <th className="px-5 py-4 font-semibold text-right">Revenue</th>
                <th className="px-5 py-4 font-semibold text-right">Commission</th>
                <th className="px-5 py-4 font-semibold text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {reps.map((rep) => (
                <tr key={rep.id} className={rowClass}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={rep.name} />
                      <div>
                        <Link
                          href={`/partners/reps/${rep.id}`}
                          className="font-medium text-navy hover:text-magenta"
                        >
                          {rep.name}
                        </Link>
                        <span className="block text-xs text-navy/55">
                          {rep.email}
                        </span>
                      </div>
                    </div>
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
                    {formatBps(rep.commissionRateBps)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {book.length === 0 ? (
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="No companies linked yet"
            body="Share your referral links with providers to grow your book of business."
            action={
              <Link href="/partners/links" className={btnGhost}>
                Go to referral links →
              </Link>
            }
          />
        </div>
      ) : (
        <BookTable
          kind={ctx.kind}
          rows={book.map((c) => ({
            id: c.id,
            clinicName: c.clinicName,
            contactName: c.contactName,
            repName: c.repName,
            stage: c.stage,
            verificationStatus: c.verificationStatus,
            revenueCents: c.revenueCents,
            commissionCents: c.commissionCents,
            lastActivityLabel: c.lastTransactionDate
              ? formatTransactionDate(c.lastTransactionDate)
              : null,
          }))}
        />
      )}
    </div>
  );
}
