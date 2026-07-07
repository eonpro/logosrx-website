"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { submitPartnerApplication } from "./actions";

const inputClass =
  "h-12 rounded-2xl border border-beige-dark bg-white px-4 text-navy outline-none transition-all placeholder:text-navy/35 focus:border-navy focus:ring-2 focus:ring-navy/10";

export default function ApplyForm() {
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const res = await submitPartnerApplication({
        orgName,
        contactName,
        email,
        phone,
        website,
        notes,
      });
      if (!res.ok) {
        setError(res.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthShell subtitle="Partner Program">
        <div className="flex flex-col gap-4 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-navy">
            Application received
          </h1>
          <p className="text-sm text-navy/60">
            Thanks — our team will review your application and reach out at{" "}
            <span className="font-medium text-navy">{email}</span>. Once approved,
            you&rsquo;ll get an activation link to set up your partner portal.
          </p>
          <Link
            href="/"
            className="mx-auto mt-2 inline-block rounded-full bg-magenta px-8 py-3 text-[15px] font-semibold text-white transition-all hover:bg-magenta-dark active:scale-[0.98]"
          >
            Back to logosrx.com
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      subtitle="Partner Program"
      footerLink={{
        text: "Already a partner?",
        label: "Sign in",
        href: "/partners/sign-in",
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-navy">
            Become a Logos RX marketing partner
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Provide marketing and brand-support services for Logos RX.
          </p>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Field label="Organization name" required>
            <input
              className={inputClass}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Sales Group"
              maxLength={200}
              required
            />
          </Field>
          <Field label="Contact name" required>
            <input
              className={inputClass}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Jane Smith"
              maxLength={200}
              required
            />
          </Field>
          <Field label="Email" required>
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@acmesales.com"
              maxLength={255}
              required
            />
          </Field>
          <Field label="Phone" required>
            <input
              className={inputClass}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              maxLength={30}
              required
            />
          </Field>
          <Field label="Website">
            <input
              className={inputClass}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://acmesales.com"
              maxLength={255}
            />
          </Field>
          <Field label="Tell us about your marketing capabilities">
            <textarea
              className={`${inputClass} h-24 resize-none py-3`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Channels, audience, brand/marketing experience, team size…"
              maxLength={4000}
            />
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-12 rounded-full bg-magenta text-[15px] font-semibold text-white transition-all hover:bg-magenta-dark active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit application"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        {label}
        {required && <span className="text-magenta"> *</span>}
      </span>
      {children}
    </label>
  );
}
