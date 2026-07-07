export const dynamic = "force-dynamic";

import Link from "next/link";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { listQuotes, isQuoteExpired } from "@/lib/quotes/data";
import type { PricingQuote } from "@/lib/db/schema";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  btnAccent,
  rowClass,
  tableWrapClass,
  theadClass,
  type BadgeTone,
} from "@/components/ui/portal";

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

export default async function QuotesPage() {
  const ctx = await requireAdmin();
  const canEdit = ctx.role === ADMIN_ROLE;
  const quotes = await listQuotes();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Admin"
        title="Pricing Quotes"
        description="Password-gated custom pricing links for prospective clinics."
        actions={
          canEdit ? (
            <Link href="/admin/quotes/new" className={btnAccent}>
              + New quote
            </Link>
          ) : undefined
        }
      />

      {quotes.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            title="No quotes yet"
            body="Create one to send a clinic their custom pricing."
          />
        </Card>
      ) : (
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Recipient</th>
                <th className="px-5 py-4 font-semibold">Items</th>
                <th className="px-5 py-4 font-semibold">Pricing</th>
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
