export const dynamic = "force-dynamic";

import Link from "next/link";
import { getPartnerContext } from "@/lib/auth/partner";
import { listQuotesForPartner, isQuoteExpired } from "@/lib/quotes/data";
import type { PricingQuote } from "@/lib/db/schema";
import {
  Badge,
  type BadgeTone,
  PageHeader,
  EmptyState,
  btnAccent,
  btnGhost,
  tableWrapClass,
  theadClass,
  rowClass,
} from "@/components/ui/portal";
import PartnerNoAccess from "../PartnerNoAccess";

function statusLabel(q: PricingQuote): { text: string; tone: BadgeTone } {
  if (q.status === "claimed") return { text: "Claimed", tone: "success" };
  if (q.status === "revoked") return { text: "Revoked", tone: "neutral" };
  if (isQuoteExpired(q)) return { text: "Expired", tone: "warning" };
  if (q.status === "accepted") return { text: "Accepted", tone: "neutral" };
  return { text: "Active", tone: "accent" };
}

function fmtDate(d: Date | null): string {
  return d
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

export default async function PartnerQuotesPage() {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  const canCreate = ctx.org.compensationModel === "margin";

  const quotes = await listQuotesForPartner({
    orgId: ctx.org.id,
    repId: ctx.kind === "rep" ? ctx.rep!.id : null,
  });

  // Commission-model orgs can't author quotes, but they can still receive
  // referral quotes created by Logos RX on their behalf. Only when they have
  // none do we explain that pricing is managed by Logos RX.
  if (!canCreate && quotes.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Partner Portal" title="Pricing Quotes" />
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="Pricing is managed by Logos RX"
            body="Custom pricing quotes are available on the wholesale/margin model. Your organization earns a commission percentage, so pricing is managed by Logos RX. Any quote Logos RX creates and credits to you will appear here — meanwhile, use your referral links to onboard clinics."
            action={
              <Link href="/partners/links" className={btnGhost}>
                Go to referral links →
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Partner Portal"
        title="Pricing Quotes"
        description={
          canCreate
            ? "Send a prospective clinic a password-gated custom price list. Clinics that accept are added to your network automatically."
            : "Quotes Logos RX created and credited to you. Clinics that accept are added to your network automatically."
        }
        actions={
          canCreate ? (
            <Link href="/partners/quotes/new" className={btnAccent}>
              + New quote
            </Link>
          ) : undefined
        }
      />

      {quotes.length === 0 ? (
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="No quotes yet"
            body="Create one to send a clinic their custom pricing."
          />
        </div>
      ) : (
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Recipient</th>
                <th className="px-5 py-4 font-semibold">Items</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const badge = statusLabel(q);
                return (
                  <tr key={q.id} className={rowClass}>
                    <td className="px-5 py-4">
                      <Link href={`/partners/quotes/${q.id}`} className="block">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-navy">
                            {q.clinicName?.trim() || q.contactName?.trim() || "—"}
                          </span>
                          {q.adminReferral && (
                            <span className="inline-flex rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-navy/55">
                              via Logos RX
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-navy/50">{q.email}</div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-navy/70">{q.itemCount}</td>
                    <td className="px-5 py-4">
                      <Badge tone={badge.tone}>{badge.text}</Badge>
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
