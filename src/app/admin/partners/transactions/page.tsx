export const dynamic = "force-dynamic";

import Link from "next/link";
import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinics,
  commissionEntries,
  partnerOrgs,
  partnerTransactions,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { formatCents } from "@/lib/partners/commission";
import TransactionEntry from "./TransactionEntry";
import RefundButton from "./RefundButton";

export default async function AdminPartnerTransactionsPage() {
  await requireAdmin();

  const [transactions, attributedClinics] = await Promise.all([
    db
      .select({
        id: partnerTransactions.id,
        transactionDate: partnerTransactions.transactionDate,
        clinicName: clinics.clinicName,
        practiceLegalName: clinics.practiceLegalName,
        orgName: partnerOrgs.name,
        description: partnerTransactions.description,
        reference: partnerTransactions.reference,
        revenueCents: partnerTransactions.revenueCents,
        refundedCents: partnerTransactions.refundedCents,
        source: partnerTransactions.source,
        commissionCents:
          sql<number>`coalesce(sum(${commissionEntries.amountCents}), 0)`.mapWith(
            Number,
          ),
      })
      .from(partnerTransactions)
      .innerJoin(clinics, eq(partnerTransactions.clinicId, clinics.id))
      .leftJoin(partnerOrgs, eq(clinics.partnerOrgId, partnerOrgs.id))
      .leftJoin(
        commissionEntries,
        eq(commissionEntries.transactionId, partnerTransactions.id),
      )
      .groupBy(
        partnerTransactions.id,
        clinics.clinicName,
        clinics.practiceLegalName,
        partnerOrgs.name,
      )
      .orderBy(desc(partnerTransactions.transactionDate))
      .limit(200),
    db
      .select({
        id: clinics.id,
        clinicName: clinics.clinicName,
        practiceLegalName: clinics.practiceLegalName,
        contactEmail: clinics.contactEmail,
        orgName: partnerOrgs.name,
      })
      .from(clinics)
      .innerJoin(partnerOrgs, eq(clinics.partnerOrgId, partnerOrgs.id))
      .where(isNotNull(clinics.partnerOrgId))
      .orderBy(clinics.clinicName),
  ]);

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/partners"
          className="text-xs font-medium text-navy/55 hover:text-magenta"
        >
          ← All partners
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy">
          Partner Transactions
        </h1>
        <p className="text-navy/70 text-sm mt-1">
          Record revenue for attributed clinics — commission ledger entries
          are generated automatically at the org&rsquo;s and rep&rsquo;s
          current rates.
        </p>
      </div>

      <TransactionEntry
        clinics={attributedClinics.map((c) => ({
          id: c.id,
          label: `${c.clinicName || c.practiceLegalName || `Clinic #${c.id}`} — ${c.orgName}`,
        }))}
      />

      <div className="mt-8 overflow-x-auto rounded-2xl border border-beige bg-white">
        <div className="border-b border-beige px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">
            Recent transactions ({transactions.length})
          </h2>
        </div>
        {transactions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-navy/65">
            No transactions recorded yet.
          </p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Clinic</th>
                <th className="px-5 py-3 font-semibold">Partner org</th>
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Source</th>
                <th className="px-5 py-3 font-semibold text-right">Revenue</th>
                <th className="px-5 py-3 font-semibold text-right">
                  Commission
                </th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
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
                    <span className="font-medium">
                      {tx.clinicName || tx.practiceLegalName || "—"}
                    </span>
                    {tx.description && (
                      <span className="block text-xs text-navy/55">
                        {tx.description}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">{tx.orgName ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs">
                    {tx.reference ?? "—"}
                  </td>
                  <td className="px-5 py-3 uppercase text-xs">{tx.source}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatCents(tx.revenueCents)}
                    {tx.refundedCents > 0 && (
                      <span className="block text-xs font-medium text-red-600">
                        −{formatCents(tx.refundedCents)} refunded
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
                    {formatCents(tx.commissionCents)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <RefundButton
                      transactionId={tx.id}
                      remainingCents={tx.revenueCents - tx.refundedCents}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
