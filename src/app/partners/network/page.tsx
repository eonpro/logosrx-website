export const dynamic = "force-dynamic";

import Link from "next/link";
import { getPartnerContext } from "@/lib/auth/partner";
import { formatBps, formatCents } from "@/lib/partners/commission";
import { getRepProduction, listBookOfBusiness } from "@/lib/partners/crm";
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Book of Business</h1>
        <p className="text-navy/70 text-sm mt-1">
          {book.length} compan{book.length === 1 ? "y" : "ies"} linked to{" "}
          {ctx.kind === "rep" ? "you" : "your organization"} ·{" "}
          {formatCents(totalRevenue)} lifetime revenue ·{" "}
          <span className="font-semibold text-navy">
            {formatCents(totalCommission)} commission
          </span>
        </p>
      </div>

      {ctx.kind === "org" && reps.length > 0 && (
        <div className="mb-8 overflow-x-auto rounded-2xl border border-beige bg-white">
          <div className="flex items-center justify-between border-b border-beige px-5 py-4">
            <h2 className="text-sm font-semibold text-navy">
              Rep production
            </h2>
            <Link
              href="/partners/reps"
              className="text-xs font-medium text-magenta hover:underline"
            >
              Manage reps →
            </Link>
          </div>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Rep</th>
                <th className="px-5 py-3 font-semibold text-right">Companies</th>
                <th className="px-5 py-3 font-semibold text-right">Revenue</th>
                <th className="px-5 py-3 font-semibold text-right">Commission</th>
                <th className="px-5 py-3 font-semibold text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {reps.map((rep) => (
                <tr key={rep.id} className="hover:bg-cream/40">
                  <td className="px-5 py-3">
                    <Link
                      href={`/partners/reps/${rep.id}`}
                      className="font-medium text-navy hover:text-magenta"
                    >
                      {rep.name}
                    </Link>
                    <span className="block text-xs text-navy/55">
                      {rep.email}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {rep.clinicCount}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatCents(rep.revenueCents)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
                    {formatCents(rep.commissionCents)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-navy/70">
                    {formatBps(rep.commissionRateBps)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {book.length === 0 ? (
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/65 text-sm">
            No companies linked yet. Share your{" "}
            <Link href="/partners/links" className="text-magenta hover:underline">
              referral links
            </Link>{" "}
            with providers to grow your book of business.
          </p>
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
              ? c.lastTransactionDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : null,
          }))}
        />
      )}
    </div>
  );
}
