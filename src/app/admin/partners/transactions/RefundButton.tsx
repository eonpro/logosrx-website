"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/partners/commission";
import { refundPartnerTransaction } from "../actions";

/**
 * Per-row refund control for the admin transactions table. Opens a small
 * inline form: full refund or a partial dollar amount. On success the page
 * revalidates (server action) and the row's refunded total updates.
 */
export default function RefundButton({
  transactionId,
  remainingCents,
}: {
  transactionId: number;
  remainingCents: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (remainingCents <= 0) {
    return <span className="text-xs text-navy/40">Refunded</span>;
  }

  function submit(full: boolean) {
    setError("");
    const refundDollars = full ? null : Number(amount);
    if (!full && (!Number.isFinite(refundDollars) || (refundDollars ?? 0) <= 0)) {
      setError("Enter an amount.");
      return;
    }
    startTransition(async () => {
      const res = await refundPartnerTransaction({ transactionId, refundDollars });
      if (!res.ok) {
        setError(res.error ?? "Could not refund.");
        return;
      }
      setOpen(false);
      setAmount("");
      // Pull the revalidated rows into this client view; without it the row
      // keeps its stale amounts and still shows the Refund control, inviting
      // an accidental double refund.
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-navy/60 hover:text-magenta"
      >
        Refund
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={(remainingCents / 100).toFixed(2)}
          aria-label="Partial refund amount in dollars"
          className="h-8 w-24 rounded-lg border border-beige bg-cream/50 px-2 text-right text-xs tabular-nums text-navy outline-none focus:border-magenta"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(false)}
          className="rounded-md bg-navy px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
        >
          Refund
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(true)}
          className="rounded-md border border-beige px-2 py-1 text-[11px] font-medium text-navy/70 hover:border-magenta disabled:opacity-60"
        >
          Full ({formatCents(remainingCents)})
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="text-[11px] text-navy/50 hover:text-navy"
        >
          Cancel
        </button>
      </div>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
