"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteQuote,
  reactivateQuote,
  regenerateQuotePassword,
  revokeQuote,
} from "../actions";
import { btnDanger, btnPrimary, btnSecondary } from "@/components/ui/portal";

export default function QuoteDetailActions({
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
      const res = await regenerateQuotePassword(id);
      if (res.ok && res.password) setPassword(res.password);
      else setError(res.error ?? "Could not regenerate the password.");
    });
  }

  function toggleRevoke() {
    startTransition(async () => {
      if (revoked) await reactivateQuote(id);
      else await revokeQuote(id);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("Delete this quote permanently? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteQuote(id);
      router.push("/admin/quotes");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyLink}
          className={btnPrimary}
        >
          {copied ? "Link copied" : "Copy link"}
        </button>
        {!claimed && (
          <button
            type="button"
            onClick={regenerate}
            disabled={pending}
            className={btnSecondary}
          >
            Regenerate password
          </button>
        )}
        <Link
          href={`/admin/quotes/new?from=${id}`}
          className={btnSecondary}
        >
          Duplicate
        </Link>
        {!claimed && (
          <button
            type="button"
            onClick={toggleRevoke}
            disabled={pending}
            className={revoked ? btnSecondary : btnDanger}
          >
            {revoked ? "Reactivate" : "Revoke"}
          </button>
        )}
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className={btnDanger}
        >
          Delete
        </button>
      </div>

      {password && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            New password (shown once)
          </p>
          <p className="mt-1 font-mono text-lg tracking-widest text-navy">
            {password}
          </p>
          <p className="mt-1 text-xs text-navy/55">
            Share this with the clinic separately. The previous password no longer
            works.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
