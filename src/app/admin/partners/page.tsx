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
import {
  Badge,
  Card,
  EmptyState,
  InitialsAvatar,
  PageHeader,
  btnPrimary,
  rowClass,
  tableWrapClass,
  theadClass,
  type BadgeTone,
} from "@/components/ui/portal";

const STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  pending: "warning",
  suspended: "neutral",
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
      <PageHeader
        eyebrow="Admin"
        title="Partners"
        description={
          <>
            {orgs.length} partner org{orgs.length !== 1 ? "s" : ""}
            {pending > 0 && (
              <span className="ml-2 inline-flex align-middle">
                <Badge tone="warning">{pending} pending review</Badge>
              </span>
            )}
          </>
        }
        actions={
          <Link href="/admin/partners/transactions" className={btnPrimary}>
            Transactions & import
          </Link>
        }
      />

      {orgs.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            title="No partner applications yet"
            body="Orgs apply at /partners/apply."
          />
        </Card>
      ) : (
        <div className={`${tableWrapClass} overflow-x-auto`}>
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Organization</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Model</th>
                <th className="px-5 py-4 font-semibold text-right">Rate</th>
                <th className="px-5 py-4 font-semibold text-right">Reps</th>
                <th className="px-5 py-4 font-semibold text-right">Clinics</th>
                <th className="px-5 py-4 font-semibold text-right">Unpaid</th>
                <th className="px-5 py-4 font-semibold">Applied</th>
                <th className="px-5 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {orgs.map((org) => (
                <tr key={org.id} className={rowClass}>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-3">
                      <InitialsAvatar name={org.name} />
                      <span className="min-w-0">
                        <Link
                          href={`/admin/partners/${org.id}`}
                          className="font-medium text-navy hover:text-magenta"
                        >
                          {org.name}
                        </Link>
                        <span className="block text-xs text-navy/55">
                          {org.contactName} · {org.contactEmail}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={STATUS_TONE[org.status] ?? "neutral"}>
                      {org.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    {org.compensationModel === "margin" ? (
                      <span className="flex flex-col items-start gap-1">
                        <span className="text-xs font-medium text-navy/70">
                          Margin
                        </span>
                        {(floorsByOrg.get(org.id) ?? 0) > 0 ? (
                          <Badge tone="success">
                            {floorsByOrg.get(org.id)} floor
                            {floorsByOrg.get(org.id) === 1 ? "" : "s"} · quote-ready
                          </Badge>
                        ) : (
                          <Link href={`/admin/partners/${org.id}`}>
                            <Badge tone="warning">No floors set</Badge>
                          </Link>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-navy/70">
                        Commission
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatBps(org.commissionRateBps)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {repsByOrg.get(org.id) ?? 0}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {clinicsByOrg.get(org.id) ?? 0}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatCents(unpaidMap.get(org.id) ?? 0)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {org.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {org.status === "pending" ? (
                      <ApproveOrgButton orgId={org.id} />
                    ) : (
                      <Link
                        href={`/admin/partners/${org.id}`}
                        className="text-xs font-semibold text-navy/55 hover:text-navy"
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
