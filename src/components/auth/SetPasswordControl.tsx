"use client";

import { useId, useState, useTransition } from "react";

export interface SetPasswordResult {
  ok: boolean;
  error?: string;
}

/**
 * Reusable admin/owner control for setting a user's sign-in password directly
 * (no activation email). Drop it into any account-management panel and pass a
 * bound server action. On success it clears the field and shows a confirmation.
 *
 * Used for partner orgs, reps, teammates, and clinics so an admin/owner can hand
 * out working credentials at account-creation time or reset a forgotten password.
 */
export default function SetPasswordControl({
  action,
  label = "Set password",
  className = "",
}: {
  action: (password: string) => Promise<SetPasswordResult>;
  label?: string;
  className?: string;
}) {
  const inputId = useId();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    setError("");
    setNotice("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    const value = password;
    startTransition(async () => {
      const res = await action(value);
      if (!res.ok) {
        setError(res.error ?? "Could not set the password.");
      } else {
        setPassword("");
        setNotice("Password set. Share it with the account holder securely.");
      }
    });
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-end gap-2">
        <label htmlFor={inputId} className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Set sign-in password
          </span>
          <input
            id={inputId}
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="h-10 w-56 rounded-2xl border border-beige-dark bg-white px-3.5 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-navy focus:ring-2 focus:ring-navy/10"
          />
        </label>
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="h-10 rounded-full border border-beige-dark bg-white px-4 text-xs font-semibold text-navy/60 transition-all hover:border-navy/40 hover:text-navy"
        >
          {show ? "Hide" : "Show"}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || password.length === 0}
          className="h-10 rounded-full bg-navy px-5 text-sm font-semibold text-white transition-all hover:bg-navy-light active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Setting…" : label}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-2 text-xs text-emerald-700">
          {notice}
        </p>
      )}
    </div>
  );
}
