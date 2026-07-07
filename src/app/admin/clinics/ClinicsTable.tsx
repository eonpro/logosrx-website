"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ClinicProvider } from "@/lib/db/schema";
import {
  ORDER_VOLUME_OPTIONS,
  PRACTICE_TYPE_OPTIONS,
  PRODUCT_OPTIONS,
  REFERRAL_OPTIONS,
  SHIPPING_METHOD_OPTIONS,
  SPECIALTY_OPTIONS,
  type Option,
} from "@/lib/onboarding/steps";
import { setClinicVerification } from "./actions";
import {
  Badge,
  InitialsAvatar,
  btnSecondary,
  rowClass,
  tableWrapClass,
  theadClass,
  type BadgeTone,
} from "@/components/ui/portal";

/**
 * The projected clinic shape the list renders. Matches the column selection in
 * `page.tsx` — intentionally omits the heavy `*_signature` blobs and any column
 * the table doesn't display.
 */
export type ClinicRow = {
  id: number;
  clinicName: string | null;
  practiceLegalName: string | null;
  practiceDba: string | null;
  ein: string | null;
  practiceType: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressLine1: string | null;
  addressSuite: string | null;
  practicePhone: string | null;
  website: string | null;
  productsOfInterest: string[];
  orderVolume: "0_5000" | "5000_15000" | "15000_50000" | "50000_plus" | null;
  referralSource: string | null;
  shippingMethod: "direct_to_patient" | "ship_to_practice" | null;
  providers: ClinicProvider[];
  verificationStatus: "pending" | "verified" | "rejected";
  createdAt: Date;
  cardLast4: string | null;
};

const statusTones: Record<string, BadgeTone> = {
  pending: "warning",
  verified: "success",
  rejected: "danger",
};

const VERIFICATION_OPTIONS = ["verified", "rejected", "pending"] as const;

function optionLabel(
  options: Option[],
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        {label}
      </p>
      <p className="text-navy">{value || "—"}</p>
    </div>
  );
}

export function ClinicsTable({ clinics }: { clinics: ClinicRow[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  // The clinic currently awaiting a "verify" confirmation, if any.
  const [confirming, setConfirming] = useState<ClinicRow | null>(null);

  function applyStatus(
    id: number,
    status: (typeof VERIFICATION_OPTIONS)[number],
  ) {
    startTransition(async () => {
      await setClinicVerification(id, status);
      router.refresh();
    });
  }

  const confirmName =
    confirming?.clinicName || confirming?.practiceLegalName || "this clinic";

  return (
    <>
    <div className={tableWrapClass}>
      <table className="w-full text-sm">
        <thead className={theadClass}>
          <tr>
            {["Clinic", "Contact", "Products", "Submitted", "Status", ""].map(
              (h, i) => (
                <th key={i} className="px-5 py-4 font-semibold">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {clinics.map((c) => {
            const products = (c.productsOfInterest ?? [])
              .map((p) => optionLabel(PRODUCT_OPTIONS, p))
              .join(", ");
            return (
              <Fragment key={c.id}>
                <tr
                  className={`${rowClass} cursor-pointer`}
                  onClick={() =>
                    setExpandedId(expandedId === c.id ? null : c.id)
                  }
                >
                  <td className="px-5 py-4 font-medium text-navy">
                    <span className="flex items-center gap-3">
                      <InitialsAvatar
                        name={c.clinicName || c.practiceLegalName || "—"}
                      />
                      {c.clinicName || c.practiceLegalName || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-navy/60">
                    {c.contactName || "—"}
                  </td>
                  <td className="px-5 py-4 text-navy/60">{products || "—"}</td>
                  <td className="px-5 py-4 text-navy/65">
                    {new Date(c.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={statusTones[c.verificationStatus] ?? "neutral"}>
                      {c.verificationStatus}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={`text-navy/65 transition-transform ${expandedId === c.id ? "rotate-180" : ""}`}
                    >
                      <path
                        d="M4 6l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </td>
                </tr>
                {expandedId === c.id && (
                  <tr key={`${c.id}-detail`} className="border-b border-beige/60 last:border-0">
                    <td colSpan={6} className="bg-cream/50 px-5 py-5">
                      <div className="mb-4 flex justify-end">
                        <Link
                          href={`/admin/clinics/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-full bg-plum px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-plum-deep active:scale-[0.98]"
                        >
                          Open full record →
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-5">
                        <Field
                          label="Email"
                          value={
                            c.contactEmail ? (
                              <a
                                href={`mailto:${c.contactEmail}`}
                                className="text-navy hover:text-magenta"
                              >
                                {c.contactEmail}
                              </a>
                            ) : null
                          }
                        />
                        <Field
                          label="Phone"
                          value={
                            c.contactPhone ? (
                              <a
                                href={`tel:${c.contactPhone}`}
                                className="text-navy hover:text-magenta"
                              >
                                {c.contactPhone}
                              </a>
                            ) : null
                          }
                        />
                        <Field
                          label="Order Volume"
                          value={optionLabel(ORDER_VOLUME_OPTIONS, c.orderVolume)}
                        />
                        <Field
                          label="Referral"
                          value={optionLabel(REFERRAL_OPTIONS, c.referralSource)}
                        />
                        <Field label="Legal Name" value={c.practiceLegalName} />
                        <Field label="d/b/a" value={c.practiceDba} />
                        <Field label="EIN" value={c.ein} />
                        <Field
                          label="Practice Type"
                          value={optionLabel(PRACTICE_TYPE_OPTIONS, c.practiceType)}
                        />
                        <Field
                          label="Address"
                          value={[c.addressLine1, c.addressSuite]
                            .filter(Boolean)
                            .join(", ")}
                        />
                        <Field label="Practice Phone" value={c.practicePhone} />
                        <Field
                          label="Website"
                          value={
                            c.website ? (
                              <a
                                href={
                                  c.website.startsWith("http")
                                    ? c.website
                                    : `https://${c.website}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-navy hover:text-magenta"
                              >
                                {c.website}
                              </a>
                            ) : null
                          }
                        />
                        <Field
                          label="Shipping"
                          value={optionLabel(SHIPPING_METHOD_OPTIONS, c.shippingMethod)}
                        />
                        <Field
                          label="Card on File"
                          value={c.cardLast4 ? `•••• ${c.cardLast4}` : null}
                        />
                      </div>

                      <div className="mb-5">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                          Providers ({c.providers?.length ?? 0})
                        </p>
                        <div className="flex flex-col gap-2">
                          {(c.providers ?? []).map((p, i) => (
                            <div
                              key={i}
                              className="rounded-2xl border border-beige/70 bg-white px-4 py-2.5 text-sm text-navy/80"
                            >
                              <span className="font-medium text-navy">
                                {p.firstName} {p.lastName}
                              </span>
                              {" — "}
                              {optionLabel(SPECIALTY_OPTIONS, p.specialty)}
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

                      <div className="flex items-center gap-2">
                        <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                          Set status
                        </span>
                        {VERIFICATION_OPTIONS.map((status) => (
                          <button
                            key={status}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (status === "verified") {
                                setConfirming(c);
                                return;
                              }
                              applyStatus(c.id, status);
                            }}
                            disabled={pending || c.verificationStatus === status}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                              c.verificationStatus === status
                                ? "bg-navy/10 text-navy/65 cursor-not-allowed"
                                : status === "verified"
                                  ? "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                                  : status === "rejected"
                                    ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
                                    : "border border-beige-dark bg-white text-navy/60 hover:border-navy/40 hover:text-navy"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4"
          onClick={() => !pending && setConfirming(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-7 shadow-soft-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold tracking-tight text-navy">Verify clinic</h3>
            <p className="mt-2 text-sm text-navy/70">
              Are you sure you want to verify{" "}
              <span className="font-semibold text-navy">{confirmName}</span>?
              Approving emails the clinic their approval and posts to Slack.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirming(null)}
                disabled={pending}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = confirming.id;
                  setConfirming(null);
                  applyStatus(id, "verified");
                }}
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
              >
                {pending ? "Verifying…" : "Yes, verify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
