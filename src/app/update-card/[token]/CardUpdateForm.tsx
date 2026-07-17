"use client";

import { useState } from "react";
import SignaturePad from "@/components/onboarding/SignaturePad";
import {
  ConsentCheckbox,
  NavButtons,
  SelectField,
  StepHeading,
  TextField,
} from "@/components/onboarding/primitives";
import {
  emptyCardUpdateForm,
  validateCardUpdateForm,
  type CardUpdateForm as FormState,
} from "@/lib/payment-links/validate";
import type { PaymentInfo } from "@/lib/onboarding/steps";
import { submitCardUpdate } from "./actions";

/**
 * Public card-update form — the same fields as the onboarding payment step.
 * Rendered for an active, unexpired link; submits once and shows a done state.
 */
export default function CardUpdateForm({
  token,
  clinicName,
}: {
  token: string;
  clinicName: string;
}) {
  const [form, setForm] = useState<FormState>(emptyCardUpdateForm());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function setPayment(patch: Partial<PaymentInfo>) {
    setForm((prev) => ({ ...prev, payment: { ...prev.payment, ...patch } }));
  }

  async function submit() {
    const err = validateCardUpdateForm(form);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await submitCardUpdate(token, form);
      if (res.ok) {
        setDone(true);
      } else {
        setError(res.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
          <svg width="24" height="24" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3.5 9.5L7 13l7.5-8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="font-display text-[28px] font-medium leading-tight text-navy">
          Payment card updated
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-navy/60">
          Thank you — the new card for {clinicName} is securely on file with
          Logos RX. You can close this page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <StepHeading
        title="Update your payment card"
        subtitle={
          <>
            Logos RX has requested updated payment information for{" "}
            <span className="font-semibold text-navy">{clinicName}</span>.
            Enter the full card details below — they are encrypted and replace
            the card currently on file.
          </>
        }
      />
      <div className="flex flex-col gap-3">
        <TextField
          label="Cardholder's name"
          placeholder="Cardholder's Name"
          value={form.payment.cardholderName}
          autoComplete="cc-name"
          onChange={(e) => setPayment({ cardholderName: e.target.value })}
        />
        <TextField
          label="Credit or debit card number"
          placeholder="Credit / Debit Card #"
          inputMode="numeric"
          autoComplete="cc-number"
          value={form.payment.cardNumber}
          onChange={(e) => setPayment({ cardNumber: e.target.value })}
        />
        <SelectField
          label="Card type"
          placeholder="Card Type"
          options={[
            { value: "visa", label: "Visa" },
            { value: "mastercard", label: "Mastercard" },
            { value: "amex", label: "American Express" },
            { value: "discover", label: "Discover" },
          ]}
          value={form.payment.cardType}
          onChange={(e) => setPayment({ cardType: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Expiration date"
            placeholder="MM / YY"
            autoComplete="cc-exp"
            value={form.payment.expiration}
            onChange={(e) => setPayment({ expiration: e.target.value })}
          />
          <TextField
            label="CVV"
            placeholder="CVV"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={form.payment.cvv}
            onChange={(e) => setPayment({ cvv: e.target.value })}
          />
        </div>
        <TextField
          label="Billing address"
          placeholder="Billing Address"
          autoComplete="billing street-address"
          value={form.payment.billingAddress}
          onChange={(e) => setPayment({ billingAddress: e.target.value })}
        />
        <TextField
          label="Billing zip code"
          placeholder="Billing Zip Code"
          inputMode="numeric"
          autoComplete="billing postal-code"
          value={form.payment.billingZip}
          onChange={(e) => setPayment({ billingZip: e.target.value })}
        />
        <ConsentCheckbox
          checked={form.paymentAuthAccepted}
          onChange={(c) =>
            setForm((prev) => ({ ...prev, paymentAuthAccepted: c }))
          }
        >
          I (we) hereby authorize Logos Pharmacy to make charges to my payment
          method. All records are kept in a secure file accessible to
          authorized personnel only. All payments are due upon receipt and
          unpaid balances may lead to late payment penalties and account
          closure.
        </ConsentCheckbox>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Signature
          </p>
          <SignaturePad
            ariaLabel="Payment authorization signature"
            value={form.paymentSignature}
            onChange={(v) =>
              setForm((prev) => ({ ...prev, paymentSignature: v }))
            }
          />
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <NavButtons
        showBack={false}
        onNext={submit}
        nextLabel="Save my new card"
        submit
        loading={busy}
      />
    </div>
  );
}
