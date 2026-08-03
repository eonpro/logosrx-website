"use client";

import { useTransition } from "react";
import Link from "next/link";
import { dismissPricingUpdatedBanner } from "@/app/dashboard/pricing-request/dismiss-actions";

/**
 * Shown on the clinic catalog after an admin completes & notifies a pricing
 * request. Dismiss stamps clinics.pricingUpdateSeenAt.
 */
export default function PricingUpdatedBanner() {
  const [pending, startTransition] = useTransition();

  function onDismiss() {
    startTransition(async () => {
      await dismissPricingUpdatedBanner();
    });
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-emerald-200/80 bg-emerald-50/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold text-emerald-950">
          Your pricing was updated
        </p>
        <p className="mt-0.5 text-sm text-emerald-900/70">
          We reviewed your volume request and refreshed your clinic rates.
          Browse the catalog to see your new prices.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="#all-products"
          className="rounded-full bg-emerald-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-950 active:scale-[0.98]"
        >
          View prices
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={onDismiss}
          className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-900 transition-all hover:border-emerald-500 disabled:opacity-60"
        >
          {pending ? "…" : "Dismiss"}
        </button>
      </div>
    </div>
  );
}
