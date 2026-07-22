export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { clinics, orders, orderRxs, patients } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { ORDER_STATUS_UI } from "@/components/dashboard/orders/order-status";
import { shippingServiceName } from "@/lib/lifefile/constants";
import { Badge, Card, PageHeader, btnGhost } from "@/components/ui/portal";

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        {label}
      </p>
      <p className="text-sm text-navy">{value || "—"}</p>
    </div>
  );
}

/** Raw JSON payload viewer for support — collapsed by default. */
function RawPayload({ label, data }: { label: string; data: unknown }) {
  if (data == null) return null;
  return (
    <details className="group">
      <summary className="cursor-pointer text-sm font-semibold text-navy/60 hover:text-navy">
        {label}
      </summary>
      <pre className="mt-2 max-h-96 overflow-auto rounded-2xl bg-navy/[0.04] p-4 text-xs leading-relaxed text-navy/80">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const [row] = await db
    .select({
      order: orders,
      clinicName: clinics.clinicName,
      clinicId: clinics.id,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      patientDob: patients.dateOfBirth,
    })
    .from(orders)
    .innerJoin(clinics, eq(orders.clinicId, clinics.id))
    .innerJoin(patients, eq(orders.patientId, patients.id))
    .where(eq(orders.id, id))
    .limit(1);
  if (!row) notFound();

  const rxs = await db
    .select()
    .from(orderRxs)
    .where(eq(orderRxs.orderId, id));

  const { order } = row;
  const ui = ORDER_STATUS_UI[order.status];

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/orders" className={`${btnGhost} -ml-4`}>
          ← Back to orders
        </Link>
      </div>

      <PageHeader
        eyebrow="Order"
        title={order.lfOrderId ? `#${order.lfOrderId}` : order.referenceId}
        description={
          <>
            <Link
              href={`/admin/clinics/${row.clinicId}`}
              className="hover:text-magenta"
            >
              {row.clinicName || `Clinic #${row.clinicId}`}
            </Link>
            {` · placed ${dateTimeFmt.format(order.createdAt)}`}
          </>
        }
        actions={<Badge tone={ui.tone}>{ui.label}</Badge>}
      />

      {order.errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <span className="font-semibold">Pharmacy response:</span>{" "}
          {order.errorMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Order
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Reference" value={order.referenceId} />
            <Field label="LifeFile order id" value={order.lfOrderId} />
            <Field label="Message id" value={order.messageId} />
            <Field
              label="Billing"
              value={order.payorType === "doc" ? "Clinic" : "Patient"}
            />
            <Field
              label="Patient"
              value={`${row.patientFirstName} ${row.patientLastName} (DOB ${row.patientDob})`}
            />
            <Field
              label="Prescriber"
              value={`${order.prescriber.firstName} ${order.prescriber.lastName} · NPI ${order.prescriber.npi}`}
            />
            <Field
              label="Ship to"
              value={`${order.shipping.recipientFirstName} ${order.shipping.recipientLastName} (${order.shipping.recipientType}) — ${order.shipping.addressLine1}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.zipCode}`}
            />
            <Field
              label="Shipping service"
              value={shippingServiceName(order.serviceId)}
            />
            {order.memo && <Field label="Memo" value={order.memo} />}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Medications ({rxs.length})
          </h2>
          <div className="divide-y divide-beige/70">
            {rxs.map((rx) => (
              <div key={rx.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-navy">
                  {rx.drugName}
                  {rx.drugStrength ? ` · ${rx.drugStrength}` : ""}
                  <span className="ml-2 text-xs font-normal text-navy/50">
                    LF #{rx.lfProductId}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-navy/70">{rx.directions}</p>
                <p className="mt-1 text-xs text-navy/50">
                  {[
                    rx.quantity
                      ? `Qty ${rx.quantity}${rx.quantityUnits ? ` ${rx.quantityUnits}` : ""}`
                      : null,
                    rx.daysSupply ? `${rx.daysSupply}-day supply` : null,
                    `${rx.refills} refills`,
                    `Written ${rx.dateWritten}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Raw payloads (support)
        </h2>
        <div className="flex flex-col gap-4">
          <RawPayload label="Request sent to LifeFile" data={order.rawRequest} />
          <RawPayload label="LifeFile response" data={order.rawResponse} />
        </div>
      </Card>
    </div>
  );
}
