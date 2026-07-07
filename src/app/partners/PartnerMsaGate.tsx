"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SignaturePad from "@/components/onboarding/SignaturePad";
import AgreementDocument from "@/components/partners/AgreementDocument";
import { MSA_TITLE } from "@/lib/partners/msa";
import { signPartnerMsa } from "./agreement/actions";

/**
 * Full-screen gate shown to an active partner (org owner or rep) who hasn't yet
 * executed the Marketing Services Agreement. Rendered by the partners layout in
 * place of the portal until `msaSignedAt` is set. The org owner fills the
 * entity blanks; reps acknowledge the same agreement (entity prefilled, locked).
 */
export default function PartnerMsaGate({
  signerKind,
  defaultSignerName,
  defaultEntityName,
  orgName,
}: {
  signerKind: "org" | "rep";
  defaultSignerName: string;
  defaultEntityName: string;
  orgName: string;
}) {
  const router = useRouter();
  const isOrg = signerKind === "org";

  const [legalEntityName, setLegalEntityName] = useState(defaultEntityName);
  const [entityAddress, setEntityAddress] = useState("");
  const [entityState, setEntityState] = useState("");
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerTitle, setSignerTitle] = useState("");
  const [signature, setSignature] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function submit() {
    setError("");
    if (!agreed) {
      setError("Please confirm that you have read and agree to the Agreement.");
      return;
    }
    if (!signature) {
      setError("Please draw your signature in the box below.");
      return;
    }
    setBusy(true);
    try {
      const res = await signPartnerMsa({
        legalEntityName,
        entityAddress,
        entityState,
        signerName,
        signerTitle,
        signatureImage: signature,
        agreed,
      });
      if (!res.ok) {
        setError(res.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="theme-ink relative min-h-screen bg-cream text-navy">
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col px-6 py-10 sm:py-14">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/images/logo.svg"
            alt="Logos RX"
            width={150}
            height={48}
            className="h-9 w-auto"
            priority
          />
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.25em] text-magenta">
            Partner Program
          </p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
            Sign your {MSA_TITLE}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-navy/60">
            {isOrg
              ? "Before you can access the partner portal, please review and execute the Marketing Services Agreement below. A signed copy is kept on file for you and the pharmacy."
              : `Before you can access the partner portal, please review and acknowledge ${orgName}'s Marketing Services Agreement with Logos RX. A signed copy is kept on file for you and the pharmacy.`}
          </p>
        </div>

        {/* The live document */}
        <div className="mt-8 max-h-[55vh] overflow-y-auto rounded-2xl border border-beige bg-white p-2 sm:p-3">
          <AgreementDocument
            values={{
              effectiveDate: today,
              legalEntityName,
              entityAddress,
              entityState,
            }}
          />
        </div>

        {/* Signing panel */}
        <div className="mt-6 rounded-2xl border border-beige bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {isOrg && (
              <>
                <Field label="Legal entity name" required>
                  <input
                    className={inputClass}
                    value={legalEntityName}
                    onChange={(e) => setLegalEntityName(e.target.value)}
                    placeholder="Acme Marketing LLC"
                    maxLength={200}
                  />
                </Field>
                <Field label="State of organization">
                  <input
                    className={inputClass}
                    value={entityState}
                    onChange={(e) => setEntityState(e.target.value)}
                    placeholder="Delaware"
                    maxLength={60}
                  />
                </Field>
                <Field label="Principal place of business" className="sm:col-span-2">
                  <input
                    className={inputClass}
                    value={entityAddress}
                    onChange={(e) => setEntityAddress(e.target.value)}
                    placeholder="123 Main St, Suite 200, City, ST 00000"
                    maxLength={255}
                  />
                </Field>
              </>
            )}
            <Field label="Signer name" required>
              <input
                className={inputClass}
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Jane Smith"
                maxLength={200}
              />
            </Field>
            <Field label="Signer title" required>
              <input
                className={inputClass}
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                placeholder="Owner / Authorized Signatory"
                maxLength={120}
              />
            </Field>
          </div>

          <div className="mt-4">
            <span className="text-xs font-medium uppercase tracking-wider text-navy/55">
              Signature <span className="text-magenta">*</span>
            </span>
            <div className="mt-1.5">
              <SignaturePad
                value={signature}
                onChange={setSignature}
                ariaLabel="Sign the Marketing Services Agreement"
              />
            </div>
          </div>

          <label className="mt-4 flex items-start gap-3 text-sm text-navy/70">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-beige-dark accent-magenta"
            />
            <span>
              I have read, understand, and agree to be bound by the {MSA_TITLE},
              and I am authorized to sign on behalf of {isOrg ? "my organization" : orgName}.
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="mt-5 h-12 w-full rounded-xl bg-magenta text-[15px] font-semibold text-white transition-colors hover:bg-magenta-dark disabled:opacity-60"
          >
            {busy ? "Recording signature…" : "Sign & continue"}
          </button>
          <p className="mt-3 text-center text-[11px] text-navy/45">
            By signing, you consent to the use of an electronic signature. Your
            name, title, signature, date, and IP address are recorded.
          </p>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border border-beige-dark bg-white px-4 text-navy outline-none transition-colors placeholder:text-navy/35 focus:border-magenta focus:ring-1 focus:ring-magenta/30";

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wider text-navy/55">
        {label}
        {required && <span className="text-magenta"> *</span>}
      </span>
      {children}
    </label>
  );
}
