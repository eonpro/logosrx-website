"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSignIn } from "@clerk/nextjs/legacy";
import { AnimatePresence, motion } from "framer-motion";
import OnboardingShell from "./OnboardingShell";
import SignaturePad from "./SignaturePad";
import {
  ConsentCheckbox,
  DisclosureBox,
  NavButtons,
  OptionList,
  SelectField,
  StepHeading,
  TextField,
} from "./primitives";
import {
  ORDER_VOLUME_OPTIONS,
  PRACTICE_TYPE_OPTIONS,
  PRODUCT_OPTIONS,
  REFERRAL_OPTIONS,
  SHIPPING_METHOD_OPTIONS,
  SPECIALTY_OPTIONS,
  STEP_IDS,
  emptyProvider,
  initialFormState,
  validateStep,
  type OnboardingFormState,
  type StepId,
} from "@/lib/onboarding/steps";
import { STATES_SERVED } from "@/lib/constants";
import type { ClinicProvider } from "@/lib/db/schema";
import {
  completeOnboarding,
  createAccountAndComplete,
  saveProgress,
} from "@/app/onboarding/actions";

const STATE_OPTIONS = STATES_SERVED.map((s) => ({ value: s, label: s }));

const MIN_PASSWORD_LENGTH = 8;

export type OnboardingMode = "signup" | "authenticated";

export default function OnboardingWizard({
  mode = "authenticated",
  initialState,
  initialStep,
}: {
  /**
   * "signup" (anonymous): the final submit creates the Clerk account from the
   * intake and signs the clinic in. "authenticated": an already signed-in user
   * is finishing or editing their intake (autosave + completeOnboarding).
   */
  mode?: OnboardingMode;
  initialState?: OnboardingFormState;
  initialStep?: number;
}) {
  const router = useRouter();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const [state, setState] = useState<OnboardingFormState>(
    initialState ?? initialFormState(),
  );
  const [index, setIndex] = useState(
    Math.min(initialStep ?? 0, STEP_IDS.length - 1),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Credentials live only in component state for signup mode; never persisted
  // to the clinic profile (Clerk owns them).
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const stateRef = useRef(state);
  stateRef.current = state;
  const passwordRef = useRef(password);
  passwordRef.current = password;
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Surface errors that would otherwise render below the fold (e.g. at the
  // bottom of the long agreement step) so the user actually sees why submit
  // didn't proceed.
  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  const stepId = STEP_IDS[index];
  const progress = ((index + 1) / STEP_IDS.length) * 100;

  function set<K extends keyof OnboardingFormState>(
    key: K,
    value: OnboardingFormState[K],
  ) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function patchProvider(i: number, patch: Partial<ClinicProvider>) {
    setState((prev) => {
      const providers = prev.providers.map((p, idx) =>
        idx === i ? { ...p, ...patch } : p,
      );
      return { ...prev, providers };
    });
  }

  function goTo(nextIndex: number) {
    setError("");
    setIndex(Math.max(0, Math.min(nextIndex, STEP_IDS.length - 1)));
  }

  async function advance() {
    const err = validateStep(stepId, stateRef.current);
    if (err) {
      setError(err);
      return;
    }

    // Signup mode collects login credentials alongside the contact email.
    if (stepId === "contact" && mode === "signup") {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }
      if (password !== passwordConfirm) {
        setError("Passwords do not match.");
        return;
      }
    }

    // Final step -> submit and route to the dashboard.
    if (stepId === "providerAgreement") {
      setBusy(true);
      try {
        const ok =
          mode === "signup"
            ? await submitSignup()
            : await submitAuthenticated();
        if (ok) {
          router.push("/dashboard");
          router.refresh();
        }
      } catch {
        // Never leave the button stuck spinning on an unexpected failure.
        setError(
          "Something went wrong creating your account. Please try again, or contact us if it keeps happening.",
        );
      } finally {
        setBusy(false);
      }
      return;
    }

    const nextIndex = index + 1;
    goTo(nextIndex);
    // Authenticated users autosave progress; anonymous signup keeps everything
    // client-side until the account is created on submit.
    if (mode === "authenticated") {
      void saveProgress(stateRef.current, nextIndex);
    }
  }

  /** Existing signed-in user finishing intake. */
  async function submitAuthenticated(): Promise<boolean> {
    const res = await completeOnboarding(stateRef.current);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return false;
    }
    return true;
  }

  /**
   * Anonymous signup: create the account + profile, then establish the session
   * with the returned one-time ticket. Falls back to /sign-in if the ticket is
   * unavailable (account still exists).
   */
  async function submitSignup(): Promise<boolean> {
    const res = await createAccountAndComplete(
      stateRef.current,
      passwordRef.current,
    );
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return false;
    }

    if (res.ticket && signInLoaded && signIn && setActive) {
      try {
        const attempt = await signIn.create({
          strategy: "ticket",
          ticket: res.ticket,
        });
        if (attempt.status === "complete" && attempt.createdSessionId) {
          await setActive({ session: attempt.createdSessionId });
          return true;
        }
      } catch {
        // Fall through to the sign-in fallback below.
      }
    }

    // Account exists but we couldn't auto-sign-in: send them to sign in.
    const email = encodeURIComponent(stateRef.current.contactEmail.trim());
    router.push(`/sign-in?redirect_url=/dashboard&email=${email}`);
    return false;
  }

  // The transitional "saving" screen auto-advances.
  useEffect(() => {
    if (stepId !== "saving") return;
    const t = setTimeout(() => goTo(index + 1), 2200);
    return () => clearTimeout(t);
  }, [stepId, index]);

  return (
    <OnboardingShell progress={progress}>
      <AnimatePresence mode="wait">
        <motion.div
          key={stepId}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
        >
          {renderStep(stepId)}
          {error && stepId !== "saving" && (
            <p
              ref={errorRef}
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </OnboardingShell>
  );

  function renderStep(id: StepId) {
    switch (id) {
      case "welcome":
        return (
          <div>
            <StepHeading
              title="Practice / Provider Account Set Up"
              subtitle="Welcome to your account setup. To activate your access, please provide accurate information for your medical practice or provider profile. This information is used to verify credentials, establish secure access to the Logos RX platform, and ensure compliance with state and federal healthcare regulations."
            />
            <NavButtons
              showBack={false}
              onNext={advance}
              nextLabel="Let's get started"
            />
          </div>
        );

      case "products":
        return (
          <div>
            <StepHeading title="Which products are you most interested in?" subtitle="Select all that apply." />
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
            <NavButtons onBack={() => goTo(index - 1)} onNext={advance} />
          </div>
        );

      case "volume":
        return (
          <div>
            <StepHeading title="What is your current volume in pharmacy orders?" />
            <OptionList
              options={ORDER_VOLUME_OPTIONS}
              selected={state.orderVolume ? [state.orderVolume] : []}
              onToggle={(v) => set("orderVolume", v)}
            />
            <NavButtons onBack={() => goTo(index - 1)} onNext={advance} />
          </div>
        );

      case "referral":
        return (
          <div>
            <StepHeading title="How did you hear about us?" />
            <OptionList
              options={REFERRAL_OPTIONS}
              selected={state.referralSource ? [state.referralSource] : []}
              onToggle={(v) => set("referralSource", v)}
            />
            <NavButtons onBack={() => goTo(index - 1)} onNext={advance} />
          </div>
        );

      case "clinicName":
        return (
          <div>
            <StepHeading title="What is your clinic or medical provider's name?" />
            <TextField
              label="Provider's name"
              placeholder="Provider's Name"
              value={state.clinicName}
              autoComplete="organization"
              onChange={(e) => set("clinicName", e.target.value)}
            />
            <NavButtons onBack={() => goTo(index - 1)} onNext={advance} />
          </div>
        );

      case "practice":
        return (
          <div>
            <StepHeading title="Practice Information" />
            <div className="flex flex-col gap-3">
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
                inputMode="numeric"
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
            </div>
            <h2 className="mb-3 mt-7 text-lg font-bold text-navy">
              Practice Location
            </h2>
            <div className="flex flex-col gap-3">
              <TextField
                label="Practice address"
                placeholder="Type your practice's address"
                value={state.addressLine1}
                autoComplete="street-address"
                onChange={(e) => set("addressLine1", e.target.value)}
              />
              <TextField
                label="Suite or unit"
                placeholder="Suite / Unit #"
                value={state.addressSuite}
                onChange={(e) => set("addressSuite", e.target.value)}
              />
              <TextField
                label="Practice phone"
                type="tel"
                placeholder="+1 000 000 0000"
                value={state.practicePhone}
                autoComplete="tel"
                onChange={(e) => set("practicePhone", e.target.value)}
              />
              <TextField
                label="Website"
                placeholder="Website"
                value={state.website}
                autoComplete="url"
                onChange={(e) => set("website", e.target.value)}
              />
            </div>
            <NavButtons onBack={() => goTo(index - 1)} onNext={advance} />
          </div>
        );

      case "certifications":
        return (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <Image
                src="/images/certifications/nabp.svg"
                alt="NABP"
                width={120}
                height={48}
                className="h-12 w-auto"
              />
              <span className="rounded-md border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy/70">
                LegitScript Certified
              </span>
            </div>
            <StepHeading
              title="Logos RX is LegitScript and NABP certified!"
              subtitle="Ensuring full compliance with the most rigorous pharmacy standards, vendor requirements, and safety protocols in the industry."
            />
            <NavButtons onBack={() => goTo(index - 1)} onNext={advance} />
          </div>
        );

      case "contact":
        return (
          <div>
            <StepHeading
              title={
                <>
                  Who is{" "}
                  <span className="text-magenta">
                    {state.clinicName.trim() || "your practice"}
                  </span>
                  &rsquo;s primary point of contact?
                </>
              }
            />
            <div className="flex flex-col gap-3">
              <TextField
                label="Practice representative's name"
                placeholder="Practice Representative's Name"
                value={state.contactName}
                autoComplete="name"
                onChange={(e) => set("contactName", e.target.value)}
              />
              <TextField
                label="Contact phone"
                type="tel"
                placeholder="+1 000 000 0000"
                value={state.contactPhone}
                autoComplete="tel"
                onChange={(e) => set("contactPhone", e.target.value)}
              />
              <TextField
                label="Contact email"
                type="email"
                placeholder="Email"
                value={state.contactEmail}
                autoComplete="email"
                onChange={(e) => set("contactEmail", e.target.value)}
              />
              {mode === "signup" && (
                <>
                  <p className="-mb-1 mt-1 text-xs text-navy/55">
                    This email and password will be your login for the Logos RX
                    provider portal.
                  </p>
                  <TextField
                    label="Create password"
                    type="password"
                    placeholder="Create a password (min. 8 characters)"
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <TextField
                    label="Confirm password"
                    type="password"
                    placeholder="Confirm password"
                    value={passwordConfirm}
                    autoComplete="new-password"
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                  />
                </>
              )}
              <ConsentCheckbox
                checked={state.privacyAccepted}
                onChange={(c) => set("privacyAccepted", c)}
              >
                I accept the{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-magenta underline"
                >
                  Privacy Policy
                </a>{" "}
                and authorize receiving important communications by email and
                text messages (SMS) from Logos RX about my account.
              </ConsentCheckbox>
            </div>
            <NavButtons onBack={() => goTo(index - 1)} onNext={advance} />
          </div>
        );

      case "providers":
        return (
          <div>
            <StepHeading title="Provider &amp; Credential Information" subtitle="Add each licensed provider in your practice." />
            <div className="flex flex-col gap-6">
              {state.providers.map((p, i) => (
                <ProviderCard
                  key={i}
                  index={i}
                  provider={p}
                  canRemove={state.providers.length > 1}
                  onChange={(patch) => patchProvider(i, patch)}
                  onRemove={() =>
                    set(
                      "providers",
                      state.providers.filter((_, idx) => idx !== i),
                    )
                  }
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                set("providers", [...state.providers, emptyProvider()])
              }
              className="mt-4 w-full rounded-xl border border-dashed border-navy/25 py-3 text-sm font-medium text-navy/60 hover:border-magenta hover:text-magenta"
            >
              + Add another licensed provider
            </button>
            <NavButtons onBack={() => goTo(index - 1)} onNext={advance} />
          </div>
        );

      case "payment":
        return (
          <div>
            <StepHeading title="Payment Information" />
            <div className="flex flex-col gap-3">
              <TextField
                label="Cardholder's name"
                placeholder="Cardholder's Name"
                value={state.payment.cardholderName}
                autoComplete="cc-name"
                onChange={(e) =>
                  set("payment", {
                    ...state.payment,
                    cardholderName: e.target.value,
                  })
                }
              />
              <TextField
                label="Credit or debit card number"
                placeholder="Credit / Debit Card #"
                inputMode="numeric"
                autoComplete="cc-number"
                value={state.payment.cardNumber}
                onChange={(e) =>
                  set("payment", {
                    ...state.payment,
                    cardNumber: e.target.value,
                  })
                }
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
                value={state.payment.cardType}
                onChange={(e) =>
                  set("payment", {
                    ...state.payment,
                    cardType: e.target.value,
                  })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Expiration date"
                  placeholder="MM / YY"
                  autoComplete="cc-exp"
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
                  autoComplete="cc-csc"
                  value={state.payment.cvv}
                  onChange={(e) =>
                    set("payment", {
                      ...state.payment,
                      cvv: e.target.value,
                    })
                  }
                />
              </div>
              <TextField
                label="Billing address"
                placeholder="Billing Address"
                autoComplete="billing street-address"
                value={state.payment.billingAddress}
                onChange={(e) =>
                  set("payment", {
                    ...state.payment,
                    billingAddress: e.target.value,
                  })
                }
              />
              <TextField
                label="Billing zip code"
                placeholder="Billing Zip Code"
                inputMode="numeric"
                autoComplete="billing postal-code"
                value={state.payment.billingZip}
                onChange={(e) =>
                  set("payment", {
                    ...state.payment,
                    billingZip: e.target.value,
                  })
                }
              />
              <ConsentCheckbox
                checked={state.paymentAuthAccepted}
                onChange={(c) => set("paymentAuthAccepted", c)}
              >
                I (we) hereby authorize Logos Pharmacy to make charges to my
                payment method. All records are kept in a secure file accessible
                to authorized personnel only. All payments are due upon receipt
                and unpaid balances may lead to late payment penalties and
                account closure.
              </ConsentCheckbox>
              <div>
                <p className="mb-1 text-xs font-medium text-navy/60">
                  Signature
                </p>
                <SignaturePad
                  ariaLabel="Payment authorization signature"
                  value={state.paymentSignature}
                  onChange={(v) => set("paymentSignature", v)}
                />
              </div>
            </div>
            <NavButtons onBack={() => goTo(index - 1)} onNext={advance} />
          </div>
        );

      case "saving":
        return <SavingScreen />;

      case "platform":
        return (
          <div>
            <p className="mb-2 text-sm text-navy/50">For your convenience...</p>
            <StepHeading
              title="Logos RX operates on the LifeFile Pharmacy Management Platform"
              subtitle="Trusted, HIPAA-compliant system designed specifically for compounding pharmacies. LifeFile ensures secure prescription processing, real-time provider communication, and full traceability -- helping us maintain the highest standards of accuracy, efficiency, and patient safety."
            />
            <NavButtons onBack={() => goTo(index - 1)} onNext={advance} />
          </div>
        );

      case "orderProcessing":
        return (
          <div>
            <StepHeading
              title="Order Processing"
              subtitle="What is your preferred and most frequently used shipping method?"
            />
            <OptionList
              options={SHIPPING_METHOD_OPTIONS}
              selected={state.shippingMethod ? [state.shippingMethod] : []}
              onToggle={(v) => set("shippingMethod", v)}
            />
            <NavButtons onBack={() => goTo(index - 1)} onNext={advance} />
          </div>
        );

      case "shippingDisclosure":
        return (
          <div>
            <StepHeading title="Shipping Disclosure" />
            <DisclosureBox>
              <p>
                It is understood that Logos Pharmacy utilizes FedEx and UPS as
                methods of shipping. Logos Pharmacy will choose the most
                affordable shipping vendor and method unless the &ldquo;RUSH&rdquo;
                preference is noted on the prescription in which case the method
                will always be UPS/FedEx standard overnight. See shipping rate
                sheet for the most up to date pricing.
              </p>
              <p className="mt-3">
                It is understood that by choosing non-signature required
                delivery, the physician and/or patient is accepting full
                responsibility regarding the delivery of the prescription. In the
                event the shipping vendor indicates a successful delivery for a
                non-signature required package and the recipient states the
                package was not delivered, the patient and/or clinic will be
                responsible for payment of a replacement order.
              </p>
            </DisclosureBox>
            <div className="mt-4">
              <ConsentCheckbox
                checked={state.shippingDisclosureAccepted}
                onChange={(c) => set("shippingDisclosureAccepted", c)}
              >
                I acknowledge and accept the shipping disclosure above.
              </ConsentCheckbox>
            </div>
            <div className="mt-3">
              <OptionList
                options={[
                  {
                    value: "yes",
                    label: "YES, please require a signature.",
                    description: "($7 extra per shipment)",
                  },
                  { value: "no", label: "DO NOT require signature" },
                ]}
                selected={
                  state.signatureRequired === null
                    ? []
                    : [state.signatureRequired ? "yes" : "no"]
                }
                onToggle={(v) => set("signatureRequired", v === "yes")}
              />
            </div>
            <NavButtons onBack={() => goTo(index - 1)} onNext={advance} />
          </div>
        );

      case "providerAgreement":
        return (
          <div>
            <StepHeading title="Provider Agreement" />
            <DisclosureBox>
              <p>
                This Provider Agreement is by and between Logos RX and
                &ldquo;Prescriber&rdquo; wherein each of the parties agree as
                follows:
              </p>
              <p className="mt-3">
                1. Prescriber acknowledges this purchase is from Logos RX for a
                specific patient of Prescriber&rsquo;s practice.
              </p>
              <p className="mt-3">
                2. Logos RX agrees that it provides patient specific compounded
                preparations to the Prescriber practice subject to the terms of
                this Provider Agreement.
              </p>
              <p className="mt-3">
                3. Patient specific compounded preparations prepared by Logos RX
                are received by Prescriber as an agent of the patient and shall
                not be re-dispensed to any third party or entity. The Prescriber
                will provide all packaged literature to the patient for medication
                usage instruction and for the reporting of any adverse reaction.
              </p>
              <p className="mt-3">
                4. Logos RX maintains a record of all patient specific compounded
                preparations distributed to the Prescriber as an agent of the
                patient, including the date, name, address, and phone number of
                the Prescriber and the name, strength, quantity, and LOT number
                of each preparation.
              </p>
              <p className="mt-3">
                If you understand and agree to all the terms herein, please sign
                below prior to submission of this Provider Agreement.
              </p>
            </DisclosureBox>
            <div className="mt-4">
              <ConsentCheckbox
                checked={state.providerAgreementAccepted}
                onChange={(c) => set("providerAgreementAccepted", c)}
              >
                I have read and agree to the Provider Agreement.
              </ConsentCheckbox>
            </div>
            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-navy/60">Signature</p>
              <SignaturePad
                ariaLabel="Provider agreement signature"
                value={state.providerAgreementSignature}
                onChange={(v) => set("providerAgreementSignature", v)}
              />
            </div>
            <NavButtons
              onBack={() => goTo(index - 1)}
              onNext={advance}
              nextLabel="Submit"
              submit
              loading={busy}
            />
          </div>
        );

      default:
        return null;
    }
  }
}

function ProviderCard({
  index,
  provider,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  provider: ClinicProvider;
  canRemove: boolean;
  onChange: (patch: Partial<ClinicProvider>) => void;
  onRemove: () => void;
}) {
  const [hasAdditional, setHasAdditional] = useState(
    provider.additionalLicenses.length > 0,
  );

  return (
    <div className="rounded-2xl border border-beige-dark bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-navy">Provider {index + 1}</h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
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
            value={provider.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
          />
          <TextField
            label="Last name"
            placeholder="Last Name"
            value={provider.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
          />
        </div>
        <SelectField
          label="Medical specialty"
          placeholder="Medical Specialty"
          options={SPECIALTY_OPTIONS}
          value={provider.specialty}
          onChange={(e) => onChange({ specialty: e.target.value })}
        />
        <TextField
          label="NPI number"
          placeholder="NPI #"
          inputMode="numeric"
          value={provider.npi}
          onChange={(e) => onChange({ npi: e.target.value })}
        />
        <TextField
          label="Medical license number"
          placeholder="Medical License #"
          value={provider.medicalLicense}
          onChange={(e) => onChange({ medicalLicense: e.target.value })}
        />
        <SelectField
          label="License state"
          placeholder="License State"
          options={STATE_OPTIONS}
          value={provider.licenseState}
          onChange={(e) => onChange({ licenseState: e.target.value })}
        />
        <TextField
          label="DEA number"
          placeholder="DEA # (only if writing controlled substances)"
          value={provider.dea}
          onChange={(e) => onChange({ dea: e.target.value })}
        />

        <div>
          <p className="mb-2 text-xs font-medium text-navy/60">
            Does this provider have additional licenses?
          </p>
          <div className="flex gap-2">
            {[
              { v: true, l: "Yes" },
              { v: false, l: "No" },
            ].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setHasAdditional(v);
                  if (!v) onChange({ additionalLicenses: [] });
                  else if (provider.additionalLicenses.length === 0)
                    onChange({ additionalLicenses: [{ license: "", state: "" }] });
                }}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                  hasAdditional === v
                    ? "border-magenta bg-magenta/5 text-navy"
                    : "border-beige-dark bg-cream/60 text-navy/60"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {hasAdditional &&
          provider.additionalLicenses.map((lic, li) => (
            <div key={li} className="grid grid-cols-[1fr_auto] gap-2">
              <div className="grid grid-cols-2 gap-2">
                <TextField
                  label="Additional license number"
                  placeholder="License #"
                  value={lic.license}
                  onChange={(e) =>
                    onChange({
                      additionalLicenses: provider.additionalLicenses.map(
                        (x, idx) =>
                          idx === li ? { ...x, license: e.target.value } : x,
                      ),
                    })
                  }
                />
                <SelectField
                  label="Additional license state"
                  placeholder="State"
                  options={STATE_OPTIONS}
                  value={lic.state}
                  onChange={(e) =>
                    onChange({
                      additionalLicenses: provider.additionalLicenses.map(
                        (x, idx) =>
                          idx === li ? { ...x, state: e.target.value } : x,
                      ),
                    })
                  }
                />
              </div>
              <button
                type="button"
                aria-label="Remove license"
                onClick={() =>
                  onChange({
                    additionalLicenses: provider.additionalLicenses.filter(
                      (_, idx) => idx !== li,
                    ),
                  })
                }
                className="self-center px-2 text-navy/40 hover:text-red-600"
              >
                &times;
              </button>
            </div>
          ))}
        {hasAdditional && (
          <button
            type="button"
            onClick={() =>
              onChange({
                additionalLicenses: [
                  ...provider.additionalLicenses,
                  { license: "", state: "" },
                ],
              })
            }
            className="text-xs font-medium text-magenta hover:underline"
          >
            + Add license
          </button>
        )}
      </div>
    </div>
  );
}

function SavingScreen() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setPct((p) => (p >= 100 ? 100 : p + 4)),
      80,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-center">
      <StepHeading title="We are saving your practice and provider information securely!" />
      <p className="-mt-4 mb-8 text-sm text-navy/60">
        Thank you for trusting Logos with your patient&rsquo;s health.
      </p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-beige">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky via-purple to-magenta transition-[width] duration-100"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-6 text-3xl font-bold text-magenta">{pct}%</p>
    </div>
  );
}
