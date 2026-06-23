import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, apiOrgContext } from "@/lib/partners/api-auth";
import { rateLimitKey, rateLimitHeaders } from "@/lib/security/rate-limit";
import { resolveDateRange } from "@/lib/partners/dates";
import {
  getCommissionSummary,
  getRevenueSummary,
  listPartnerTransactions,
} from "@/lib/partners/queries";
import { getRepProduction, listBookOfBusiness } from "@/lib/partners/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read-only Partner API (v1). Authenticate with `Authorization: Bearer lxpk_…`.
 * Org-scoped exactly like the partner portal's org-owner views.
 *
 *   GET /api/partner/v1/summary?range=month
 *   GET /api/partner/v1/clinics
 *   GET /api/partner/v1/transactions?range=year
 *   GET /api/partner/v1/reps
 *
 * Money is integer cents.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const auth = await authenticateApiKey(req.headers.get("authorization"));
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized — provide a valid partner API key." },
      { status: 401 },
    );
  }

  const limit = await rateLimitKey("form", `partner-api:${auth.keyId}`);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const ctx = apiOrgContext(auth.org);
  const { resource } = await params;
  const range = resolveDateRange(
    req.nextUrl.searchParams.get("range") ?? undefined,
  );
  const from = range.from;

  switch (resource) {
    case "summary": {
      const [revenue, commission] = await Promise.all([
        getRevenueSummary(ctx, from),
        getCommissionSummary(ctx, from),
      ]);
      return NextResponse.json({
        range: range.id,
        revenueCents: revenue.revenueCents,
        transactionCount: revenue.transactionCount,
        commission,
      });
    }
    case "clinics": {
      const book = await listBookOfBusiness(ctx, from);
      return NextResponse.json({
        range: range.id,
        clinics: book.map((c) => ({
          id: c.id,
          name: c.clinicName,
          stage: c.stage,
          verificationStatus: c.verificationStatus,
          repName: c.repName,
          revenueCents: c.revenueCents,
          commissionCents: c.commissionCents,
          lastActivity: c.lastTransactionDate?.toISOString() ?? null,
        })),
      });
    }
    case "transactions": {
      const txs = await listPartnerTransactions(ctx, from, 1000);
      return NextResponse.json({
        range: range.id,
        transactions: txs.map((t) => ({
          id: t.id,
          date: t.transactionDate.toISOString().slice(0, 10),
          clinicName: t.clinicName,
          repName: t.repName,
          reference: t.reference,
          revenueCents: t.revenueCents,
          commissionCents: t.ownCommissionCents,
        })),
      });
    }
    case "reps": {
      const reps = await getRepProduction(auth.org.id, from);
      return NextResponse.json({
        range: range.id,
        reps: reps.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          clinicCount: r.clinicCount,
          revenueCents: r.revenueCents,
          commissionCents: r.commissionCents,
          paidCents: r.paidCents,
          payableCents: r.payableCents,
        })),
      });
    }
    default:
      return NextResponse.json(
        { error: "Unknown resource. Use summary | clinics | transactions | reps." },
        { status: 404 },
      );
  }
}
