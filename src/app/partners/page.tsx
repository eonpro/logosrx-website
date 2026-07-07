export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getPartnerContext } from "@/lib/auth/partner";
import { formatBps, formatCents } from "@/lib/partners/commission";
import { formatTransactionDate, resolveDateRange } from "@/lib/partners/dates";
import {
  countNetworkClinics,
  getCommissionSummary,
  getRevenueSummary,
  getAwaitingApprovalCents,
  getUnpaidBalanceCents,
  listPartnerTransactions,
} from "@/lib/partners/queries";
import { getViewerGoalProgress } from "@/lib/partners/goals";
import { PageHeader, StatCard, EmptyState, tableWrapClass, theadClass, rowClass, btnGhost } from "@/components/ui/portal";
import PartnerLanding from "./PartnerLanding";
import PartnerNoAccess from "./PartnerNoAccess";
import RangeFilter from "./RangeFilter";
import GoalProgressBars from "./GoalProgressBars";

const PARTNER_TITLE = "Logos RX Partner Program";
const PARTNER_DESCRIPTION =
  "Partner with a multi-state licensed 503A compounding pharmacy to provide marketing and brand-support services.";

export const metadata: Metadata = {
  title: "Marketing Partner Program",
  description: PARTNER_DESCRIPTION,
  openGraph: {
    title: PARTNER_TITLE,
    description: PARTNER_DESCRIPTION,
  },
  twitter: {
    title: PARTNER_TITLE,
    description: PARTNER_DESCRIPTION,
  },
};

export default async function PartnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const ctx = await getPartnerContext();
  if (!ctx) {
    // Anonymous visitors get the public marketing landing page (the funnel
    // into Apply / Sign in). A signed-in user without an active partner
    // identity instead sees the "under review / no access" explanation.
    const { userId } = await auth();
    return userId ? <PartnerNoAccess /> : <PartnerLanding />;
  }

  const { range } = await searchParams;
  const resolved = resolveDateRange(range);

  const [
    revenue,
    commission,
    unpaidCents,
    awaitingCents,
    clinicCount,
    recent,
    goals,
  ] = await Promise.all([
    getRevenueSummary(ctx, resolved.from),
    getCommissionSummary(ctx, resolved.from),
    getUnpaidBalanceCents(ctx),
    getAwaitingApprovalCents(ctx),
    countNetworkClinics(ctx),
    listPartnerTransactions(ctx, resolved.from, 8),
    getViewerGoalProgress(ctx),
  ]);

  const rateBps =
    ctx.kind === "rep"
      ? ctx.rep!.commissionRateBps
      : ctx.org.commissionRateBps;

  return (
    <div>
      <PageHeader
        eyebrow="Partner Portal"
        title={`Welcome, ${ctx.kind === "rep" ? ctx.rep!.name : ctx.org.name}`}
        description={
          <>
            Your commission rate is{" "}
            <span className="font-semibold text-navy">
              {formatBps(rateBps)}
            </span>{" "}
            of attributed revenue. Showing {resolved.label.toLowerCase()}.
          </>
        }
        actions={<RangeFilter current={resolved.id} basePath="/partners" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Revenue (${resolved.label})`}
          value={formatCents(revenue.revenueCents)}
          sub={`${revenue.transactionCount} transaction${revenue.transactionCount === 1 ? "" : "s"}`}
        />
        <StatCard
          label={`Commission earned (${resolved.label})`}
          value={formatCents(commission.ownCents)}
          sub={
            ctx.kind === "org"
              ? `+ ${formatCents(commission.repCents)} to your reps`
              : undefined
          }
          accent
        />
        <StatCard
          label="Payable now"
          value={formatCents(unpaidCents)}
          sub={
            awaitingCents > 0
              ? `+ ${formatCents(awaitingCents)} awaiting approval`
              : "Approved, pending payout"
          }
        />
        <StatCard
          label="Linked clinics"
          value={String(clinicCount)}
          sub={
            <Link href="/partners/network" className="text-magenta hover:underline">
              View network →
            </Link>
          }
        />
      </div>

      {goals.length > 0 && (
        <div className="mt-6 rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
              Goal progress
            </h2>
            {ctx.kind === "org" && (
              <Link href="/partners/goals" className={btnGhost}>
                Manage goals →
              </Link>
            )}
          </div>
          <GoalProgressBars goals={goals} />
        </div>
      )}

      <div className={`mt-8 ${tableWrapClass}`}>
        <div className="flex items-center justify-between border-b border-beige px-6 py-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Recent transactions
          </h2>
          <Link href="/partners/transactions" className={btnGhost}>
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="No transactions in this period yet"
            body="Share your referral links to start earning."
            action={
              <Link href="/partners/links" className={btnGhost}>
                Go to referral links →
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Clinic</th>
                <th className="px-5 py-4 font-semibold text-right">Revenue</th>
                <th className="px-5 py-4 font-semibold text-right">
                  Your commission
                </th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {recent.map((tx) => (
                <tr key={tx.id} className={rowClass}>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {formatTransactionDate(tx.transactionDate)}
                  </td>
                  <td className="px-5 py-4">{tx.clinicName ?? "—"}</td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatCents(tx.revenueCents)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums font-semibold">
                    {formatCents(tx.ownCommissionCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
