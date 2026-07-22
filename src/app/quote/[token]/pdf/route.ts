import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/admin";
import { getPartnerContext } from "@/lib/auth/partner";
import { getQuoteWithItemsByToken, isQuoteOpenable } from "@/lib/quotes/data";
import { QUOTE_ACCESS_COOKIE, verifyQuoteAccess } from "@/lib/quotes/crypto";
import { buildCatalogLookups } from "@/lib/quotes/lookups";
import { renderQuotePdf } from "@/lib/quotes/pdf";
import type { PricingQuote } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pdfFilename(quote: PricingQuote): string {
  const base = (quote.clinicName?.trim() || "pricing")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `logos-rx-quote-${base || "pricing"}.pdf`;
}

/**
 * Downloadable, branded PDF of a quote (`GET /quote/<token>/pdf`).
 *
 * Access mirrors the on-screen views:
 *   - Recipient: must hold a valid password-derived access cookie, and the
 *     quote must still be openable (not claimed/revoked/expired).
 *   - Admin: always allowed (they manage the quote).
 *   - Partner: allowed for quotes they own (org scope; reps only their own).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const data = await getQuoteWithItemsByToken(token);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { quote, items } = data;

  const clean = token.trim().toLowerCase();
  const hasRecipientAccess =
    verifyQuoteAccess(req.cookies.get(QUOTE_ACCESS_COOKIE)?.value, clean) &&
    isQuoteOpenable(quote);

  let allowed = hasRecipientAccess;
  if (!allowed) {
    allowed = Boolean(await getAdminContext());
  }
  if (!allowed && quote.partnerOrgId) {
    const partner = await getPartnerContext();
    if (
      partner &&
      partner.org.id === quote.partnerOrgId &&
      (partner.kind !== "rep" || partner.rep?.id === quote.partnerRepId)
    ) {
      allowed = true;
    }
  }
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lookups = await buildCatalogLookups();
  const pdf = await renderQuotePdf(quote, items, lookups);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename(quote)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
