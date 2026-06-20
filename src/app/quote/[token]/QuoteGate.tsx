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
    <div className="mx-auto max-w-md rounded-2xl border border-beige-dark bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-magenta/10">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E6007E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-navy">{greeting}</h1>
        <p className="mt-2 text-sm text-navy/65">
          {clinicName?.trim()
            ? `A custom pricing quote for ${clinicName.trim()} is ready.`
            : "A custom pricing quote is ready for you."}{" "}
          Enter the password your Logos RX representative shared to view it.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label
            htmlFor="quote-password"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-navy/60"
          >
            Quote password
          </label>
          <input
            id="quote-password"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="XXXX-XXXX-XXXX"
            className="w-full rounded-xl border border-beige-dark bg-beige/40 px-4 py-3 text-center font-mono text-base tracking-widest text-navy outline-none focus:border-magenta focus:ring-1 focus:ring-magenta"
            autoFocus
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !password.trim()}
          className="w-full rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-magenta/90 disabled:opacity-50"
        >
          {pending ? "Checking…" : "View my quote"}
        </button>
      </form>
    </div>
  );
}
