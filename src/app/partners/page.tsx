export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getPartnerContext } from "@/lib/auth/partner";
import { formatBps, formatCents } from "@/lib/partners/commission";
import { resolveDateRange } from "@/lib/partners/dates";
import {
  countNetworkClinics,
  getCommissionSummary,
  getRevenueSummary,
  getAwaitingApprovalCents,
  getUnpaidBalanceCents,
  listPartnerTransactions,
} from "@/lib/partners/queries";
import { getViewerGoalProgress } from "@/lib/partners/goals";
import PartnerLanding from "./PartnerLanding";
import PartnerNoAccess from "./PartnerNoAccess";
import RangeFilter from "./RangeFilter";
import GoalProgressBars from "./GoalProgressBars";

export const metadata: Metadata = {
  title: "Marketing Partner Program",
  description:
    "Join the Logos RX marketing partner program. Provide marketing and brand-support services for a multi-state licensed compounding pharmacy.",
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            Welcome, {ctx.kind === "rep" ? ctx.rep!.name : ctx.org.name}
          </h1>
          <p className="text-navy/70 text-sm mt-1">
            Your commission rate is{" "}
            <span className="font-semibold text-navy">
              {formatBps(rateBps)}
            </span>{" "}
            of attributed revenue. Showing {resolved.label.toLowerCase()}.
          </p>
        </div>
        <RangeFilter current={resolved.id} basePath="/partners" />
      </div>

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
        <div className="mt-6 rounded-2xl border border-beige bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">Goal progress</h2>
            {ctx.kind === "org" && (
              <Link
                href="/partners/goals"
                className="text-xs font-medium text-magenta hover:underline"
              >
                Manage goals →
              </Link>
            )}
          </div>
          <GoalProgressBars goals={goals} />
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-beige bg-white">
        <div className="flex items-center justify-between border-b border-beige px-6 py-4">
          <h2 className="text-sm font-semibold text-navy">
            Recent transactions
          </h2>
          <Link
            href="/partners/transactions"
            className="text-xs font-medium text-magenta hover:underline"
          >
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-navy/65">
            No transactions in this period yet. Share your{" "}
            <Link href="/partners/links" className="text-magenta hover:underline">
              referral links
            </Link>{" "}
            to start earning.
          </p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Clinic</th>
                <th className="px-6 py-3 font-semibold text-right">Revenue</th>
                <th className="px-6 py-3 font-semibold text-right">
                  Your commission
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {recent.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {tx.transactionDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-3">{tx.clinicName ?? "—"}</td>
                  <td className="px-6 py-3 text-right tabular-nums">
                    {formatCents(tx.revenueCents)}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums font-semibold">
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

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        accent
          ? "border-magenta/20 bg-magenta/5"
          : "border-beige bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-navy/55">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-navy">{value}</p>
      {sub && <p className="mt-1 text-xs text-navy/60">{sub}</p>}
    </div>
  );
}
