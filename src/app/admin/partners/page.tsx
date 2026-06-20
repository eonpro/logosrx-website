export const dynamic = "force-dynamic";

import Link from "next/link";
import { count, desc, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinics,
  commissionEntries,
  partnerOrgPricing,
  partnerOrgs,
  partnerReps,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { formatBps, formatCents } from "@/lib/partners/commission";
import ApproveOrgButton from "./ApproveOrgButton";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  suspended: "bg-gray-100 text-gray-500",
};

export default async function AdminPartnersPage() {
  await requireAdmin();

  const [orgs, repCounts, clinicCounts, unpaidByOrg, floorCounts] =
    await Promise.all([
      db.select().from(partnerOrgs).orderBy(desc(partnerOrgs.createdAt)),
      db
        .select({ orgId: partnerReps.orgId, total: count() })
        .from(partnerReps)
        .groupBy(partnerReps.orgId),
      db
        .select({ orgId: clinics.partnerOrgId, total: count() })
        .from(clinics)
        .groupBy(clinics.partnerOrgId),
      db
        .select({
          orgId: commissionEntries.orgId,
          totalCents:
            sql<number>`coalesce(sum(${commissionEntries.amountCents}), 0)`.mapWith(
              Number,
            ),
        })
        .from(commissionEntries)
        .where(inArray(commissionEntries.status, ["pending", "approved"]))
        .groupBy(commissionEntries.orgId),
      db
        .select({ orgId: partnerOrgPricing.orgId, total: count() })
        .from(partnerOrgPricing)
        .groupBy(partnerOrgPricing.orgId),
    ]);

  const repsByOrg = new Map(repCounts.map((r) => [r.orgId, r.total]));
  const clinicsByOrg = new Map(clinicCounts.map((r) => [r.orgId, r.total]));
  const unpaidMap = new Map(unpaidByOrg.map((r) => [r.orgId, r.totalCents]));
  const floorsByOrg = new Map(floorCounts.map((r) => [r.orgId, r.total]));
  const pending = orgs.filter((o) => o.status === "pending").length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Partners</h1>
          <p className="text-navy/70 text-sm mt-1">
            {orgs.length} partner org{orgs.length !== 1 ? "s" : ""}
            {pending > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {pending} pending review
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/partners/transactions"
          className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Transactions & import
        </Link>
      </div>

      {orgs.length === 0 ? (
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/65 text-sm">
            No partner applications yet. Orgs apply at /partners/apply.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige bg-white">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Organization</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Model</th>
                <th className="px-5 py-3 font-semibold text-right">Rate</th>
                <th className="px-5 py-3 font-semibold text-right">Reps</th>
                <th className="px-5 py-3 font-semibold text-right">Clinics</th>
                <th className="px-5 py-3 font-semibold text-right">Unpaid</th>
                <th className="px-5 py-3 font-semibold">Applied</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-cream/40">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/partners/${org.id}`}
                      className="font-medium text-navy hover:text-magenta"
                    >
                      {org.name}
                    </Link>
                    <span className="block text-xs text-navy/55">
                      {org.contactName} · {org.contactEmail}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[org.status]}`}
                    >
                      {org.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {org.compensationModel === "margin" ? (
                      <span className="flex flex-col items-start gap-1">
                        <span className="text-xs font-medium text-navy/70">
                          Margin
                        </span>
                        {(floorsByOrg.get(org.id) ?? 0) > 0 ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            {floorsByOrg.get(org.id)} floor
                            {floorsByOrg.get(org.id) === 1 ? "" : "s"} · quote-ready
                          </span>
                        ) : (
                          <Link
                            href={`/admin/partners/${org.id}`}
                            className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-200"
                          >
                            No floors set
                          </Link>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-navy/70">
                        Commission
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatBps(org.commissionRateBps)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {repsByOrg.get(org.id) ?? 0}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {clinicsByOrg.get(org.id) ?? 0}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatCents(unpaidMap.get(org.id) ?? 0)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {org.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {org.status === "pending" ? (
                      <ApproveOrgButton orgId={org.id} />
                    ) : (
                      <Link
                        href={`/admin/partners/${org.id}`}
                        className="text-xs font-medium text-navy/55 hover:text-magenta"
                      >
                        Manage
                      </Link>
                    )}
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
