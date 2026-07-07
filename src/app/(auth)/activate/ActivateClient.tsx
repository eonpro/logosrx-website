"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useSignIn } from "@clerk/nextjs/legacy";
import AuthShell from "@/components/auth/AuthShell";
import { activateSetPassword } from "./actions";

const MIN_PASSWORD_LENGTH = 8;

type Phase = "activating" | "ready" | "expired";

export default function ActivateClient({
  ticket,
  next = "/dashboard",
}: {
  ticket: string;
  next?: string;
}) {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [phase, setPhase] = useState<Phase>("activating");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Guard against the effect running twice (React strict mode) consuming the
  // single-use ticket on the first pass and failing on the second.
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    if (!authLoaded) return;

    // Already signed in (e.g. the ticket was consumed on a previous load and
    // the page was refreshed): skip re-consuming the single-use ticket and go
    // straight to the password form.
    if (isSignedIn) {
      attempted.current = true;
      setPhase("ready");
      return;
    }

    if (!ticket) {
      setPhase("expired");
      return;
    }
    if (!isLoaded || !signIn || !setActive) return;
    attempted.current = true;

    (async () => {
      try {
        const attempt = await signIn.create({ strategy: "ticket", ticket });
        if (attempt.status === "complete" && attempt.createdSessionId) {
          await setActive({ session: attempt.createdSessionId });
          setPhase("ready");
          return;
        }
        setPhase("expired");
      } catch {
        setPhase("expired");
      }
    })();
  }, [ticket, isLoaded, signIn, setActive, authLoaded, isSignedIn]);

  async function submit() {
    setError("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await activateSetPassword(password);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "activating") {
    return (
      <AuthShell subtitle="Provider Portal">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy/15 border-t-magenta" />
          <p className="text-sm text-navy/60">Activating your account…</p>
        </div>
      </AuthShell>
    );
  }

  if (phase === "expired") {
    return (
      <AuthShell
        subtitle="Provider Portal"
        footerLink={{
          text: "Already set a password?",
          label: "Sign in",
          href: "/sign-in",
        }}
      >
        <div className="flex flex-col gap-4 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-navy">
            This activation link has expired
          </h1>
          <p className="text-sm text-navy/60">
            For your security, activation links are single-use and expire after
            7 days. You can set a password using “Forgot password” on the
            sign-in page.
          </p>
          <Link
            href="/sign-in"
            className="mx-auto mt-2 inline-block rounded-full bg-magenta px-8 py-3 text-[15px] font-semibold text-white transition-all hover:bg-magenta-dark active:scale-[0.98]"
          >
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="Provider Portal">
      <div className="flex flex-col gap-5">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-navy">
            Set your password
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Your account is approved. Choose a password to finish activating
            your Logos RX provider portal.
          </p>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Field
            label="Create password"
            placeholder="At least 8 characters"
            value={password}
            onChange={setPassword}
          />
          <Field
            label="Confirm password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={setConfirm}
          />

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
            {busy ? "Activating…" : "Activate account"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        {label}
      </span>
      <input
        type="password"
        autoComplete="new-password"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-2xl border border-beige-dark bg-white px-4 text-navy outline-none transition-all placeholder:text-navy/35 focus:border-plum focus:ring-2 focus:ring-plum/10"
      />
    </label>
  );
}
