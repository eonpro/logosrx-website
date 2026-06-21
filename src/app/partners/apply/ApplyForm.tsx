"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { submitPartnerApplication } from "./actions";

const inputClass =
  "h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-colors placeholder:text-white/20 focus:border-magenta focus:ring-1 focus:ring-magenta/30";

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
          <h1 className="text-xl font-semibold text-white">
            Application received
          </h1>
          <p className="text-sm text-white/60">
            Thanks — our team will review your application and reach out at{" "}
            <span className="text-white/90">{email}</span>. Once approved,
            you&rsquo;ll get an activation link to set up your partner portal.
          </p>
          <Link
            href="/"
            className="mx-auto mt-2 inline-block rounded-xl bg-gradient-to-r from-magenta to-magenta-dark px-6 py-3 text-[15px] font-semibold text-white shadow-[0_0_24px_rgba(198,46,136,0.3)] transition-all hover:shadow-[0_0_32px_rgba(198,46,136,0.5)]"
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
          <h1 className="text-xl font-semibold text-white">
            Become a Logos RX marketing partner
          </h1>
          <p className="mt-1 text-sm text-white/55">
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
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-12 rounded-xl bg-gradient-to-r from-magenta to-magenta-dark text-[15px] font-semibold text-white shadow-[0_0_24px_rgba(198,46,136,0.3)] transition-all hover:shadow-[0_0_32px_rgba(198,46,136,0.5)] disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit application"}
          </button>

          <p className="text-[11px] leading-relaxed text-white/35">
            Partners are paid a set fee for marketing services — not for
            referrals or any share of sales. Engagements are governed by a
            Marketing Services Agreement.
          </p>
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
      <span className="text-xs font-medium uppercase tracking-wider text-white/40">
        {label}
        {required && <span className="text-magenta-light"> *</span>}
      </span>
      {children}
    </label>
  );
}
