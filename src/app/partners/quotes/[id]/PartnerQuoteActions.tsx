"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deletePartnerQuote,
  reactivatePartnerQuote,
  regeneratePartnerQuotePassword,
  revokePartnerQuote,
} from "../actions";

export default function PartnerQuoteActions({
  id,
  url,
  status,
}: {
  id: number;
  url: string;
  status: "active" | "accepted" | "claimed" | "revoked";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const claimed = status === "claimed";
  const revoked = status === "revoked";

  function copyLink() {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function regenerate() {
    setError("");
    setPassword(null);
    startTransition(async () => {
      const res = await regeneratePartnerQuotePassword(id);
      if (res.ok && res.password) setPassword(res.password);
      else setError(res.error ?? "Could not regenerate the password.");
    });
  }

  function toggleRevoke() {
    startTransition(async () => {
      if (revoked) await reactivatePartnerQuote(id);
      else await revokePartnerQuote(id);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("Delete this quote permanently? This cannot be undone.")) return;
    startTransition(async () => {
      await deletePartnerQuote(id);
      router.push("/partners/quotes");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
        >
          {copied ? "Link copied" : "Copy link"}
        </button>
        {!claimed && (
          <button
            type="button"
            onClick={regenerate}
            disabled={pending}
            className="rounded-full border border-beige px-4 py-2 text-sm font-semibold text-navy hover:bg-cream disabled:opacity-50"
          >
            Regenerate password
          </button>
        )}
        {!claimed && (
          <button
            type="button"
            onClick={toggleRevoke}
            disabled={pending}
            className="rounded-full border border-beige px-4 py-2 text-sm font-semibold text-navy hover:bg-cream disabled:opacity-50"
          >
            {revoked ? "Reactivate" : "Revoke"}
          </button>
        )}
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {password && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-navy/55">
            New password (shown once)
          </p>
          <p className="mt-1 font-mono text-lg tracking-widest text-navy">{password}</p>
          <p className="mt-1 text-xs text-navy/55">
            Share this with the clinic separately. The previous password no longer
            works.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
