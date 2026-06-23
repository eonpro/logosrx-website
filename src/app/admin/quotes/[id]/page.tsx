export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { getQuoteWithItemsById, isQuoteExpired } from "@/lib/quotes/data";
import { SITE_URL } from "@/lib/constants";
import { formatCents } from "@/lib/portal/pricing";
import QuoteDetailActions from "./QuoteDetailActions";
import RecipientEditor from "./RecipientEditor";

function fmtDateTime(d: Date | null): string {
  return d
    ? d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const quoteId = Number(id);
  if (!Number.isInteger(quoteId) || quoteId <= 0) notFound();

  const data = await getQuoteWithItemsById(quoteId);
  if (!data) notFound();

  const { quote, items } = data;
  const url = `${SITE_URL}/quote/${quote.token}`;
  const expired = isQuoteExpired(quote);

  const timeline: { label: string; value: string }[] = [
    { label: "Created", value: fmtDateTime(quote.createdAt) },
    { label: "First viewed", value: fmtDateTime(quote.viewedAt) },
    { label: "Accepted", value: fmtDateTime(quote.acceptedAt) },
    { label: "Claimed", value: fmtDateTime(quote.claimedAt) },
    {
      label: "Expires",
      value: quote.expiresAt ? fmtDateTime(quote.expiresAt) : "No expiry",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <Link href="/admin/quotes" className="text-sm text-navy/60 hover:text-navy">
          ← Quotes
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-navy">
            {quote.clinicName?.trim() || quote.contactName?.trim() || quote.email}
          </h1>
          <span className="rounded-full bg-beige px-3 py-0.5 text-xs font-medium capitalize text-navy/70">
            {expired && quote.status === "active" ? "expired" : quote.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-navy/60">{quote.email}</p>
      </div>

      <section className="mb-5 rounded-2xl border border-beige-dark bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-navy/55">
          Recipient
        </h2>
        <dl className="mb-4 space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-navy/55">Clinic</dt>
            <dd className="text-right font-medium text-navy">
              {quote.clinicName?.trim() || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-navy/55">Contact</dt>
            <dd className="text-right font-medium text-navy">
              {quote.contactName?.trim() || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-navy/55">Email</dt>
            <dd className="text-right font-medium text-navy">{quote.email}</dd>
          </div>
        </dl>
        <RecipientEditor
          id={quote.id}
          clinicName={quote.clinicName}
          contactName={quote.contactName}
          email={quote.email}
        />
      </section>

      <section className="rounded-2xl border border-beige-dark bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-navy/55">
          Share
        </h2>
        <div className="mb-4 break-all rounded-lg bg-beige/40 px-3 py-2 font-mono text-xs text-navy/70">
          {url}
        </div>
        <QuoteDetailActions id={quote.id} url={url} status={quote.status} />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-beige-dark bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-navy/55">
            Pricing
          </h2>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-navy/55">Tier</dt>
              <dd className="font-medium capitalize text-navy">{quote.tier}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-navy/55">Catalog discount</dt>
              <dd className="font-medium text-navy">{quote.discountPct}%</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-beige-dark bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-navy/55">
            Timeline
          </h2>
          <dl className="space-y-1.5 text-sm">
            {timeline.map((t) => (
              <div key={t.label} className="flex justify-between gap-3">
                <dt className="text-navy/55">{t.label}</dt>
                <dd className="text-right font-medium text-navy">{t.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {quote.intro?.trim() && (
        <section className="mt-5 rounded-2xl border border-beige-dark bg-white p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-navy/55">
            Intro message
          </h2>
          <p className="whitespace-pre-wrap text-sm text-navy/70">{quote.intro}</p>
        </section>
      )}

      <section className="mt-5 rounded-2xl border border-beige-dark bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-navy/55">
          Quoted products ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-navy/55">
            No specific products — a catalog-wide {quote.discountPct}% discount applies.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-beige-dark/50 last:border-0">
                  <td className="py-2.5">
                    <span className="font-medium text-navy">{it.productName}</span>
                    {it.unit && <span className="text-navy/45"> · {it.unit}</span>}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-navy">
                    {formatCents(it.priceCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {quote.status === "claimed" && (
        <p className="mt-4 text-sm text-green-700">
          This quote was claimed — the pricing has been applied to the clinic
          account.
        </p>
      )}
    </div>
  );
}
