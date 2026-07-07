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
import { StatCard, EmptyState, tableWrapClass, theadClass, rowClass, btnGhost } from "@/components/ui/portal";
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

  const displayName = ctx.kind === "rep" ? ctx.rep!.name : ctx.org.name;
  const firstName = displayName.split(/\s+/)[0];

  return (
    <div>
      <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy/40">
            Partner Portal
          </p>
          <h1 className="font-display text-4xl font-medium text-navy sm:text-[2.85rem] sm:leading-[1.05]">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 text-[15px] text-navy/55">
            Your commission rate is{" "}
            <span className="font-semibold text-navy">{formatBps(rateBps)}</span>{" "}
            of attributed revenue.
          </p>
        </div>
        <RangeFilter current={resolved.id} basePath="/partners" />
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Hero: what you earned this period */}
        <div className="rounded-3xl bg-plum p-7 text-white shadow-soft-lg sm:p-8 lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
            Commission earned · {resolved.label}
          </p>
          <p className="mt-4 font-display text-5xl font-medium leading-none tabular-nums sm:text-6xl">
            {formatCents(commission.ownCents)}
          </p>
          {ctx.kind === "org" && (
            <p className="mt-2.5 text-sm text-white/55">
              + {formatCents(commission.repCents)} earned by your reps
            </p>
          )}
          <div className="mt-7 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Attributed revenue
              </p>
              <p className="mt-1 font-display text-2xl font-medium tabular-nums">
                {formatCents(revenue.revenueCents)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Transactions
              </p>
              <p className="mt-1 font-display text-2xl font-medium tabular-nums">
                {revenue.transactionCount}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Your rate
              </p>
              <p className="mt-1 font-display text-2xl font-medium tabular-nums">
                {formatBps(rateBps)}
              </p>
            </div>
          </div>
        </div>

        {/* Side stack */}
        <div className="flex flex-col gap-5">
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
            sub="View your network →"
            href="/partners/network"
          />
        </div>
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
