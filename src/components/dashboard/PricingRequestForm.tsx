"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  btnAccent,
  btnSecondary,
  cardClass,
  inputClass,
} from "@/components/ui/portal";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy/45";
import { submitPricingRequest } from "@/app/dashboard/pricing-request/actions";
import {
  VOLUME_BANDS,
  VOLUME_BAND_LABELS,
  MAX_MESSAGE_LEN,
  type VolumeBand,
} from "@/lib/pricing-requests/validate";

interface ProductOption {
  id: string;
  name: string;
  strength?: string;
}

interface PricingRequestFormProps {
  products: ProductOption[];
  /** Prefill when opened from a product detail page. */
  initialProductIds?: string[];
}

export default function PricingRequestForm({
  products,
  initialProductIds = [],
}: PricingRequestFormProps) {
  const router = useRouter();
  const [volumeBand, setVolumeBand] = useState<VolumeBand | "">("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialProductIds),
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitPricingRequest({
        volumeBand,
        productIds: [...selected],
        message,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className={`${cardClass} p-8 text-center`}>
        <Badge tone="success">Request sent</Badge>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-navy">
          We&rsquo;ll follow up with better pricing
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-navy/60">
          Our team received your volume pricing request and will review it
          shortly. We&rsquo;ll reach out with an updated offer for your practice.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className={btnAccent}>
            Back to catalog
          </Link>
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              setDone(false);
              setMessage("");
              setVolumeBand("");
              setSelected(new Set());
            }}
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`${cardClass} space-y-6 p-6 sm:p-8`}>
      <div>
        <label htmlFor="volume-band" className={labelClass}>
          Expected monthly order volume
        </label>
        <select
          id="volume-band"
          required
          value={volumeBand}
          onChange={(e) => setVolumeBand(e.target.value as VolumeBand | "")}
          className={inputClass}
        >
          <option value="" disabled>
            Select a range…
          </option>
          {VOLUME_BANDS.map((band) => (
            <option key={band} value={band}>
              {VOLUME_BAND_LABELS[band]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2 flex items-end justify-between gap-3">
          <label className={labelClass}>
            Products of interest{" "}
            <span className="font-normal text-navy/45">(optional)</span>
          </label>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs font-semibold text-navy/50 hover:text-navy"
            >
              Clear ({selected.size})
            </button>
          )}
        </div>
        <p className="mb-3 text-xs leading-relaxed text-navy/50">
          Leave blank for catalog-wide pricing, or pick the SKUs you order most.
        </p>
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-beige/80 bg-cream/40 p-2">
          {products.map((p) => {
            const checked = selected.has(p.id);
            return (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                  checked ? "bg-white shadow-soft" : "hover:bg-white/70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(p.id)}
                  className="h-4 w-4 rounded border-beige text-plum focus:ring-plum"
                />
                <span className="font-medium text-navy">{p.name}</span>
                {p.strength && (
                  <span className="text-xs text-navy/45">{p.strength}</span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="pricing-notes" className={labelClass}>
          Notes for our team{" "}
          <span className="font-normal text-navy/45">(optional)</span>
        </label>
        <textarea
          id="pricing-notes"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MAX_MESSAGE_LEN}
          rows={4}
          placeholder="Tell us about your expected volume, preferred SKUs, or contract timing…"
          className={`${inputClass} min-h-[7rem] resize-y`}
        />
        <p className="mt-1 text-right text-[11px] text-navy/40">
          {message.length}/{MAX_MESSAGE_LEN}
        </p>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button type="submit" disabled={pending} className={btnAccent}>
          {pending ? "Sending…" : "Request custom pricing based on volume"}
        </button>
        <button
          type="button"
          className={btnSecondary}
          disabled={pending}
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
