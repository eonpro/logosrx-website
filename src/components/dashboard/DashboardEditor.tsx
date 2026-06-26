"use client";

import { useState } from "react";
import VerificationBanner from "@/components/dashboard/VerificationBanner";
import {
  OptionList,
  SelectField,
  TextField,
} from "@/components/onboarding/primitives";
import {
  ORDER_VOLUME_OPTIONS,
  PRACTICE_TYPE_OPTIONS,
  PRODUCT_OPTIONS,
  REFERRAL_OPTIONS,
  SHIPPING_METHOD_OPTIONS,
  SPECIALTY_OPTIONS,
  emptyProvider,
  type OnboardingFormState,
} from "@/lib/onboarding/steps";
import { US_STATE_CODES } from "@/lib/constants";
import type { ClinicProvider } from "@/lib/db/schema";
import type { VerificationStatus } from "@/lib/onboarding/data";
import { updateClinicProfile } from "@/app/onboarding/actions";

const STATE_OPTIONS = US_STATE_CODES.map((s) => ({ value: s, label: s }));

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-beige-dark bg-white p-6">
      <h2 className="mb-4 text-base font-bold text-navy">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default function DashboardEditor({
  initialState,
  cardLast4,
  verificationStatus,
}: {
  initialState: OnboardingFormState;
  cardLast4: string | null;
  verificationStatus: VerificationStatus;
}) {
  const [state, setState] = useState<OnboardingFormState>(initialState);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  function set<K extends keyof OnboardingFormState>(
    key: K,
    value: OnboardingFormState[K],
  ) {
    setState((prev) => ({ ...prev, [key]: value }));
    setStatus("idle");
  }

  function patchProvider(i: number, patch: Partial<ClinicProvider>) {
    setState((prev) => ({
      ...prev,
      providers: prev.providers.map((p, idx) =>
        idx === i ? { ...p, ...patch } : p,
      ),
    }));
    setStatus("idle");
  }

  async function save() {
    setStatus("saving");
    const res = await updateClinicProfile(state);
    if (res.ok) {
      setStatus("saved");
      setMessage("");
    } else {
      setStatus("error");
      setMessage(res.error ?? "Could not save your changes.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-bold text-navy">Your clinic profile</h1>
        <p className="mb-6 text-sm text-navy/60">
          Keep your practice and provider information up to date.
        </p>

        <VerificationBanner status={verificationStatus} />

        <div className="flex flex-col gap-5">
          <Section title="Products &amp; Volume">
            <p className="text-xs font-medium text-navy/60">
              Products of interest
            </p>
            <OptionList
              multiple
              options={PRODUCT_OPTIONS}
              selected={state.productsOfInterest}
              onToggle={(v) =>
                set(
                  "productsOfInterest",
                  state.productsOfInterest.includes(v)
                    ? state.productsOfInterest.filter((x) => x !== v)
                    : [...state.productsOfInterest, v],
                )
              }
            />
            <SelectField
              label="Order volume"
              placeholder="Current order volume"
              options={ORDER_VOLUME_OPTIONS}
              value={state.orderVolume}
              onChange={(e) => set("orderVolume", e.target.value)}
            />
            <SelectField
              label="Referral source"
              placeholder="How did you hear about us?"
              options={REFERRAL_OPTIONS}
              value={state.referralSource}
              onChange={(e) => set("referralSource", e.target.value)}
            />
          </Section>

          <Section title="Practice Information">
            <TextField
              label="Clinic or provider name"
              placeholder="Clinic / Provider Name"
              value={state.clinicName}
              onChange={(e) => set("clinicName", e.target.value)}
            />
            <TextField
              label="Practice legal name"
              placeholder="Practice Legal Name"
              value={state.practiceLegalName}
              onChange={(e) => set("practiceLegalName", e.target.value)}
            />
            <TextField
              label="Practice d/b/a"
              placeholder="Practice d/b/a (if any)"
              value={state.practiceDba}
              onChange={(e) => set("practiceDba", e.target.value)}
            />
            <TextField
              label="EIN number"
              placeholder="EIN Number"
              value={state.ein}
              onChange={(e) => set("ein", e.target.value)}
            />
            <SelectField
              label="Practice type"
              placeholder="Practice Type"
              options={PRACTICE_TYPE_OPTIONS}
              value={state.practiceType}
              onChange={(e) => set("practiceType", e.target.value)}
            />
            <TextField
              label="Practice address"
              placeholder="Practice address"
              value={state.addressLine1}
              onChange={(e) => set("addressLine1", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Suite / unit"
                placeholder="Suite / Unit #"
                value={state.addressSuite}
                onChange={(e) => set("addressSuite", e.target.value)}
              />
              <TextField
                label="Practice phone"
                placeholder="Phone"
                value={state.practicePhone}
                onChange={(e) => set("practicePhone", e.target.value)}
              />
            </div>
            <TextField
              label="Website"
              placeholder="Website"
              value={state.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </Section>

          <Section title="Primary Point of Contact">
            <TextField
              label="Contact name"
              placeholder="Contact Name"
              value={state.contactName}
              onChange={(e) => set("contactName", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Contact phone"
                placeholder="Phone"
                value={state.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
              />
              <TextField
                label="Contact email"
                type="email"
                placeholder="Email"
                value={state.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </div>
          </Section>

          <Section title="Providers">
            {state.providers.map((p, i) => (
              <div
                key={i}
                className="rounded-xl border border-beige-dark p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy">
                    Provider {i + 1}
                  </h3>
                  {state.providers.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "providers",
                          state.providers.filter((_, idx) => idx !== i),
                        )
                      }
                      className="text-xs font-medium text-navy/40 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <TextField
                      label="First name"
                      placeholder="First Name"
                      value={p.firstName}
                      onChange={(e) =>
                        patchProvider(i, { firstName: e.target.value })
                      }
                    />
                    <TextField
                      label="Last name"
                      placeholder="Last Name"
                      value={p.lastName}
                      onChange={(e) =>
                        patchProvider(i, { lastName: e.target.value })
                      }
                    />
                  </div>
                  <SelectField
                    label="Specialty"
                    placeholder="Medical Specialty"
                    options={SPECIALTY_OPTIONS}
                    value={p.specialty}
                    onChange={(e) =>
                      patchProvider(i, { specialty: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <TextField
                      label="NPI"
                      placeholder="NPI #"
                      value={p.npi}
                      onChange={(e) => patchProvider(i, { npi: e.target.value })}
                    />
                    <TextField
                      label="Medical license"
                      placeholder="Medical License #"
                      value={p.medicalLicense}
                      onChange={(e) =>
                        patchProvider(i, { medicalLicense: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField
                      label="License state"
                      placeholder="License State"
                      options={STATE_OPTIONS}
                      value={p.licenseState}
                      onChange={(e) =>
                        patchProvider(i, { licenseState: e.target.value })
                      }
                    />
                    <TextField
                      label="DEA"
                      placeholder="DEA #"
                      value={p.dea}
                      onChange={(e) => patchProvider(i, { dea: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                set("providers", [...state.providers, emptyProvider()])
              }
              className="rounded-xl border border-dashed border-navy/25 py-3 text-sm font-medium text-navy/60 hover:border-magenta hover:text-magenta"
            >
              + Add another provider
            </button>
          </Section>

          <Section title="Shipping Preferences">
            <p className="text-xs font-medium text-navy/60">Shipping method</p>
            <OptionList
              options={SHIPPING_METHOD_OPTIONS}
              selected={state.shippingMethod ? [state.shippingMethod] : []}
              onToggle={(v) => set("shippingMethod", v)}
            />
            <p className="mt-2 text-xs font-medium text-navy/60">
              Signature on delivery
            </p>
            <OptionList
              options={[
                { value: "yes", label: "Require a signature ($7 / shipment)" },
                { value: "no", label: "Do not require signature" },
              ]}
              selected={
                state.signatureRequired === null
                  ? []
                  : [state.signatureRequired ? "yes" : "no"]
              }
              onToggle={(v) => set("signatureRequired", v === "yes")}
            />
          </Section>

          <Section title="Payment Method">
            {cardLast4 ? (
              <p className="text-sm text-navy/70">
                Card on file ending in{" "}
                <span className="font-semibold text-navy">{cardLast4}</span>.
                Enter a new card below to replace it.
              </p>
            ) : (
              <p className="text-sm text-navy/70">No card on file.</p>
            )}
            <TextField
              label="Cardholder name"
              placeholder="Cardholder's Name"
              value={state.payment.cardholderName}
              onChange={(e) =>
                set("payment", {
                  ...state.payment,
                  cardholderName: e.target.value,
                })
              }
            />
            <TextField
              label="New card number"
              placeholder="New Card # (leave blank to keep current)"
              inputMode="numeric"
              value={state.payment.cardNumber}
              onChange={(e) =>
                set("payment", { ...state.payment, cardNumber: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Expiration"
                placeholder="MM / YY"
                value={state.payment.expiration}
                onChange={(e) =>
                  set("payment", {
                    ...state.payment,
                    expiration: e.target.value,
                  })
                }
              />
              <TextField
                label="CVV"
                placeholder="CVV"
                inputMode="numeric"
                value={state.payment.cvv}
                onChange={(e) =>
                  set("payment", { ...state.payment, cvv: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Billing address"
                placeholder="Billing Address"
                value={state.payment.billingAddress}
                onChange={(e) =>
                  set("payment", {
                    ...state.payment,
                    billingAddress: e.target.value,
                  })
                }
              />
              <TextField
                label="Billing zip"
                placeholder="Billing Zip"
                value={state.payment.billingZip}
                onChange={(e) =>
                  set("payment", {
                    ...state.payment,
                    billingZip: e.target.value,
                  })
                }
              />
            </div>
          </Section>

          {status === "error" && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
            >
              {message}
            </p>
          )}

          <div className="sticky bottom-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={status === "saving"}
              className="flex-1 rounded-xl bg-magenta py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-magenta-dark disabled:opacity-60"
            >
              {status === "saving"
                ? "Saving..."
                : status === "saved"
                  ? "Saved"
                  : "Save changes"}
            </button>
          </div>
        </div>
    </main>
  );
}
