"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlockQuote } from "./actions";

export default function QuoteGate({
  token,
  clinicName,
  contactName,
}: {
  token: string;
  clinicName: string | null;
  contactName: string | null;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const greeting = contactName?.trim()
    ? `Hi ${contactName.trim().split(/\s+/)[0]},`
    : "Hello,";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await unlockQuote(token, password);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-magenta/15 ring-1 ring-magenta/30">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="text-magenta-light"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-white">{greeting}</h1>
        <p className="mt-1 text-sm text-white/55">
          {clinicName?.trim()
            ? `A custom pricing quote for ${clinicName.trim()} is ready.`
            : "A custom pricing quote is ready for you."}{" "}
          Enter the password your Logos RX representative shared to view it.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-white/40">
            Quote password
          </span>
          <input
            id="quote-password"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="XXXX-XXXX-XXXX"
            className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-center font-mono text-base tracking-widest text-white outline-none transition-colors placeholder:text-white/20 focus:border-magenta focus:ring-1 focus:ring-magenta/30"
            autoFocus
          />
        </label>

        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !password.trim()}
          className="h-12 rounded-xl bg-gradient-to-r from-magenta to-magenta-dark text-[15px] font-semibold text-white shadow-[0_0_24px_rgba(198,46,136,0.3)] transition-all hover:shadow-[0_0_32px_rgba(198,46,136,0.5)] disabled:opacity-60"
        >
          {pending ? "Checking…" : "View my quote"}
        </button>
      </form>
    </div>
  );
}
