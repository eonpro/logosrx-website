export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPartnerContext } from "@/lib/auth/partner";
import { getPartnerQuoteWithItems, isQuoteExpired } from "@/lib/quotes/data";
import { SITE_URL } from "@/lib/constants";
import { formatCents } from "@/lib/portal/pricing";
import { Badge, btnGhost } from "@/components/ui/portal";
import PartnerNoAccess from "../../PartnerNoAccess";
import PartnerQuoteActions from "./PartnerQuoteActions";

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

export default async function PartnerQuoteDetailPage({ params }: PageProps) {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  const { id } = await params;
  const quoteId = Number(id);
  if (!Number.isInteger(quoteId) || quoteId <= 0) notFound();

  const data = await getPartnerQuoteWithItems(quoteId, {
    orgId: ctx.org.id,
    repId: ctx.kind === "rep" ? ctx.rep!.id : null,
  });
  if (!data) notFound();

  const { quote, items } = data;
  const url = `${SITE_URL}/quote/${quote.token}`;

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
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link href="/partners/quotes" className={`${btnGhost} -ml-4`}>
          ← Quotes
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            {quote.clinicName?.trim() || quote.contactName?.trim() || quote.email}
          </h1>
          <Badge tone="neutral">
            {isQuoteExpired(quote) && quote.status === "active"
              ? "expired"
              : quote.status}
          </Badge>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-navy/55">{quote.email}</p>
      </div>

      <section className="rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Share
        </h2>
        <div className="mb-4 break-all rounded-xl bg-cream/60 px-3 py-2 font-mono text-xs text-navy/70">
          {url}
        </div>
        {quote.adminReferral ? (
          <p className="text-xs text-navy/55">
            This quote was created by Logos RX and credited to you. You can copy
            the link, but it&apos;s managed by Logos RX.
          </p>
        ) : (
          <PartnerQuoteActions id={quote.id} url={url} status={quote.status} />
        )}
      </section>

      <section className="mt-5 rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Timeline
        </h2>
        <dl className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
          {timeline.map((t) => (
            <div key={t.label} className="flex justify-between gap-3">
              <dt className="text-navy/55">{t.label}</dt>
              <dd className="text-right font-medium text-navy">{t.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {quote.intro?.trim() && (
        <section className="mt-5 rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Intro message
          </h2>
          <p className="whitespace-pre-wrap text-sm text-navy/70">{quote.intro}</p>
        </section>
      )}

      <section className="mt-5 rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Quoted products ({items.length})
        </h2>
        <table className="w-full text-left text-sm">
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-beige/50 last:border-0">
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
      </section>

      {quote.status === "claimed" && (
        <p className="mt-4 text-sm text-green-700">
          This quote was claimed — the clinic was added to your network with this
          pricing applied.
        </p>
      )}
    </div>
  );
}
