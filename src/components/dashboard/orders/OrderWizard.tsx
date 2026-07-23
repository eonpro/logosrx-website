"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createPatientAction,
  submitOrderAction,
} from "@/app/dashboard/orders/actions";
import { fieldClass, SelectField, TextField } from "@/components/onboarding/primitives";
import { Badge, Card, btnSecondary } from "@/components/ui/portal";
import { formatCents } from "@/lib/portal/pricing";
import type { OrderableProduct } from "@/lib/orders/products";
import type { LifeFileShippingService } from "@/lib/lifefile/constants";
import type { Patient, ClinicProvider } from "@/lib/db/schema";

/**
 * The "New prescription" wizard: Patient -> Prescriber & medications ->
 * Shipping -> Review. Client state only; the single source of truth for
 * validation and isolation is the server pipeline (`submitClinicOrder`).
 * Errors render as inline banners per portal convention.
 */

const STEPS = ["Patient", "Medications", "Shipping", "Review"] as const;

interface RxDraft {
  productId: string;
  directions: string;
  quantity: string;
  daysSupply: string;
  refills: string;
}

interface PatientDraft {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phoneMobile: string;
  email: string;
  allergies: string;
  conditions: string;
}

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

export default function OrderWizard({
  patients: initialPatients,
  providers,
  products,
  services,
  defaultServiceId,
  preselectedProductId,
}: {
  patients: Patient[];
  providers: ClinicProvider[];
  products: OrderableProduct[];
  services: LifeFileShippingService[];
  defaultServiceId: number | null;
  preselectedProductId: string | null;
}) {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);
  const submissionKey = useRef(newSubmissionKey());

  const orderable = useMemo(
    () => products.filter((p) => p.orderable),
    [products],
  );

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Step 1 — patient
  const [patients, setPatients] = useState(initialPatients);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [showNewPatient, setShowNewPatient] = useState(
    initialPatients.length === 0,
  );
  const [patientDraft, setPatientDraft] = useState<PatientDraft>(EMPTY_PATIENT);

  // Step 2 — prescriber + medications
  const [prescriberNpi, setPrescriberNpi] = useState(
    providers.length === 1 ? providers[0].npi : "",
  );
  const [productQuery, setProductQuery] = useState("");
  const [rxs, setRxs] = useState<RxDraft[]>(() => {
    const pre =
      preselectedProductId &&
      orderableIds(products).has(preselectedProductId)
        ? preselectedProductId
        : null;
    return pre
      ? [
          {
            productId: pre,
            directions: "",
            quantity:
              products.find((p) => p.id === pre)?.defaultQuantity ?? "",
            daysSupply: "",
            refills: "0",
          },
        ]
      : [];
  });

  // Step 3 — shipping
  const [shipping, setShipping] = useState({
    recipientType: "patient" as "patient" | "clinic",
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
  const [payorType, setPayorType] = useState<"doc" | "pat">("doc");
  const [memo, setMemo] = useState("");

  const selectedPatient = patients.find((p) => p.id === patientId) ?? null;
  const selectedPrescriber =
    providers.find((p) => p.npi === prescriberNpi) ?? null;

  function showError(message: string) {
    setError(message);
    requestAnimationFrame(() =>
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }

  function next() {
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  // --- Step 1 handlers ---

  async function saveNewPatient() {
    setBusy(true);
    setError(null);
    const result = await createPatientAction({
      ...patientDraft,
      allergies: splitList(patientDraft.allergies),
      conditions: splitList(patientDraft.conditions),
    });
    setBusy(false);
    if (!result.ok) {
      showError(result.error);
      return;
    }
    setPatients((prev) => [...prev, result.patient]);
    setPatientId(result.patient.id);
    setShowNewPatient(false);
    setPatientDraft(EMPTY_PATIENT);
  }

  function continueFromPatient() {
    if (!patientId) {
      showError("Select a patient or add a new one.");
      return;
    }
    next();
  }

  // --- Step 2 handlers ---

  function addRx(productId: string) {
    const product = products.find((p) => p.id === productId);
    setRxs((prev) => [
      ...prev,
      {
        productId,
        directions: "",
        quantity: product?.defaultQuantity ?? "",
        daysSupply: "",
        refills: "0",
      },
    ]);
    setProductQuery("");
  }

  function updateRx(index: number, patch: Partial<RxDraft>) {
    setRxs((prev) =>
      prev.map((rx, i) => (i === index ? { ...rx, ...patch } : rx)),
    );
  }

  function removeRx(index: number) {
    setRxs((prev) => prev.filter((_, i) => i !== index));
  }

  function continueFromMeds() {
    if (!prescriberNpi) {
      showError("Select the prescribing provider.");
      return;
    }
    if (rxs.length === 0) {
      showError("Add at least one medication.");
      return;
    }
    for (const [i, rx] of rxs.entries()) {
      if (rx.directions.trim().length < 3) {
        const name = products.find((p) => p.id === rx.productId)?.name;
        showError(`Add directions (sig) for ${name ?? `medication ${i + 1}`}.`);
        return;
      }
    }
    // Prefill shipping from the patient the first time we reach step 3.
    if (selectedPatient && !shipping.recipientFirstName) {
      setShipping((s) => ({
        ...s,
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
    }
    next();
  }

  // --- Step 3 handlers ---

  function continueFromShipping() {
    const required: [string, string][] = [
      [shipping.recipientFirstName, "recipient first name"],
      [shipping.recipientLastName, "recipient last name"],
      [shipping.addressLine1, "address"],
      [shipping.city, "city"],
      [shipping.state, "state"],
      [shipping.zipCode, "ZIP code"],
    ];
    for (const [value, label] of required) {
      if (!value.trim()) {
        showError(`Enter the ${label}.`);
        return;
      }
    }
    next();
  }

  // --- Submit ---

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await submitOrderAction({
      patientId,
      prescriberNpi,
      payorType,
      memo: memo || undefined,
      shipping: {
        ...shipping,
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
      showError(result.error);
      return;
    }
    router.push(`/dashboard/orders/${result.orderId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicator */}
      <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={`h-1 rounded-full ${
                i <= step ? "bg-plum" : "bg-beige"
              }`}
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

      {error && (
        <div
          ref={errorRef}
          role="alert"
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {step === 0 && (
        <section aria-label="Patient">
          <h2 className="mb-4 font-display text-2xl font-medium text-navy">
            Who is this prescription for?
          </h2>

          {patients.length > 0 && !showNewPatient && (
            <div className="flex flex-col gap-3">
              {patients.map((p) => {
                const selected = p.id === patientId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPatientId(p.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all ${
                      selected
                        ? "border-plum bg-plum/[0.04] shadow-soft"
                        : "border-beige bg-white hover:border-navy/30"
                    }`}
                  >
                    <span>
                      <span className="block text-[15px] font-semibold text-navy">
                        {p.firstName} {p.lastName}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-navy/50">
                        DOB {p.dateOfBirth}
                        {p.city ? ` · ${p.city}, ${p.state ?? ""}` : ""}
                      </span>
                    </span>
                    <span
                      className={`ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected
                          ? "border-plum bg-plum text-white"
                          : "border-navy/20 bg-white"
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
              })}
              <button
                type="button"
                onClick={() => setShowNewPatient(true)}
                className="rounded-2xl border-2 border-dashed border-beige-dark bg-white px-5 py-4 text-left text-[15px] font-semibold text-navy/60 transition-all hover:border-navy/40 hover:text-navy"
              >
                + Add a new patient
              </button>
            </div>
          )}

          {showNewPatient && (
            <Card>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="First name"
                  placeholder="First name *"
                  value={patientDraft.firstName}
                  onChange={(e) =>
                    setPatientDraft({ ...patientDraft, firstName: e.target.value })
                  }
                />
                <TextField
                  label="Last name"
                  placeholder="Last name *"
                  value={patientDraft.lastName}
                  onChange={(e) =>
                    setPatientDraft({ ...patientDraft, lastName: e.target.value })
                  }
                />
                <SelectField
                  label="Sex"
                  placeholder="Sex *"
                  value={patientDraft.gender}
                  options={[
                    { value: "m", label: "Male" },
                    { value: "f", label: "Female" },
                    { value: "u", label: "Unspecified" },
                  ]}
                  onChange={(e) =>
                    setPatientDraft({ ...patientDraft, gender: e.target.value })
                  }
                />
                <TextField
                  label="Date of birth"
                  type="date"
                  placeholder="Date of birth *"
                  value={patientDraft.dateOfBirth}
                  onChange={(e) =>
                    setPatientDraft({ ...patientDraft, dateOfBirth: e.target.value })
                  }
                />
                <TextField
                  label="Mobile phone"
                  placeholder="Mobile phone"
                  value={patientDraft.phoneMobile}
                  onChange={(e) =>
                    setPatientDraft({ ...patientDraft, phoneMobile: e.target.value })
                  }
                />
                <TextField
                  label="Email"
                  type="email"
                  placeholder="Email"
                  value={patientDraft.email}
                  onChange={(e) =>
                    setPatientDraft({ ...patientDraft, email: e.target.value })
                  }
                />
                <div className="sm:col-span-2">
                  <TextField
                    label="Street address"
                    placeholder="Street address"
                    value={patientDraft.address1}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, address1: e.target.value })
                    }
                  />
                </div>
                <TextField
                  label="City"
                  placeholder="City"
                  value={patientDraft.city}
                  onChange={(e) =>
                    setPatientDraft({ ...patientDraft, city: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="State"
                    placeholder="State"
                    maxLength={2}
                    value={patientDraft.state}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, state: e.target.value })
                    }
                  />
                  <TextField
                    label="ZIP"
                    placeholder="ZIP"
                    value={patientDraft.zip}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, zip: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextField
                    label="Allergies"
                    placeholder="Allergies (comma-separated, e.g. penicillin, sulfa)"
                    value={patientDraft.allergies}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, allergies: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextField
                    label="Conditions"
                    placeholder="Conditions (comma-separated, e.g. type 2 diabetes)"
                    value={patientDraft.conditions}
                    onChange={(e) =>
                      setPatientDraft({ ...patientDraft, conditions: e.target.value })
                    }
                  />
                </div>
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
                    onClick={() => setShowNewPatient(false)}
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

      {step === 1 && (
        <section aria-label="Medications">
          <h2 className="mb-4 font-display text-2xl font-medium text-navy">
            Prescriber &amp; medications
          </h2>

          <div className="mb-6">
            <p className="mb-2 text-[13px] font-semibold text-navy/60">
              Prescribing provider
            </p>
            <SelectField
              label="Prescribing provider"
              placeholder="Select provider *"
              value={prescriberNpi}
              options={providers.map((p) => ({
                value: p.npi,
                label: `${p.firstName} ${p.lastName} — NPI ${p.npi}`,
              }))}
              onChange={(e) => setPrescriberNpi(e.target.value)}
            />
          </div>

          {rxs.map((rx, i) => {
            const product = products.find((p) => p.id === rx.productId);
            return (
              <Card key={`${rx.productId}-${i}`} className="mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-navy">
                      {product?.name ?? rx.productId}
                    </p>
                    <p className="mt-0.5 text-xs text-navy/55">
                      {[product?.strength, product?.form]
                        .filter(Boolean)
                        .join(" · ")}
                      {product?.priceCents != null &&
                        ` · ${formatCents(product.priceCents)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRx(i)}
                    aria-label={`Remove ${product?.name ?? "medication"}`}
                    className="text-sm font-semibold text-navy/40 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-4 grid gap-3">
                  <textarea
                    aria-label="Directions (sig)"
                    placeholder="Directions / sig — e.g. Inject 10 units (0.10 mL) subcutaneously once weekly *"
                    rows={2}
                    className={fieldClass}
                    value={rx.directions}
                    onChange={(e) => updateRx(i, { directions: e.target.value })}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <TextField
                      label="Quantity"
                      placeholder={`Qty${product?.quantityUnits ? ` (${product.quantityUnits})` : ""}`}
                      value={rx.quantity}
                      onChange={(e) => updateRx(i, { quantity: e.target.value })}
                    />
                    <TextField
                      label="Days supply"
                      type="number"
                      min={1}
                      placeholder="Days supply"
                      value={rx.daysSupply}
                      onChange={(e) => updateRx(i, { daysSupply: e.target.value })}
                    />
                    <TextField
                      label="Refills"
                      type="number"
                      min={0}
                      max={11}
                      placeholder="Refills"
                      value={rx.refills}
                      onChange={(e) => updateRx(i, { refills: e.target.value })}
                    />
                  </div>
                </div>
              </Card>
            );
          })}

          <div className="mb-2">
            <p className="mb-2 text-[13px] font-semibold text-navy/60">
              Add a medication
            </p>
            <input
              type="search"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Search the catalog…"
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
                .slice(0, 30)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addRx(p.id)}
                    className="flex w-full items-center justify-between border-b border-beige/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-cream/60"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-navy">
                        {p.name}
                      </span>
                      <span className="block text-xs text-navy/50">
                        {[p.strength, p.form].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-navy/70">
                      {formatCents(p.priceCents)}
                    </span>
                  </button>
                ))}
              {orderable.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-navy/50">
                  No medications are enabled for online ordering yet.
                </p>
              )}
            </div>
          </div>

          <WizardNav onBack={back} onNext={continueFromMeds} />
        </section>
      )}

      {step === 2 && (
        <section aria-label="Shipping">
          <h2 className="mb-4 font-display text-2xl font-medium text-navy">
            Shipping
          </h2>

          <div className="mb-5 flex gap-2" role="radiogroup" aria-label="Ship to">
            {(
              [
                ["patient", "Ship to patient"],
                ["clinic", "Ship to clinic"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={shipping.recipientType === value}
                onClick={() =>
                  setShipping((s) => ({ ...s, recipientType: value }))
                }
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                  shipping.recipientType === value
                    ? "bg-plum text-white shadow-soft"
                    : "border border-beige bg-white text-navy/60 hover:border-navy/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Recipient first name"
              placeholder="Recipient first name *"
              value={shipping.recipientFirstName}
              onChange={(e) =>
                setShipping({ ...shipping, recipientFirstName: e.target.value })
              }
            />
            <TextField
              label="Recipient last name"
              placeholder="Recipient last name *"
              value={shipping.recipientLastName}
              onChange={(e) =>
                setShipping({ ...shipping, recipientLastName: e.target.value })
              }
            />
            <TextField
              label="Phone"
              placeholder="Phone"
              value={shipping.recipientPhone}
              onChange={(e) =>
                setShipping({ ...shipping, recipientPhone: e.target.value })
              }
            />
            <TextField
              label="Email"
              type="email"
              placeholder="Email"
              value={shipping.recipientEmail}
              onChange={(e) =>
                setShipping({ ...shipping, recipientEmail: e.target.value })
              }
            />
            <div className="sm:col-span-2">
              <TextField
                label="Street address"
                placeholder="Street address *"
                value={shipping.addressLine1}
                onChange={(e) =>
                  setShipping({ ...shipping, addressLine1: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <TextField
                label="Suite / unit"
                placeholder="Suite / unit"
                value={shipping.addressLine2}
                onChange={(e) =>
                  setShipping({ ...shipping, addressLine2: e.target.value })
                }
              />
            </div>
            <TextField
              label="City"
              placeholder="City *"
              value={shipping.city}
              onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="State"
                placeholder="State *"
                maxLength={2}
                value={shipping.state}
                onChange={(e) =>
                  setShipping({ ...shipping, state: e.target.value })
                }
              />
              <TextField
                label="ZIP"
                placeholder="ZIP *"
                value={shipping.zipCode}
                onChange={(e) =>
                  setShipping({ ...shipping, zipCode: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <SelectField
                label="Shipping method"
                placeholder="Shipping method (account default)"
                value={shipping.serviceId}
                options={services.map((s) => ({
                  value: String(s.id),
                  label: s.name,
                }))}
                onChange={(e) =>
                  setShipping({ ...shipping, serviceId: e.target.value })
                }
              />
            </div>
          </div>

          <WizardNav onBack={back} onNext={continueFromShipping} />
        </section>
      )}

      {step === 3 && (
        <section aria-label="Review">
          <h2 className="mb-4 font-display text-2xl font-medium text-navy">
            Review &amp; submit
          </h2>

          <div className="grid gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-navy/50">
                  Patient
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(0)}
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
                  onClick={() => setStep(1)}
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
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-navy/60">
                        {rx.directions}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-navy/50">
                  Shipping
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(2)}
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
                  `${shipping.city}, ${shipping.state} ${shipping.zipCode}`,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="mt-1 text-sm text-navy/60">
                {services.find((s) => String(s.id) === shipping.serviceId)
                  ?.name ?? "Account default shipping"}
              </p>
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy/50">
                Billing &amp; notes
              </h3>
              <div className="mb-3 flex gap-2" role="radiogroup" aria-label="Billing">
                {(
                  [
                    ["doc", "Bill my clinic"],
                    ["pat", "Bill the patient"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={payorType === value}
                    onClick={() => setPayorType(value)}
                    className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                      payorType === value
                        ? "bg-plum text-white shadow-soft"
                        : "border border-beige bg-white text-navy/60 hover:border-navy/30"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <TextField
                label="Memo"
                placeholder="Memo for the pharmacy (optional)"
                maxLength={120}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </Card>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={back}
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
              {busy ? "Sending to pharmacy…" : "Submit order"}
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-navy/45">
            Submitting sends this prescription to Logos Pharmacy for
            fulfillment.
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

function WizardNav({
  onBack,
  onNext,
  showBack = true,
}: {
  onBack?: () => void;
  onNext: () => void;
  showBack?: boolean;
}) {
  return (
    <div className="mt-8 flex items-center gap-3">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-beige-dark bg-white text-navy transition-all hover:border-navy/40 active:scale-95"
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
        className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-plum text-[15px] font-semibold text-white transition-all hover:bg-plum-deep active:scale-[0.99]"
      >
        Continue
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

function orderableIds(products: OrderableProduct[]): Set<string> {
  return new Set(products.filter((p) => p.orderable).map((p) => p.id));
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
