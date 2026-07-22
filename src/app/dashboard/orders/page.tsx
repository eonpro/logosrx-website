import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import VerificationBanner from "@/components/dashboard/VerificationBanner";
import { ORDER_STATUS_UI } from "@/components/dashboard/orders/order-status";
import {
  Badge,
  EmptyState,
  PageHeader,
  btnAccent,
  btnSecondary,
  tableWrapClass,
  theadClass,
  rowClass,
} from "@/components/ui/portal";
import { getClinicOrderingContext, listClinicOrders } from "@/lib/orders/data";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function OrdersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard/orders");

  const ctx = await getClinicOrderingContext(userId);
  if (!ctx || !ctx.onboardingCompleted) redirect("/dashboard");

  if (!ctx.verified) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <PageHeader
          title="Orders"
          description="Place prescription orders once your account is approved."
        />
        <VerificationBanner status="pending" />
      </main>
    );
  }

  if (!ctx.orderingEnabled) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <PageHeader
          title="Orders"
          description="Prescribe and track orders without leaving your dashboard."
        />
        <div className={tableWrapClass}>
          <EmptyState
            title="Online ordering is almost ready for your account"
            body="We're finishing your pharmacy setup. In the meantime, keep prescribing through the LifeFile portal — or contact us to speed things up."
            action={
              <a
                href={SITE.lifefilePortal}
                target="_blank"
                rel="noopener noreferrer"
                className={btnSecondary}
              >
                Open LifeFile portal
              </a>
            }
          />
        </div>
      </main>
    );
  }

  const orders = await listClinicOrders(ctx.clinicId);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Orders"
        description="Prescription orders placed through your dashboard."
        actions={
          <Link href="/dashboard/orders/new" className={btnAccent}>
            New order
          </Link>
        }
      />

      <div className={tableWrapClass}>
        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            body="Place your first prescription order — it goes straight to the pharmacy."
            action={
              <Link href="/dashboard/orders/new" className={btnAccent}>
                New order
              </Link>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Patient</th>
                <th className="hidden px-5 py-3.5 md:table-cell">
                  Medications
                </th>
                <th className="px-5 py-3.5">Status</th>
                <th className="hidden px-5 py-3.5 sm:table-cell">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const ui = ORDER_STATUS_UI[o.status];
                return (
                  <tr key={o.id} className={rowClass}>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="font-semibold text-navy hover:underline"
                      >
                        {o.lfOrderId ? `#${o.lfOrderId}` : o.referenceId}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-navy/80">{o.patientName}</td>
                    <td className="hidden max-w-[280px] truncate px-5 py-4 text-navy/60 md:table-cell">
                      {o.drugs.join(", ") || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={ui.tone}>{ui.label}</Badge>
                    </td>
                    <td className="hidden px-5 py-4 tabular-nums text-navy/60 sm:table-cell">
                      {dateFmt.format(o.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
