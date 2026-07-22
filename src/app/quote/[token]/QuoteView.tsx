"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Badge,
  cardClass,
  rowClass,
  tableWrapClass,
  theadClass,
} from "@/components/ui/portal";
import { formatCents, discountPercent } from "@/lib/portal/pricing";
import { acceptQuote } from "./actions";

export interface QuoteViewItem {
  id: number;
  name: string;
  unit: string | null;
  priceCents: number;
  standardCents: number | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
}

export default function QuoteView({
  token,
  clinicName,
  contactName,
  intro,
  discountPct,
  expiresAt,
  items,
}: {
  token: string;
  clinicName: string | null;
  contactName: string | null;
  intro: string | null;
  discountPct: number;
  expiresAt: string | null;
  items: QuoteViewItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const greetingName = contactName?.trim()
    ? contactName.trim().split(/\s+/)[0]
    : null;

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  function accept() {
    setError("");
    startTransition(async () => {
      const res = await acceptQuote(token);
      if (res.ok && res.next) {
        router.push(res.next);
      } else {
        setError(res.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className={`${cardClass} p-8`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Custom pricing quote
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy sm:text-3xl">
          {clinicName?.trim() || "Your clinic"}
        </h1>
        {intro?.trim() ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-navy/60">
            {intro.trim()}
          </p>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-navy/60">
            {greetingName ? `Hi ${greetingName} — ` : ""}here is the custom
            pricing we&apos;ve prepared for your practice. Accept below to create
            your account and lock it in.
          </p>
        )}
        {discountPct > 0 && (
          <p className="mt-3">
            <Badge tone="accent">
              {discountPct}% off standard pricing across the catalog
            </Badge>
          </p>
        )}
        <a
          href={`/quote/${token}/pdf`}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-beige bg-white px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-navy/30 hover:bg-cream"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF
        </a>
      </div>

      {items.length > 0 && (
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 text-right">Standard</th>
                <th className="px-5 py-3 text-right">Your price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const save = discountPercent(it.standardCents, it.priceCents);
                return (
                  <tr key={it.id} className={rowClass}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-beige bg-cream/60">
                          {it.imageUrl ? (
                            <Image
                              src={it.imageUrl}
                              alt={it.imageAlt ?? it.name}
                              width={64}
                              height={64}
                              className="h-full w-full object-contain p-1.5"
                            />
                          ) : (
                            <svg
                              width="28"
                              height="28"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="text-navy/25"
                            >
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <path d="M3 15l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-navy">{it.name}</div>
                          {it.unit && (
                            <div className="text-xs text-navy/50">{it.unit}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-navy/45">
                      {it.standardCents !== null ? (
                        <span className="line-through">
                          {formatCents(it.standardCents)}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="font-semibold text-navy">
                        {formatCents(it.priceCents)}
                      </div>
                      {save > 0 && (
                        <div className="text-xs font-medium text-magenta">
                          Save {save}%
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className={`${cardClass} p-8 text-center text-navy`}>
        <h2 className="text-lg font-bold tracking-tight">Accept this pricing</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-navy/60">
          Accepting creates your Logos RX provider account with this pricing
          applied. You&apos;ll finish a short onboarding, then a team member
          verifies your clinic before your portal goes live.
        </p>
        {error && (
          <p className="mx-auto mt-4 max-w-md rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={accept}
          disabled={pending}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-magenta px-8 py-3 text-[15px] font-semibold text-white transition-all hover:bg-magenta-dark active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Setting up…" : "Accept pricing & create account"}
        </button>
        {expiryLabel && (
          <p className="mt-4 text-xs text-navy/50">
            This quote is valid through {expiryLabel}.
          </p>
        )}
      </div>
    </div>
  );
}
