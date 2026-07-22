export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerOrgs, partnerReps } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { getQuoteWithItemsById, isQuoteExpired } from "@/lib/quotes/data";
import { SITE_URL } from "@/lib/constants";
import { formatCents } from "@/lib/portal/pricing";
import QuoteDetailActions from "./QuoteDetailActions";
import RecipientEditor from "./RecipientEditor";
import {
  Badge,
  btnGhost,
  cardClass,
} from "@/components/ui/portal";

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

  let referrerOrgName: string | null = null;
  let referrerRepName: string | null = null;
  if (quote.partnerOrgId) {
    const [org] = await db
      .select({ name: partnerOrgs.name })
      .from(partnerOrgs)
      .where(eq(partnerOrgs.id, quote.partnerOrgId))
      .limit(1);
    referrerOrgName = org?.name ?? `Org #${quote.partnerOrgId}`;
    if (quote.partnerRepId) {
      const [rep] = await db
        .select({ name: partnerReps.name })
        .from(partnerReps)
        .where(eq(partnerReps.id, quote.partnerRepId))
        .limit(1);
      referrerRepName = rep?.name ?? `Rep #${quote.partnerRepId}`;
    }
  }

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
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link href="/admin/quotes" className={`${btnGhost} -ml-4`}>
          ← Quotes
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            {quote.clinicName?.trim() || quote.contactName?.trim() || quote.email}
          </h1>
          <Badge tone="neutral">
            {expired && quote.status === "active" ? "expired" : quote.status}
          </Badge>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-navy/55">{quote.email}</p>
      </div>

      <section className={`${cardClass} mb-5 p-6 sm:p-7`}>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
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

      {referrerOrgName && (
        <section className={`${cardClass} mb-5 p-6 sm:p-7`}>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Referrer
          </h2>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-navy/55">Partner</dt>
              <dd className="text-right font-medium text-navy">
                {referrerOrgName}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-navy/55">Sales rep</dt>
              <dd className="text-right font-medium text-navy">
                {referrerRepName ?? "Org only"}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-navy/50">
            The clinic that claims this quote is credited to this partner — it
            joins their network and earns them commission.
          </p>
        </section>
      )}

      <section className={`${cardClass} p-6 sm:p-7`}>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Share
        </h2>
        <div className="mb-4 break-all rounded-2xl bg-cream/80 px-4 py-3 font-mono text-xs text-navy/70 ring-1 ring-beige/80">
          {url}
        </div>
        <QuoteDetailActions
          id={quote.id}
          url={url}
          pdfUrl={`/quote/${quote.token}/pdf`}
          status={quote.status}
        />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={`${cardClass} p-6 sm:p-7`}>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
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
        <div className={`${cardClass} p-6 sm:p-7`}>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
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
        <section className={`${cardClass} mt-5 p-6 sm:p-7`}>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Intro message
          </h2>
          <p className="whitespace-pre-wrap text-sm text-navy/70">{quote.intro}</p>
        </section>
      )}

      <section className={`${cardClass} mt-5 p-6 sm:p-7`}>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
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
                <tr key={it.id} className="border-b border-beige/60 last:border-0">
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
        <p className="mt-4 text-sm text-emerald-700">
          This quote was claimed — the pricing has been applied to the clinic
          account.
        </p>
      )}
    </div>
  );
}
