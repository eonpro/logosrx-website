export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cardAccessLog,
  clinicNotes,
  clinicPayments,
  clinicPricing,
  clinics,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import {
  ORDER_VOLUME_OPTIONS,
  PRACTICE_TYPE_OPTIONS,
  PRODUCT_OPTIONS,
  REFERRAL_OPTIONS,
  SHIPPING_METHOD_OPTIONS,
  SPECIALTY_OPTIONS,
  type Option,
} from "@/lib/onboarding/steps";
import ClinicManager from "./ClinicManager";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  verified: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function optionLabel(options: Option[], value: string | null | undefined) {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wider text-navy/55">
        {label}
      </p>
      <p className="text-navy">{value || "—"}</p>
    </div>
  );
}

export default async function ClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const [clinic] = await db
    .select()
    .from(clinics)
    .where(eq(clinics.id, id))
    .limit(1);
  if (!clinic) notFound();

  const [payment] = await db
    .select({ cardLast4: clinicPayments.cardLast4 })
    .from(clinicPayments)
    .where(eq(clinicPayments.clerkUserId, clinic.clerkUserId))
    .limit(1);

  const [notes, priceItems, accessLog] = await Promise.all([
    db
      .select()
      .from(clinicNotes)
      .where(eq(clinicNotes.clinicId, id))
      .orderBy(desc(clinicNotes.createdAt)),
    db
      .select()
      .from(clinicPricing)
      .where(eq(clinicPricing.clinicId, id))
      .orderBy(desc(clinicPricing.createdAt)),
    db
      .select()
      .from(cardAccessLog)
      .where(eq(cardAccessLog.clinicId, id))
      .orderBy(desc(cardAccessLog.createdAt))
      .limit(10),
  ]);

  const name = clinic.clinicName || clinic.practiceLegalName || "Clinic";

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/clinics"
          className="text-sm text-navy/60 hover:text-magenta"
        >
          ← Back to clinics
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">{name}</h1>
          <p className="mt-1 text-sm text-navy/60">
            {clinic.contactName}
            {clinic.contactEmail ? ` · ${clinic.contactEmail}` : ""}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[clinic.verificationStatus]}`}
        >
          {clinic.verificationStatus}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Left: read-only intake details */}
        <div className="rounded-2xl border border-beige bg-white p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-navy/70">
            Intake details
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field
              label="Email"
              value={
                clinic.contactEmail ? (
                  <a
                    href={`mailto:${clinic.contactEmail}`}
                    className="text-navy hover:text-magenta"
                  >
                    {clinic.contactEmail}
                  </a>
                ) : null
              }
            />
            <Field
              label="Phone"
              value={
                clinic.contactPhone ? (
                  <a
                    href={`tel:${clinic.contactPhone}`}
                    className="text-navy hover:text-magenta"
                  >
                    {clinic.contactPhone}
                  </a>
                ) : null
              }
            />
            <Field label="Legal name" value={clinic.practiceLegalName} />
            <Field label="d/b/a" value={clinic.practiceDba} />
            <Field label="EIN" value={clinic.ein} />
            <Field
              label="Practice type"
              value={optionLabel(PRACTICE_TYPE_OPTIONS, clinic.practiceType)}
            />
            <Field
              label="Address"
              value={[clinic.addressLine1, clinic.addressSuite]
                .filter(Boolean)
                .join(", ")}
            />
            <Field label="Practice phone" value={clinic.practicePhone} />
            <Field
              label="Order volume"
              value={optionLabel(ORDER_VOLUME_OPTIONS, clinic.orderVolume)}
            />
            <Field
              label="Referral"
              value={optionLabel(REFERRAL_OPTIONS, clinic.referralSource)}
            />
            <Field
              label="Products"
              value={(clinic.productsOfInterest ?? [])
                .map((p) => optionLabel(PRODUCT_OPTIONS, p))
                .join(", ")}
            />
            <Field
              label="Shipping"
              value={optionLabel(SHIPPING_METHOD_OPTIONS, clinic.shippingMethod)}
            />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs uppercase tracking-wider text-navy/55">
              Providers ({clinic.providers?.length ?? 0})
            </p>
            <div className="flex flex-col gap-2">
              {(clinic.providers ?? []).map((p, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-beige bg-cream/30 px-3 py-2 text-sm text-navy/80"
                >
                  <span className="font-medium text-navy">
                    {p.firstName} {p.lastName}
                  </span>{" "}
                  — {optionLabel(SPECIALTY_OPTIONS, p.specialty)}
                  <span className="text-navy/55">
                    {" "}
                    · NPI {p.npi || "—"} · Lic {p.medicalLicense || "—"}
                    {p.licenseState ? ` (${p.licenseState})` : ""}
                    {p.dea ? ` · DEA ${p.dea}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {accessLog.length > 0 && (
            <div className="mt-5 border-t border-beige pt-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-navy/55">
                Card access log
              </p>
              <ul className="flex flex-col gap-1 text-xs text-navy/60">
                {accessLog.map((a) => (
                  <li key={a.id}>
                    {a.adminEmail ?? a.adminUserId} ·{" "}
                    {new Date(a.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: interactive CRM controls */}
        <ClinicManager
          clinicId={clinic.id}
          status={clinic.verificationStatus}
          hasCard={Boolean(payment?.cardLast4)}
          cardLast4={payment?.cardLast4 ?? null}
          pricing={{
            tier: clinic.pricingTier,
            discountPct: clinic.pricingDiscountPct,
            notes: clinic.pricingNotes ?? "",
          }}
          priceItems={priceItems.map((p) => ({
            id: p.id,
            productName: p.productName,
            priceCents: p.priceCents,
            unit: p.unit,
          }))}
          notes={notes.map((n) => ({
            id: n.id,
            body: n.body,
            authorEmail: n.authorEmail,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
