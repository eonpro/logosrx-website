export const dynamic = "force-dynamic";

import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { clinics, orders, orderRxs, patients } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { ORDER_STATUS_UI } from "@/components/dashboard/orders/order-status";
import {
  Badge,
  EmptyState,
  PageHeader,
  StatCard,
  btnSecondary,
  tableWrapClass,
  theadClass,
  rowClass,
} from "@/components/ui/portal";

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function AdminOrdersPage() {
  await requireAdmin();

  const [rows, counts] = await Promise.all([
    db
      .select({
        id: orders.id,
        referenceId: orders.referenceId,
        lfOrderId: orders.lfOrderId,
        status: orders.status,
        createdAt: orders.createdAt,
        errorMessage: orders.errorMessage,
        clinicId: clinics.id,
        clinicName: clinics.clinicName,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
      })
      .from(orders)
      .innerJoin(clinics, eq(orders.clinicId, clinics.id))
      .innerJoin(patients, eq(orders.patientId, patients.id))
      .orderBy(desc(orders.createdAt))
      .limit(100),
    db
      .select({
        status: orders.status,
        n: sql<number>`count(*)::int`,
      })
      .from(orders)
      .groupBy(orders.status),
  ]);

  const drugRows = rows.length
    ? await db
        .select({ orderId: orderRxs.orderId, drugName: orderRxs.drugName })
        .from(orderRxs)
    : [];
  const drugsByOrder = new Map<number, string[]>();
  for (const rx of drugRows) {
    const list = drugsByOrder.get(rx.orderId) ?? [];
    list.push(rx.drugName);
    drugsByOrder.set(rx.orderId, list);
  }

  const countMap = new Map(counts.map((c) => [c.status, c.n]));
  const needsAttention =
    (countMap.get("pharmacy_rejected") ?? 0) + (countMap.get("failed") ?? 0);

  return (
    <div>
      <PageHeader
        eyebrow="Commerce"
        title="Orders"
        description="Prescription orders placed in-app and forwarded to LifeFile."
        actions={
          <Link href="/admin/orders/mapping" className={btnSecondary}>
            LifeFile product mapping
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Accepted"
          value={countMap.get("accepted") ?? 0}
          sub="Sent to pharmacy"
        />
        <StatCard
          label="Processing"
          value={countMap.get("submitted") ?? 0}
          sub="Forward in flight"
        />
        <StatCard
          label="Needs attention"
          value={needsAttention}
          sub="Rejected or failed"
          accent={needsAttention > 0}
        />
        <StatCard
          label="Total"
          value={counts.reduce((sum, c) => sum + c.n, 0)}
          sub="All time"
        />
      </div>

      <div className={tableWrapClass}>
        {rows.length === 0 ? (
          <EmptyState
            title="No orders yet"
            body="Orders placed through clinic dashboards will appear here. Enable in-app ordering per clinic from the clinic detail page."
          />
        ) : (
          <table className="w-full text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Clinic</th>
                <th className="hidden px-5 py-3.5 lg:table-cell">Patient</th>
                <th className="hidden px-5 py-3.5 xl:table-cell">
                  Medications
                </th>
                <th className="px-5 py-3.5">Status</th>
                <th className="hidden px-5 py-3.5 md:table-cell">Placed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const ui = ORDER_STATUS_UI[o.status];
                return (
                  <tr key={o.id} className={rowClass}>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-semibold text-navy hover:underline"
                      >
                        {o.lfOrderId ? `#${o.lfOrderId}` : o.referenceId}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/clinics/${o.clinicId}`}
                        className="text-navy/80 hover:text-magenta"
                      >
                        {o.clinicName || `Clinic #${o.clinicId}`}
                      </Link>
                    </td>
                    <td className="hidden px-5 py-4 text-navy/70 lg:table-cell">
                      {o.patientFirstName} {o.patientLastName}
                    </td>
                    <td className="hidden max-w-[240px] truncate px-5 py-4 text-navy/60 xl:table-cell">
                      {(drugsByOrder.get(o.id) ?? []).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={ui.tone}>{ui.label}</Badge>
                    </td>
                    <td className="hidden px-5 py-4 tabular-nums text-navy/60 md:table-cell">
                      {dateTimeFmt.format(o.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
