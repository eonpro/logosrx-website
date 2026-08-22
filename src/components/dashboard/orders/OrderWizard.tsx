"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import {
  createPatientAction,
  submitOrderAction,
} from "@/app/dashboard/orders/actions";
import { fieldClass } from "@/components/onboarding/primitives";
import { Badge, Card, btnAccent, btnSecondary } from "@/components/ui/portal";
import { formatCents } from "@/lib/portal/pricing";
import { normalizePhone } from "@/lib/lifefile/normalize";
import type { OrderableProduct } from "@/lib/orders/products";
import type { LifeFileShippingService } from "@/lib/lifefile/constants";
import type { Patient, ClinicProvider } from "@/lib/db/schema";
import {
  DRAFT_STORAGE_KEY,
  estimateTotalCents,
  parseDraft,
  patientFieldErrors,
  rxFieldErrors,
  serializeDraft,
  shippingFieldErrors,
  sigPresetsFor,
  type FieldErrors,
  type PatientDraft,
  type RxDraft,
  type ShippingDraft,
} from "./wizard-helpers";

/**
 * The "New prescription" wizard: Patient -> Prescriber & medications ->
 * Shipping -> Review -> Sent.
 *
 * UX principles baked in:
 *  - Visible labels on every field (placeholders are examples, not labels).
 *  - Validate per field, inline, when the user tries to continue — never
 *    a dead-end generic banner for a fixable field problem.
 *  - Never lose work: state autosaves to sessionStorage (tab-scoped, cleared
 *    on success/close — deliberately NOT localStorage, this is PHI).
 *  - The server pipeline stays the source of truth; anything it rejects is
 *    surfaced verbatim in the banner as a last line of defense.
 */

const STEPS = ["Patient", "Medications", "Shipping", "Review"] as const;

const EMPTY_PATIENT: PatientDraft = {
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  phoneMobile: "",
  email: "",
  allergies: "",
  conditions: "",
};

function newSubmissionKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "")
    : `${Date.now()}${Math.random().toString(36).slice(2, 12)}`;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ------------------------------ small components ------------------------- */

function Labeled({
  label,
  required,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-navy/70">
          {label}
          {required && <span className="text-magenta"> *</span>}
        </span>
        {children}
      </label>
      {error ? (
        <p className="mt-1 text-[13px] font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[13px] text-navy/45">{hint}</p>
      ) : null}
    </div>
  );
}

function inputCls(hasError: boolean | undefined): string {
  return hasError
    ? `${fieldClass} border-red-300 focus:border-red-400 focus:ring-red-100`
    : fieldClass;
}

function SelectableCard({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all ${
        selected
          ? "border-plum bg-plum/[0.04] shadow-soft"
          : "border-beige bg-white hover:border-navy/30"
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold text-navy">
          {title}
        </span>
        {subtitle && (
          <span className="mt-0.5 block text-[13px] text-navy/50">{subtitle}</span>
        )}
      </span>
      <span
        className={`ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-plum bg-plum text-white" : "border-navy/20 bg-white"
        }`}
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5L5 9l4.5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
}

function PillToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label={ariaLabel}>
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
            value === v
              ? "bg-plum text-white shadow-soft"
              : "border border-beige bg-white text-navy/60 hover:border-navy/30"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function WizardNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  showBack = true,
  busy = false,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  showBack?: boolean;
  busy?: boolean;
}) {
  return (
    <div className="mt-8 flex items-center gap-3">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          disabled={busy}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-beige-dark bg-white text-navy transition-all hover:border-navy/40 active:scale-95 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M11 4L6 9l5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={busy}
        className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-plum text-[15px] font-semibold text-white transition-all hover:bg-plum-deep active:scale-[0.99] disabled:opacity-60"
      >
        {nextLabel}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8h10M8 3l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

/* --------------------------------- wizard -------------------------------- */

export default function OrderWizard({
  clinicKey,
  patients: initialPatients,
  providers,
  products,
  services,
  defaultServiceId,
  preselectedProductId,
}: {
  /** Stable per-clinic key for scoping the autosaved draft. */
  clinicKey: string;
  patients: Patient[];
  providers: ClinicProvider[];
  products: OrderableProduct[];
  services: LifeFileShippingService[];
  defaultServiceId: number | null;
  preselectedProductId: string | null;
}) {
  const errorRef = useRef<HTMLDivElement>(null);

  const orderable = useMemo(() => products.filter((p) => p.orderable), [products]);
  const prescribers = useMemo(
    () => providers.filter((p) => /^\d{10}$/.test(p.npi.replace(/\D/g, ""))),
    [providers],
  );

  const [step, setStep] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [success, setSuccess] = useState<{
    orderId: number;
    lfOrderId: string | null;
  } | null>(null);

  // Step 1 — patient
  const [patients, setPatients] = useState(initialPatients);
  const [patientId, setPatientId] = useState<number | null>(
    initialPatients.length === 1 ? initialPatients[0].id : null,
  );
  const [patientQuery, setPatientQuery] = useState("");
  const [showNewPatient, setShowNewPatient] = useState(initialPatients.length === 0);
  const [patientDraft, setPatientDraft] = useState<PatientDraft>(EMPTY_PATIENT);
  const [patientErrors, setPatientErrors] = useState<FieldErrors>({});

  // Step 2 — prescriber + medications
  const [prescriberNpi, setPrescriberNpi] = useState(
    prescribers.length === 1 ? prescribers[0].npi.replace(/\D/g, "") : "",
  );
  const [productQuery, setProductQuery] = useState("");
  const [rxErrors, setRxErrors] = useState<Record<number, string>>({});
  const [rxs, setRxs] = useState<RxDraft[]>(() => {
    const pre = orderable.find((p) => p.id === preselectedProductId);
    return pre
      ? [
          {
            productId: pre.id,
            directions: "",
            quantity: pre.defaultQuantity ?? "1",
            daysSupply: "",
            refills: "0",
          },
        ]
      : [];
  });

  // Step 3 — shipping
  const [shipping, setShipping] = useState<ShippingDraft>({
    recipientType: "patient",
    recipientFirstName: "",
    recipientLastName: "",
    recipientPhone: "",
    recipientEmail: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    serviceId: defaultServiceId ? String(defaultServiceId) : "",
  });
  const [shippingErrors, setShippingErrors] = useState<FieldErrors>({});
  const [payorType, setPayorType] = useState<"doc" | "pat">("doc");
  const [memo, setMemo] = useState("");

  const submissionKey = useRef(newSubmissionKey());

  const selectedPatient = patients.find((p) => p.id === patientId) ?? null;
  const selectedPrescriber =
    prescribers.find((p) => p.npi.replace(/\D/g, "") === prescriberNpi) ?? null;

  /* ------------------------- draft restore + autosave -------------------- */

  useEffect(() => {
    // Restore once on mount. A storefront "Prescribe" click (preselected
    // product) intentionally starts fresh — that's an explicit new intent.
    if (preselectedProductId) return;
    const draft = parseDraft(sessionStorage.getItem(DRAFT_STORAGE_KEY), clinicKey);
    if (!draft) return;
    setStep(Math.min(draft.step, STEPS.length - 1));
    setPatientId(draft.patientId);
    setPrescriberNpi(draft.prescriberNpi);
    setRxs(draft.rxs);
    setShipping(draft.shipping);
    setPayorType(draft.payorType);
    setMemo(draft.memo);
    submissionKey.current = draft.submissionKey;
    setRestoredDraft(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (success) return;
    const handle = setTimeout(() => {
      try {
        sessionStorage.setItem(
          DRAFT_STORAGE_KEY,
          serializeDraft({
            clinicKey,
            step,
            patientId,
            prescriberNpi,
            rxs,
            shipping,
            payorType,
            memo,
            submissionKey: submissionKey.current,
          }),
        );
      } catch {
        // Storage full/blocked — autosave is best-effort.
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [clinicKey, step, patientId, prescriberNpi, rxs, shipping, payorType, memo, success]);

  function clearDraft() {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /* ------------------------------ navigation ----------------------------- */

  function showBanner(message: string) {
    setBanner(message);
    requestAnimationFrame(() =>
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }

  function goTo(next: number) {
    setBanner(null);
    setShowErrors(false);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------------------- step 1: patient -------------------------- */

  const filteredPatients = useMemo(() => {
    const needle = patientQuery.trim().toLowerCase();
    if (!needle) return patients;
    return patients.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(needle),
    );
  }, [patients, patientQuery]);

  async function saveNewPatient() {
    const errors = patientFieldErrors(patientDraft);
    setPatientErrors(errors);
    setShowErrors(true);
    if (Object.keys(errors).length > 0) {
      showBanner("A few patient fields need attention — see below.");
      return;
    }
    setBusy(true);
    setBanner(null);
    const result = await createPatientAction({
      ...patientDraft,
      state: patientDraft.state.trim().toUpperCase(),
      allergies: splitList(patientDraft.allergies),
      conditions: splitList(patientDraft.conditions),
    });
    setBusy(false);
    if (!result.ok) {
      showBanner(result.error);
      return;
    }
    setPatients((prev) => [...prev, result.patient]);
    setPatientId(result.patient.id);
    setShowNewPatient(false);
    setShowErrors(false);
    setPatientDraft(EMPTY_PATIENT);
  }

  function continueFromPatient() {
    if (!patientId) {
      showBanner(
        patients.length === 0
          ? "Add your first patient to continue."
          : "Select a patient or add a new one.",
      );
      return;
    }
    goTo(1);
  }

  /* -------------------------- step 2: medications ------------------------ */

  const rxCountByProduct = useMemo(() => {
    const counts = new Map<string, number>();
    for (const rx of rxs) counts.set(rx.productId, (counts.get(rx.productId) ?? 0) + 1);
    return counts;
  }, [rxs]);

  function addRx(product: OrderableProduct) {
    setRxs((prev) => [
      ...prev,
      {
        productId: product.id,
        directions: "",
        quantity: product.defaultQuantity ?? "1",
        daysSupply: "",
        refills: "0",
      },
    ]);
    setProductQuery("");
    setRxErrors({});
  }

  function updateRx(index: number, patch: Partial<RxDraft>) {
    setRxs((prev) => prev.map((rx, i) => (i === index ? { ...rx, ...patch } : rx)));
  }

  function removeRx(index: number) {
    setRxs((prev) => prev.filter((_, i) => i !== index));
    setRxErrors({});
  }

  function continueFromMeds() {
    if (!prescriberNpi) {
      showBanner("Select the prescribing provider.");
      return;
    }
    if (rxs.length === 0) {
      showBanner("Add at least one medication from the catalog below.");
      return;
    }
    const errors = rxFieldErrors(rxs, products);
    setRxErrors(errors);
    setShowErrors(true);
    if (Object.keys(errors).length > 0) {
      showBanner("Each medication needs directions — see highlights below.");
      return;
    }
    // Prefill shipping from the patient the first time we reach step 3.
    if (selectedPatient && !shipping.recipientFirstName) {
      applyPatientAddress();
    }
    goTo(2);
  }

  /* ---------------------------- step 3: shipping -------------------------- */

  function applyPatientAddress() {
    if (!selectedPatient) return;
    setShipping((s) => ({
      ...s,
      recipientType: "patient",
      recipientFirstName: selectedPatient.firstName,
      recipientLastName: selectedPatient.lastName,
      recipientPhone: selectedPatient.phoneMobile ?? "",
      recipientEmail: selectedPatient.email ?? "",
      addressLine1: selectedPatient.address1 ?? "",
      addressLine2: selectedPatient.address2 ?? "",
      city: selectedPatient.city ?? "",
      state: selectedPatient.state ?? "",
      zipCode: selectedPatient.zip ?? "",
    }));
    setShippingErrors({});
  }

  function formatPhoneOnBlur(key: "recipientPhone") {
    const normalized = normalizePhone(shipping[key]);
    if (normalized) setShipping((s) => ({ ...s, [key]: normalized }));
  }

  function continueFromShipping() {
    const errors = shippingFieldErrors(shipping);
    setShippingErrors(errors);
    setShowErrors(true);
    if (Object.keys(errors).length > 0) {
      showBanner("A few shipping fields need attention — see below.");
      return;
    }
    goTo(3);
  }

  /* -------------------------------- submit ------------------------------- */

  async function submit() {
    setBusy(true);
    setBanner(null);
    const result = await submitOrderAction({
      patientId,
      prescriberNpi,
      payorType,
      memo: memo || undefined,
      shipping: {
        ...shipping,
        state: shipping.state.trim().toUpperCase(),
        serviceId: shipping.serviceId || undefined,
      },
      rxs: rxs.map((rx) => ({
        productId: rx.productId,
        directions: rx.directions,
        quantity: rx.quantity || undefined,
        daysSupply: rx.daysSupply || undefined,
        refills: rx.refills || 0,
      })),
      submissionKey: submissionKey.current,
    });
    setBusy(false);
    if (!result.ok) {
      showBanner(result.error);
      return;
    }
    clearDraft();
    setSuccess({ orderId: result.orderId, lfOrderId: result.lfOrderId });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const estimatedTotal = estimateTotalCents(rxs, products);

  /* ------------------------------- rendering ------------------------------ */

  if (success) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 px-8 py-12 text-center">
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white">
            <svg width="28" height="28" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3.5 9.5L7 13l7.5-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h2 className="font-display text-3xl font-medium text-navy">
            Order sent to the pharmacy
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-navy/60">
            {success.lfOrderId ? (
              <>
                Pharmacy order number{" "}
                <span className="font-semibold text-navy">#{success.lfOrderId}</span>. 
              </>
            ) : null}{" "}
            We&rsquo;ll flag it in your Orders tab if anything needs attention.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={`/dashboard/orders/${success.orderId}`} className={btnAccent}>
              View order
            </Link>
            <Link href="/dashboard/orders/new" className={btnSecondary}>
              Place another order
            </Link>
            <Link
              href="/dashboard/orders"
              className="text-sm font-medium text-navy/50 hover:text-navy"
            >
              All orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicator (clickable for completed steps) */}
      <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <button
              type="button"
              disabled={i >= step}
              onClick={() => goTo(i)}
              aria-label={`Go to step: ${label}`}
              className={`h-1.5 w-full rounded-full transition-colors ${
                i <= step ? "bg-plum" : "bg-beige"
              } ${i < step ? "cursor-pointer hover:bg-plum-deep" : ""}`}
            />
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide ${
                i === step ? "text-navy" : "text-navy/40"
              }`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {restoredDraft && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-beige bg-cream/70 px-5 py-3.5 text-sm text-navy/70">
          <span>Welcome back — we saved where you left off.</span>
          <button
            type="button"
            onClick={() => {
              clearDraft();
              window.location.reload();
            }}
            className="shrink-0 text-sm font-semibold text-magenta hover:underline"
          >
            Start over
          </button>
        </div>
      )}

      {banner && (
        <div
          ref={errorRef}
          role="alert"
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
        >
          {banner}
        </div>
      )}

      {/* ------------------------------ step 1 ------------------------------ */}
      {step === 0 && (
        <section aria-label="Patient">
          <h2 className="mb-1 font-display text-2xl font-medium text-navy">
            Who is this prescription for?
          </h2>
          <p className="mb-5 text-[15px] text-navy/55">
            Pick a saved patient or add a new one — we keep them on file for
            repeat orders.
          </p>

          {patients.length > 0 && !showNewPatient && (
            <>
              {patients.length > 5 && (
                <input
                  type="search"
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  placeholder="Search patients…"
                  aria-label="Search patients"
                  className={`${fieldClass} mb-3`}
                />
              )}
              <div className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
                {filteredPatients.map((p) => (
                  <SelectableCard
                    key={p.id}
                    selected={p.id === patientId}
                    onClick={() => setPatientId(p.id)}
                    title={`${p.firstName} ${p.lastName}`}
                    subtitle={
                      <>
                        DOB {p.dateOfBirth}
                        {p.city ? ` · ${p.city}, ${p.state ?? ""}` : ""}
                      </>
                    }
                  />
                ))}
                {filteredPatients.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-beige-dark px-5 py-6 text-center text-sm text-navy/50">
                    No patients match &ldquo;{patientQuery}&rdquo;.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowNewPatient(true)}
                className="mt-3 w-full rounded-2xl border-2 border-dashed border-beige-dark bg-white px-5 py-4 text-left text-[15px] font-semibold text-navy/60 transition-all hover:border-navy/40 hover:text-navy"
              >
                + Add a new patient
              </button>
            </>
          )}

          {showNewPatient && (
            <Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Labeled
                  label="First name"
                  required
                  error={showErrors ? patientErrors.firstName : undefined}
                >
                  <input
                    className={inputCls(showErrors && !!patientErrors.firstName)}
                    autoComplete="off"
                    value={patientDraft.firstName}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, firstName: e.target.value })
                    }
                  />
                </Labeled>
                <Labeled
                  label="Last name"
                  required
                  error={showErrors ? patientErrors.lastName : undefined}
                >
                  <input
                    className={inputCls(showErrors && !!patientErrors.lastName)}
                    autoComplete="off"
                    value={patientDraft.lastName}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, lastName: e.target.value })
                    }
                  />
                </Labeled>
                <Labeled
                  label="Sex"
                  required
                  error={showErrors ? patientErrors.gender : undefined}
                >
                  <select
                    className={`${inputCls(showErrors && !!patientErrors.gender)} appearance-none`}
                    value={patientDraft.gender}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, gender: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                    <option value="u">Unspecified</option>
                  </select>
                </Labeled>
                <Labeled
                  label="Date of birth"
                  required
                  error={showErrors ? patientErrors.dateOfBirth : undefined}
                >
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    className={inputCls(showErrors && !!patientErrors.dateOfBirth)}
                    value={patientDraft.dateOfBirth}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, dateOfBirth: e.target.value })
                    }
                  />
                </Labeled>
                <Labeled
                  label="Mobile phone"
                  hint="Used by the pharmacy for delivery questions."
                  error={showErrors ? patientErrors.phoneMobile : undefined}
                >
                  <input
                    inputMode="tel"
                    placeholder="(305) 555-0100"
                    className={inputCls(showErrors && !!patientErrors.phoneMobile)}
                    value={patientDraft.phoneMobile}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, phoneMobile: e.target.value })
                    }
                    onBlur={() => {
                      const n = normalizePhone(patientDraft.phoneMobile);
                      if (n) setPatientDraft((d) => ({ ...d, phoneMobile: n }));
                    }}
                  />
                </Labeled>
                <Labeled
                  label="Email"
                  error={showErrors ? patientErrors.email : undefined}
                >
                  <input
                    type="email"
                    placeholder="patient@email.com"
                    className={inputCls(showErrors && !!patientErrors.email)}
                    value={patientDraft.email}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, email: e.target.value })
                    }
                  />
                </Labeled>
                <Labeled label="Street address" className="sm:col-span-2">
                  <input
                    autoComplete="off"
                    placeholder="100 Main St"
                    className={fieldClass}
                    value={patientDraft.address1}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, address1: e.target.value })
                    }
                  />
                </Labeled>
                <Labeled label="City">
                  <input
                    className={fieldClass}
                    value={patientDraft.city}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, city: e.target.value })
                    }
                  />
                </Labeled>
                <div className="grid grid-cols-2 gap-4">
                  <Labeled
                    label="State"
                    error={showErrors ? patientErrors.state : undefined}
                  >
                    <input
                      maxLength={2}
                      placeholder="FL"
                      className={`${inputCls(showErrors && !!patientErrors.state)} uppercase`}
                      value={patientDraft.state}
                      onChange={(e) =>
                        setPatientDraft({ ...patientDraft, state: e.target.value })
                      }
                    />
                  </Labeled>
                  <Labeled
                    label="ZIP"
                    error={showErrors ? patientErrors.zip : undefined}
                  >
                    <input
                      inputMode="numeric"
                      placeholder="33101"
                      className={inputCls(showErrors && !!patientErrors.zip)}
                      value={patientDraft.zip}
                      onChange={(e) =>
                        setPatientDraft({ ...patientDraft, zip: e.target.value })
                      }
                    />
                  </Labeled>
                </div>
                <Labeled
                  label="Allergies"
                  hint="Comma-separated; shown to the pharmacist. Leave blank for none."
                  className="sm:col-span-2"
                >
                  <input
                    placeholder="penicillin, sulfa"
                    className={fieldClass}
                    value={patientDraft.allergies}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, allergies: e.target.value })
                    }
                  />
                </Labeled>
                <Labeled
                  label="Conditions"
                  hint="Comma-separated; shown to the pharmacist."
                  className="sm:col-span-2"
                >
                  <input
                    placeholder="type 2 diabetes"
                    className={fieldClass}
                    value={patientDraft.conditions}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, conditions: e.target.value })
                    }
                  />
                </Labeled>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={saveNewPatient}
                  className="rounded-full bg-plum px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-plum-deep disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save patient"}
                </button>
                {patients.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewPatient(false);
                      setShowErrors(false);
                    }}
                    className={btnSecondary}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </Card>
          )}

          {!showNewPatient && (
            <WizardNav onNext={continueFromPatient} showBack={false} />
          )}
        </section>
      )}

      {/* ------------------------------ step 2 ------------------------------ */}
      {step === 1 && (
        <section aria-label="Medications">
          <h2 className="mb-1 font-display text-2xl font-medium text-navy">
            Prescriber &amp; medications
          </h2>
          <p className="mb-5 text-[15px] text-navy/55">
            Prescribing for{" "}
            <span className="font-semibold text-navy">
              {selectedPatient
                ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                : "—"}
            </span>
            .
          </p>

          {prescribers.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
              <p className="text-[15px] font-semibold text-amber-900">
                No prescriber on your profile yet
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-amber-800/80">
                Add at least one provider with their 10-digit NPI to your
                account, then come back — it takes a minute.
              </p>
              <Link href="/dashboard/account" className={`mt-4 ${btnSecondary}`}>
                Add a provider
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Labeled label="Prescribing provider" required>
                  <select
                    className={`${fieldClass} appearance-none`}
                    value={prescriberNpi}
                    onChange={(e) => setPrescriberNpi(e.target.value)}
                  >
                    <option value="" disabled>
                      Select provider…
                    </option>
                    {prescribers.map((p) => (
                      <option key={p.npi} value={p.npi.replace(/\D/g, "")}>
                        {p.firstName} {p.lastName} — NPI {p.npi}
                      </option>
                    ))}
                  </select>
                </Labeled>
              </div>

              {rxs.map((rx, i) => {
                const product = products.find((p) => p.id === rx.productId);
                const presets = sigPresetsFor(product?.form);
                const rxError = showErrors ? rxErrors[i] : undefined;
                return (
                  <Card
                    key={`${rx.productId}-${i}`}
                    className={`mb-4 ${rxError ? "ring-2 ring-red-200" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[15px] font-semibold text-navy">
                          {product?.name ?? rx.productId}
                        </p>
                        <p className="mt-0.5 text-xs text-navy/55">
                          {[product?.strength, product?.form].filter(Boolean).join(" · ")}
                          {product?.priceCents != null &&
                            ` · ${formatCents(product.priceCents)}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRx(i)}
                        aria-label={`Remove ${product?.name ?? "medication"}`}
                        className="text-sm font-semibold text-navy/40 transition-colors hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>

                    {rxError && (
                      <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700">
                        {rxError}
                      </p>
                    )}

                    <div className="mt-4 grid gap-4">
                      <Labeled label="Directions (sig)" required>
                        <textarea
                          aria-label="Directions (sig)"
                          placeholder="e.g. Inject 10 units (0.10 mL) subcutaneously once weekly"
                          rows={2}
                          className={inputCls(!!rxError)}
                          value={rx.directions}
                          onChange={(e) => updateRx(i, { directions: e.target.value })}
                        />
                      </Labeled>
                      {presets.length > 0 && rx.directions.trim() === "" && (
                        <div className="-mt-2 flex flex-wrap gap-2">
                          {presets.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => updateRx(i, { directions: preset })}
                              className="rounded-full border border-beige bg-cream/60 px-3 py-1.5 text-xs font-medium text-navy/70 transition-colors hover:border-navy/30 hover:text-navy"
                            >
                              {preset.length > 52 ? `${preset.slice(0, 52)}…` : preset}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-3">
                        <Labeled
                          label={`Quantity${product?.quantityUnits ? ` (${product.quantityUnits})` : ""}`}
                        >
                          <input
                            inputMode="decimal"
                            className={fieldClass}
                            value={rx.quantity}
                            onChange={(e) => updateRx(i, { quantity: e.target.value })}
                          />
                        </Labeled>
                        <Labeled label="Days supply">
                          <input
                            type="number"
                            min={1}
                            placeholder="28"
                            className={fieldClass}
                            value={rx.daysSupply}
                            onChange={(e) => updateRx(i, { daysSupply: e.target.value })}
                          />
                        </Labeled>
                        <Labeled label="Refills">
                          <input
                            type="number"
                            min={0}
                            max={11}
                            className={fieldClass}
                            value={rx.refills}
                            onChange={(e) => updateRx(i, { refills: e.target.value })}
                          />
                        </Labeled>
                      </div>
                    </div>
                  </Card>
                );
              })}

              <div className="mb-2">
                <p className="mb-2 text-[13px] font-semibold text-navy/70">
                  {rxs.length === 0 ? "Add a medication" : "Add another medication"}
                </p>
                <input
                  type="search"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search your catalog…"
                  aria-label="Search medications"
                  className={fieldClass}
                />
                <div className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-beige bg-white">
                  {orderable
                    .filter((p) => {
                      const needle = productQuery.trim().toLowerCase();
                      if (!needle) return true;
                      return `${p.name} ${p.strength ?? ""} ${p.form}`
                        .toLowerCase()
                        .includes(needle);
                    })
                    .map((p) => {
                      const added = rxCountByProduct.get(p.id) ?? 0;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addRx(p)}
                          className="flex w-full items-center justify-between gap-3 border-b border-beige/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-cream/60"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-navy">
                              {p.name}
                              {added > 0 && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-plum/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-plum">
                                  Added{added > 1 ? ` ×${added}` : ""}
                                </span>
                              )}
                            </span>
                            <span className="block text-xs text-navy/50">
                              {[p.strength, p.form].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums text-navy/70">
                              {formatCents(p.priceCents)}
                            </span>
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-plum/10 text-plum">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 2v8M2 6h8" strokeLinecap="round" />
                              </svg>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  {orderable.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-navy/50">
                      No medications are enabled for online ordering yet —
                      contact us to get your catalog set up.
                    </p>
                  )}
                </div>
              </div>

              <WizardNav onBack={() => goTo(0)} onNext={continueFromMeds} />
            </>
          )}
        </section>
      )}

      {/* ------------------------------ step 3 ------------------------------ */}
      {step === 2 && (
        <section aria-label="Shipping">
          <h2 className="mb-1 font-display text-2xl font-medium text-navy">
            Where should it ship?
          </h2>
          <p className="mb-5 text-[15px] text-navy/55">
            The pharmacy ships directly — nothing goes through us.
          </p>

          <div className="mb-4">
            <PillToggle
              ariaLabel="Ship to"
              value={shipping.recipientType}
              options={[
                ["patient", "Ship to patient"],
                ["clinic", "Ship to clinic"],
              ]}
              onChange={(value) =>
                setShipping((s) => ({ ...s, recipientType: value }))
              }
            />
          </div>

          {selectedPatient?.address1 && (
            <button
              type="button"
              onClick={applyPatientAddress}
              className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-magenta hover:underline"
            >
              Use {selectedPatient.firstName}&rsquo;s address on file
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Labeled
              label="Recipient first name"
              required
              error={showErrors ? shippingErrors.recipientFirstName : undefined}
            >
              <input
                className={inputCls(showErrors && !!shippingErrors.recipientFirstName)}
                value={shipping.recipientFirstName}
                onChange={(e) =>
                  setShipping({ ...shipping, recipientFirstName: e.target.value })
                }
              />
            </Labeled>
            <Labeled
              label="Recipient last name"
              required
              error={showErrors ? shippingErrors.recipientLastName : undefined}
            >
              <input
                className={inputCls(showErrors && !!shippingErrors.recipientLastName)}
                value={shipping.recipientLastName}
                onChange={(e) =>
                  setShipping({ ...shipping, recipientLastName: e.target.value })
                }
              />
            </Labeled>
            <Labeled
              label="Phone"
              hint="For delivery updates from the carrier."
              error={showErrors ? shippingErrors.recipientPhone : undefined}
            >
              <input
                inputMode="tel"
                placeholder="(305) 555-0100"
                className={inputCls(showErrors && !!shippingErrors.recipientPhone)}
                value={shipping.recipientPhone}
                onChange={(e) =>
                  setShipping({ ...shipping, recipientPhone: e.target.value })
                }
                onBlur={() => formatPhoneOnBlur("recipientPhone")}
              />
            </Labeled>
            <Labeled
              label="Email"
              error={showErrors ? shippingErrors.recipientEmail : undefined}
            >
              <input
                type="email"
                className={inputCls(showErrors && !!shippingErrors.recipientEmail)}
                value={shipping.recipientEmail}
                onChange={(e) =>
                  setShipping({ ...shipping, recipientEmail: e.target.value })
                }
              />
            </Labeled>
            <Labeled
              label="Street address"
              required
              className="sm:col-span-2"
              error={showErrors ? shippingErrors.addressLine1 : undefined}
            >
              <input
                className={inputCls(showErrors && !!shippingErrors.addressLine1)}
                value={shipping.addressLine1}
                onChange={(e) =>
                  setShipping({ ...shipping, addressLine1: e.target.value })
                }
              />
            </Labeled>
            <Labeled label="Suite / unit" className="sm:col-span-2">
              <input
                className={fieldClass}
                value={shipping.addressLine2}
                onChange={(e) =>
                  setShipping({ ...shipping, addressLine2: e.target.value })
                }
              />
            </Labeled>
            <Labeled
              label="City"
              required
              error={showErrors ? shippingErrors.city : undefined}
            >
              <input
                className={inputCls(showErrors && !!shippingErrors.city)}
                value={shipping.city}
                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
              />
            </Labeled>
            <div className="grid grid-cols-2 gap-4">
              <Labeled
                label="State"
                required
                error={showErrors ? shippingErrors.state : undefined}
              >
                <input
                  maxLength={2}
                  placeholder="FL"
                  className={`${inputCls(showErrors && !!shippingErrors.state)} uppercase`}
                  value={shipping.state}
                  onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                />
              </Labeled>
              <Labeled
                label="ZIP"
                required
                error={showErrors ? shippingErrors.zipCode : undefined}
              >
                <input
                  inputMode="numeric"
                  placeholder="33101"
                  className={inputCls(showErrors && !!shippingErrors.zipCode)}
                  value={shipping.zipCode}
                  onChange={(e) =>
                    setShipping({ ...shipping, zipCode: e.target.value })
                  }
                />
              </Labeled>
            </div>
            <Labeled
              label="Shipping speed"
              hint="Leave on account default unless this order needs something specific."
              className="sm:col-span-2"
            >
              <select
                className={`${fieldClass} appearance-none`}
                value={shipping.serviceId}
                onChange={(e) =>
                  setShipping({ ...shipping, serviceId: e.target.value })
                }
              >
                <option value="">Account default</option>
                {services.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Labeled>
          </div>

          <WizardNav onBack={() => goTo(1)} onNext={continueFromShipping} />
        </section>
      )}

      {/* ------------------------------ step 4 ------------------------------ */}
      {step === 3 && (
        <section aria-label="Review">
          <h2 className="mb-1 font-display text-2xl font-medium text-navy">
            Review &amp; submit
          </h2>
          <p className="mb-5 text-[15px] text-navy/55">
            One last look — then it goes straight to the pharmacy.
          </p>

          <div className="grid gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-navy/50">
                  Patient
                </h3>
                <button
                  type="button"
                  onClick={() => goTo(0)}
                  className="text-sm font-semibold text-magenta hover:underline"
                >
                  Edit
                </button>
              </div>
              <p className="mt-2 text-[15px] font-semibold text-navy">
                {selectedPatient
                  ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                  : "—"}
              </p>
              <p className="text-sm text-navy/60">
                DOB {selectedPatient?.dateOfBirth ?? "—"}
              </p>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-navy/50">
                  Medications
                </h3>
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  className="text-sm font-semibold text-magenta hover:underline"
                >
                  Edit
                </button>
              </div>
              <p className="mt-1 text-sm text-navy/60">
                Prescribed by{" "}
                {selectedPrescriber
                  ? `${selectedPrescriber.firstName} ${selectedPrescriber.lastName}`
                  : "—"}
              </p>
              <div className="mt-2 divide-y divide-beige/70">
                {rxs.map((rx, i) => {
                  const product = products.find((p) => p.id === rx.productId);
                  return (
                    <div key={i} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[15px] font-semibold text-navy">
                          {product?.name ?? rx.productId}
                        </p>
                        {product?.priceCents != null && (
                          <span className="text-sm font-semibold tabular-nums text-navy/70">
                            {formatCents(product.priceCents)}
                            {rx.quantity && Number(rx.quantity) > 1
                              ? ` × ${rx.quantity}`
                              : ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-navy/60">{rx.directions}</p>
                      <p className="mt-1 text-xs text-navy/45">
                        {[
                          rx.quantity ? `Qty ${rx.quantity}` : null,
                          rx.daysSupply ? `${rx.daysSupply}-day supply` : null,
                          `${rx.refills || 0} refill${rx.refills === "1" ? "" : "s"}`,
                        ]
                          .filter(Boolean)
                          .join("  ·  ")}
                      </p>
                    </div>
                  );
                })}
              </div>
              {estimatedTotal !== null && (
                <div className="mt-3 flex items-center justify-between border-t border-beige pt-3">
                  <span className="text-sm font-semibold text-navy/60">
                    Estimated total
                  </span>
                  <span className="text-base font-bold tabular-nums text-navy">
                    {formatCents(estimatedTotal)}
                  </span>
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-navy/50">
                  Shipping
                </h3>
                <button
                  type="button"
                  onClick={() => goTo(2)}
                  className="text-sm font-semibold text-magenta hover:underline"
                >
                  Edit
                </button>
              </div>
              <p className="mt-2 text-[15px] font-semibold text-navy">
                {shipping.recipientFirstName} {shipping.recipientLastName}{" "}
                <Badge tone="neutral">{shipping.recipientType}</Badge>
              </p>
              <p className="text-sm text-navy/60">
                {[
                  shipping.addressLine1,
                  shipping.addressLine2,
                  `${shipping.city}, ${shipping.state.toUpperCase()} ${shipping.zipCode}`,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="mt-1 text-sm text-navy/60">
                {services.find((s) => String(s.id) === shipping.serviceId)?.name ??
                  "Account default shipping"}
              </p>
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy/50">
                Billing &amp; notes
              </h3>
              <PillToggle
                ariaLabel="Billing"
                value={payorType}
                options={[
                  ["doc", "Bill my clinic"],
                  ["pat", "Bill the patient"],
                ]}
                onChange={setPayorType}
              />
              <div className="mt-3">
                <Labeled label="Memo for the pharmacy" hint="Optional, max 120 characters.">
                  <input
                    maxLength={120}
                    className={fieldClass}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </Labeled>
              </div>
            </Card>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => goTo(2)}
              className={btnSecondary}
              disabled={busy}
            >
              Back
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-magenta text-[15px] font-semibold text-white transition-all hover:bg-magenta-dark active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Sending to pharmacy…
                </>
              ) : (
                "Submit order"
              )}
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-navy/45">
            Submitting sends this prescription to Logos Pharmacy for fulfillment.
            It&rsquo;s safe to retry if your connection drops — we never create
            duplicates.
          </p>
        </section>
      )}

      <p className="mt-10 text-center">
        <Link
          href="/dashboard/orders"
          className="text-sm font-medium text-navy/45 hover:text-navy"
        >
          Cancel and return to orders
        </Link>
      </p>
    </div>
  );
}
