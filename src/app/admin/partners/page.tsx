import Link from "next/link";
import { desc, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerOrgs } from "@/lib/db/schema";
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

  const orgs = await db
    .select({
      ...getTableColumns(partnerOrgs),
      repCount: sql<number>`(select count(*)::int from partner_reps where org_id = ${partnerOrgs.id})`.mapWith(
        Number,
      ),
      clinicCount: sql<number>`(select count(*)::int from clinics where partner_org_id = ${partnerOrgs.id})`.mapWith(
        Number,
      ),
      unpaidCents: sql<number>`(select coalesce(sum(amount_cents), 0)::int from commission_entries where org_id = ${partnerOrgs.id} and status in ('pending', 'approved'))`.mapWith(
        Number,
      ),
      floorCount: sql<number>`(select count(*)::int from partner_org_pricing where org_id = ${partnerOrgs.id})`.mapWith(
        Number,
      ),
    })
    .from(partnerOrgs)
    .orderBy(desc(partnerOrgs.createdAt));

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
                        {(org.floorCount ?? 0) > 0 ? (
                          <Badge tone="success">
                            {org.floorCount} floor
                            {org.floorCount === 1 ? "" : "s"} · quote-ready
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
                    {org.repCount}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {org.clinicCount}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatCents(org.unpaidCents)}
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
