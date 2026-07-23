import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { ORDER_STATUS_UI } from "@/components/dashboard/orders/order-status";
import {
  Badge,
  Card,
  PageHeader,
  btnSecondary,
} from "@/components/ui/portal";
import {
  getClinicOrderDetail,
  getClinicOrderingContext,
} from "@/lib/orders/data";
import { shippingServiceName } from "@/lib/lifefile/constants";
import { CONTACT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

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
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        {label}
      </p>
      <p className="mt-1 text-sm text-navy">{value || "—"}</p>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/orders");

  const ctx = await getClinicOrderingContext(userId);
  if (!ctx || !ctx.verified) redirect("/dashboard/orders");

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();

  // Scoped lookup: returns null for other clinics' orders (renders as 404,
  // indistinguishable from a nonexistent id).
  const detail = await getClinicOrderDetail(ctx.clinicId, orderId);
  if (!detail) notFound();

  const { order, patient, rxs } = detail;
  const ui = ORDER_STATUS_UI[order.status];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Order"
        title={order.lfOrderId ? `#${order.lfOrderId}` : order.referenceId}
        description={`Placed ${dateTimeFmt.format(order.createdAt)}`}
        actions={
          <Link href="/dashboard/orders" className={btnSecondary}>
            Back to orders
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge tone={ui.tone}>{ui.label}</Badge>
        <p className="text-sm text-navy/60">{ui.description}</p>
        {(order.status === "pharmacy_rejected" || order.status === "failed") && (
          <a
            href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(
              `Order ${order.lfOrderId ? `#${order.lfOrderId}` : order.referenceId} needs attention`,
            )}`}
            className="text-sm font-semibold text-magenta hover:underline"
          >
            Contact us about this order
          </a>
        )}
      </div>

      <div className="grid gap-4">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-navy">
            Medications
          </h2>
          <div className="divide-y divide-beige/70">
            {rxs.map((rx) => (
              <div key={rx.id} className="py-4 first:pt-0 last:pb-0">
                <p className="text-[15px] font-semibold text-navy">
                  {rx.drugName}
                  {rx.drugStrength ? ` · ${rx.drugStrength}` : ""}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-navy/70">
                  {rx.directions}
                </p>
                <p className="mt-1.5 text-xs text-navy/50">
                  {[
                    rx.quantity
                      ? `Qty ${rx.quantity}${rx.quantityUnits ? ` ${rx.quantityUnits}` : ""}`
                      : null,
                    rx.daysSupply ? `${rx.daysSupply}-day supply` : null,
                    `${rx.refills} refill${rx.refills === 1 ? "" : "s"}`,
                    `Written ${rx.dateWritten}`,
                  ]
                    .filter(Boolean)
                    .join("  ·  ")}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-base font-semibold text-navy">Patient</h2>
            <div className="grid gap-3">
              <Field
                label="Name"
                value={`${patient.firstName} ${patient.lastName}`}
              />
              <Field label="Date of birth" value={patient.dateOfBirth} />
              <Field
                label="Phone"
                value={
                  patient.phoneMobile || patient.phoneHome || patient.phoneWork
                }
              />
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-base font-semibold text-navy">
              Shipping
            </h2>
            <div className="grid gap-3">
              <Field
                label="Recipient"
                value={`${order.shipping.recipientFirstName} ${order.shipping.recipientLastName} (${order.shipping.recipientType})`}
              />
              <Field
                label="Address"
                value={[
                  order.shipping.addressLine1,
                  order.shipping.addressLine2,
                  `${order.shipping.city}, ${order.shipping.state} ${order.shipping.zipCode}`,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
              <Field
                label="Shipping method"
                value={shippingServiceName(order.serviceId)}
              />
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-navy">Details</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field
              label="Prescriber"
              value={`${order.prescriber.firstName} ${order.prescriber.lastName}`}
            />
            <Field label="Reference" value={order.referenceId} />
            <Field
              label="Billing"
              value={
                order.payorType === "doc" ? "Bill to clinic" : "Bill to patient"
              }
            />
            {order.memo && <Field label="Memo" value={order.memo} />}
          </div>
        </Card>
      </div>
    </main>
  );
}
