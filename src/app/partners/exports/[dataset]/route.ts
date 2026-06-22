import { NextRequest, NextResponse } from "next/server";
import { getPartnerContext } from "@/lib/auth/partner";
import { resolveDateRange } from "@/lib/partners/dates";
import { listBookOfBusiness, getRepProduction } from "@/lib/partners/crm";
import { listPartnerTransactions } from "@/lib/partners/queries";
import { centsToDollarString, toCsv } from "@/lib/partners/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  active: "Active",
  at_risk: "At risk",
  dormant: "Dormant",
};

function isoDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

function csvResponse(filename: string, csv: string): NextResponse {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Scoped CSV exports for the partner portal. The viewer's identity (org owner
 * vs rep) limits the rows exactly like the on-screen views; `?range=` reuses
 * the dashboard date presets.
 *
 *   /partners/exports/book?range=year
 *   /partners/exports/transactions
 *   /partners/exports/reps           (org owners only)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dataset: string }> },
) {
  const ctx = await getPartnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { dataset } = await params;
  const range = resolveDateRange(
    req.nextUrl.searchParams.get("range") ?? undefined,
  );
  const from = range.from;

  if (dataset === "book") {
    const rows = await listBookOfBusiness(ctx, from);
    const csv = toCsv(
      [
        "Company",
        "Contact",
        "Email",
        ...(ctx.kind === "org" ? ["Rep"] : []),
        "Stage",
        "Verification",
        "Revenue",
        "Commission",
        "Transactions",
        "Last activity",
        "Joined",
      ],
      rows.map((r) => [
        r.clinicName ?? "",
        r.contactName ?? "",
        r.contactEmail ?? "",
        ...(ctx.kind === "org" ? [r.repName ?? "Organization"] : []),
        STAGE_LABELS[r.stage] ?? r.stage,
        r.verificationStatus,
        centsToDollarString(r.revenueCents),
        centsToDollarString(r.commissionCents),
        r.txCount,
        isoDate(r.lastTransactionDate),
        isoDate(r.createdAt),
      ]),
    );
    return csvResponse("book-of-business.csv", csv);
  }

  if (dataset === "transactions") {
    const rows = await listPartnerTransactions(ctx, from, 5000);
    const csv = toCsv(
      [
        "Date",
        "Company",
        ...(ctx.kind === "org" ? ["Rep"] : []),
        "Reference",
        "Description",
        "Revenue",
        "Your commission",
      ],
      rows.map((r) => [
        isoDate(r.transactionDate),
        r.clinicName ?? "",
        ...(ctx.kind === "org" ? [r.repName ?? "Organization"] : []),
        r.reference ?? "",
        r.description ?? "",
        centsToDollarString(r.revenueCents),
        centsToDollarString(r.ownCommissionCents),
      ]),
    );
    return csvResponse("transactions.csv", csv);
  }

  if (dataset === "reps") {
    if (ctx.kind !== "org") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const rows = await getRepProduction(ctx.org.id, from);
    const csv = toCsv(
      [
        "Rep",
        "Email",
        "Status",
        "Companies",
        "Revenue",
        "Commission",
        "Paid",
        "Payable",
      ],
      rows.map((r) => [
        r.name,
        r.email,
        r.status,
        r.clinicCount,
        centsToDollarString(r.revenueCents),
        centsToDollarString(r.commissionCents),
        centsToDollarString(r.paidCents),
        centsToDollarString(r.payableCents),
      ]),
    );
    return csvResponse("rep-production.csv", csv);
  }

  return NextResponse.json({ error: "Unknown dataset" }, { status: 404 });
}
