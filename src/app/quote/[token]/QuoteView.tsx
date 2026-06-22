"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-magenta-light">
          Custom pricing quote
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">
          {clinicName?.trim() || "Your clinic"}
        </h1>
        {intro?.trim() ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/60">
            {intro.trim()}
          </p>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            {greetingName ? `Hi ${greetingName} — ` : ""}here is the custom
            pricing we&apos;ve prepared for your practice. Accept below to create
            your account and lock it in.
          </p>
        )}
        {discountPct > 0 && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-magenta/15 px-3 py-1 text-xs font-semibold text-magenta-light ring-1 ring-magenta/30">
            {discountPct}% off standard pricing across the catalog
          </p>
        )}
      </div>

      {items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-white/40">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 text-right font-medium">
                  Standard
                </th>
                <th className="px-5 py-3 text-right font-medium">Your price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const save = discountPercent(it.standardCents, it.priceCents);
                return (
                  <tr
                    key={it.id}
                    className="border-b border-white/8 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
                          {it.imageUrl ? (
                            <Image
                              src={it.imageUrl}
                              alt={it.imageAlt ?? it.name}
                              width={48}
                              height={48}
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="text-white/25"
                            >
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <path d="M3 15l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">{it.name}</div>
                          {it.unit && (
                            <div className="text-xs text-white/45">{it.unit}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-white/40">
                      {it.standardCents !== null ? (
                        <span className="line-through">
                          {formatCents(it.standardCents)}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="font-semibold text-white">
                        {formatCents(it.priceCents)}
                      </div>
                      {save > 0 && (
                        <div className="text-xs font-medium text-magenta-light">
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

      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white backdrop-blur-sm">
        <h2 className="text-lg font-bold">Accept this pricing</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
          Accepting creates your Logos RX provider account with this pricing
          applied. You&apos;ll finish a short onboarding, then a team member
          verifies your clinic before your portal goes live.
        </p>
        {error && (
          <p className="mx-auto mt-4 max-w-md rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={accept}
          disabled={pending}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-magenta to-magenta-dark px-8 py-3 text-[15px] font-semibold text-white shadow-[0_0_24px_rgba(198,46,136,0.3)] transition-all hover:shadow-[0_0_32px_rgba(198,46,136,0.5)] disabled:opacity-60"
        >
          {pending ? "Setting up…" : "Accept pricing & create account"}
        </button>
        {expiryLabel && (
          <p className="mt-4 text-xs text-white/45">
            This quote is valid through {expiryLabel}.
          </p>
        )}
      </div>
    </div>
  );
}
