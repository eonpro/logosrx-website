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
  partnerOrgs,
  partnerReps,
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
import { standardCatalogPrice } from "@/data/catalog";
import { getCatalogProducts } from "@/lib/catalog/store";
import ClinicManager from "./ClinicManager";
import {
  Badge,
  Card,
  PageHeader,
  btnGhost,
  type BadgeTone,
} from "@/components/ui/portal";

const statusTones: Record<string, BadgeTone> = {
  pending: "warning",
  verified: "success",
  rejected: "danger",
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
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
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

  // Affiliate attribution (who referred this clinic), when present.
  const [attribution] = clinic.partnerOrgId
    ? await db
        .select({ orgName: partnerOrgs.name, repName: partnerReps.name })
        .from(partnerOrgs)
        .leftJoin(partnerReps, eq(partnerReps.id, clinic.partnerRepId ?? -1))
        .where(eq(partnerOrgs.id, clinic.partnerOrgId))
        .limit(1)
    : [];

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

  // Split clinic pricing rows into catalog overrides (keyed by SKU) and ad-hoc
  // custom line items (no productId).
  const overrideByProduct = new Map<string, number>();
  const customItems: {
    id: number;
    productName: string;
    priceCents: number;
    unit: string | null;
  }[] = [];
  for (const row of priceItems) {
    if (row.productId) {
      overrideByProduct.set(row.productId, row.priceCents);
    } else {
      customItems.push({
        id: row.id,
        productName: row.productName,
        priceCents: row.priceCents,
        unit: row.unit,
      });
    }
  }

  // Full catalog with standard price + this clinic's override (if any).
  const catalogProducts = await getCatalogProducts();
  const catalog = catalogProducts.map((p) => {
    const std = standardCatalogPrice(p);
    return {
      productId: p.id,
      name: p.name,
      strength: p.strength ?? null,
      unit: p.unit ?? "Each",
      family: p.productFamily?.[0] ?? "Other",
      standardCents: std === null ? null : Math.round(std * 100),
      overrideCents: overrideByProduct.get(p.id) ?? null,
    };
  });

  const name = clinic.clinicName || clinic.practiceLegalName || "Clinic";

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/clinics" className={`${btnGhost} -ml-4`}>
          ← Back to clinics
        </Link>
      </div>

      <PageHeader
        eyebrow="Clinic"
        title={name}
        description={
          <>
            {clinic.contactName}
            {clinic.contactEmail ? ` · ${clinic.contactEmail}` : ""}
          </>
        }
        actions={
          <Badge tone={statusTones[clinic.verificationStatus] ?? "neutral"}>
            {clinic.verificationStatus}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Left: read-only intake details */}
        <Card>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
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
            {attribution && (
              <Field
                label="Partner attribution"
                value={
                  <Link
                    href={`/admin/partners/${clinic.partnerOrgId}`}
                    className="text-navy hover:text-magenta"
                  >
                    {attribution.orgName}
                    {attribution.repName ? ` · ${attribution.repName}` : ""}
                  </Link>
                }
              />
            )}
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
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
              Providers ({clinic.providers?.length ?? 0})
            </p>
            <div className="flex flex-col gap-2">
              {(clinic.providers ?? []).map((p, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-beige/70 bg-cream/50 px-4 py-2.5 text-sm text-navy/80"
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
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
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
        </Card>

        {/* Right: interactive CRM controls */}
        <ClinicManager
          clinicId={clinic.id}
          status={clinic.verificationStatus}
          canActivate={Boolean(clinic.clerkUserId && clinic.contactEmail)}
          hasCard={Boolean(payment?.cardLast4)}
          cardLast4={payment?.cardLast4 ?? null}
          pricing={{
            tier: clinic.pricingTier,
            discountPct: clinic.pricingDiscountPct,
            notes: clinic.pricingNotes ?? "",
          }}
          catalog={catalog}
          customItems={customItems}
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
