export const dynamic = "force-dynamic";

import Link from "next/link";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { listQuotes, isQuoteExpired } from "@/lib/quotes/data";
import type { PricingQuote } from "@/lib/db/schema";

function statusLabel(q: PricingQuote): { text: string; className: string } {
  if (q.status === "claimed")
    return { text: "Claimed", className: "bg-green-100 text-green-700" };
  if (q.status === "revoked")
    return { text: "Revoked", className: "bg-gray-200 text-gray-600" };
  if (isQuoteExpired(q))
    return { text: "Expired", className: "bg-amber-100 text-amber-700" };
  if (q.status === "accepted")
    return { text: "Accepted", className: "bg-navy/10 text-navy" };
  return { text: "Active", className: "bg-magenta/10 text-magenta" };
}

function fmtDate(d: Date | null): string {
  return d
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

export default async function QuotesPage() {
  const ctx = await requireAdmin();
  const canEdit = ctx.role === ADMIN_ROLE;
  const quotes = await listQuotes();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Pricing Quotes</h1>
          <p className="mt-1 text-sm text-navy/60">
            Password-gated custom pricing links for prospective clinics.
          </p>
        </div>
        {canEdit && (
          <Link
            href="/admin/quotes/new"
            className="inline-flex items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-white hover:bg-magenta/90"
          >
            + New quote
          </Link>
        )}
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-beige-dark bg-white p-12 text-center">
          <p className="text-sm text-navy/60">
            No quotes yet. Create one to send a clinic their custom pricing.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-beige-dark bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-beige-dark bg-beige/40 text-xs uppercase tracking-wider text-navy/55">
                <th className="px-5 py-3 font-medium">Recipient</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Pricing</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const badge = statusLabel(q);
                return (
                  <tr
                    key={q.id}
                    className="border-b border-beige-dark/60 last:border-0 hover:bg-beige/30"
                  >
                    <td className="px-5 py-4">
                      <Link href={`/admin/quotes/${q.id}`} className="block">
                        <div className="font-medium text-navy">
                          {q.clinicName?.trim() || q.contactName?.trim() || "—"}
                        </div>
                        <div className="text-xs text-navy/50">{q.email}</div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-navy/70">{q.itemCount}</td>
                    <td className="px-5 py-4 text-navy/70">
                      <span className="capitalize">{q.tier}</span>
                      {q.discountPct > 0 && (
                        <span className="text-navy/50"> · {q.discountPct}% off</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.text}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-navy/60">{fmtDate(q.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
