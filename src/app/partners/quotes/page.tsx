export const dynamic = "force-dynamic";

import Link from "next/link";
import { getPartnerContext } from "@/lib/auth/partner";
import { listQuotesForPartner, isQuoteExpired } from "@/lib/quotes/data";
import type { PricingQuote } from "@/lib/db/schema";
import PartnerNoAccess from "../PartnerNoAccess";

function statusLabel(q: PricingQuote): { text: string; className: string } {
  if (q.status === "claimed")
    return { text: "Claimed", className: "bg-green-100 text-green-700" };
  if (q.status === "revoked")
    return { text: "Revoked", className: "bg-gray-200 text-gray-600" };
  if (isQuoteExpired(q))
    return { text: "Expired", className: "bg-amber-100 text-amber-700" };
  if (q.status === "accepted")
    return { text: "Accepted", className: "bg-blue-100 text-blue-700" };
  return { text: "Active", className: "bg-magenta/10 text-magenta" };
}

function fmtDate(d: Date | null): string {
  return d
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

export default async function PartnerQuotesPage() {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  if (ctx.org.compensationModel !== "margin") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy">Pricing Quotes</h1>
        <div className="mt-6 rounded-2xl border border-beige bg-white p-10 text-center">
          <p className="text-sm text-navy/65">
            Custom pricing quotes are available on the wholesale/margin model.
            Your organization earns a commission percentage, so pricing is managed
            by Logos RX — use your{" "}
            <Link href="/partners/links" className="text-magenta hover:underline">
              referral links
            </Link>{" "}
            to onboard clinics.
          </p>
        </div>
      </div>
    );
  }

  const quotes = await listQuotesForPartner({
    orgId: ctx.org.id,
    repId: ctx.kind === "rep" ? ctx.rep!.id : null,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Pricing Quotes</h1>
          <p className="mt-1 text-sm text-navy/60">
            Send a prospective clinic a password-gated custom price list. Clinics
            that accept are added to your network automatically.
          </p>
        </div>
        <Link
          href="/partners/quotes/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-white hover:bg-magenta/90"
        >
          + New quote
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-beige bg-white p-12 text-center">
          <p className="text-sm text-navy/60">
            No quotes yet. Create one to send a clinic their custom pricing.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-beige bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-beige bg-cream text-xs uppercase tracking-wider text-navy/55">
                <th className="px-5 py-3 font-medium">Recipient</th>
                <th className="px-5 py-3 font-medium">Items</th>
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
                    className="border-b border-beige/60 last:border-0 hover:bg-cream/60"
                  >
                    <td className="px-5 py-4">
                      <Link href={`/partners/quotes/${q.id}`} className="block">
                        <div className="font-medium text-navy">
                          {q.clinicName?.trim() || q.contactName?.trim() || "—"}
                        </div>
                        <div className="text-xs text-navy/50">{q.email}</div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-navy/70">{q.itemCount}</td>
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
