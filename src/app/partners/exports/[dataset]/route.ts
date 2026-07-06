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

/** Hard caps so a single export can't hold a connection open indefinitely. */
const TRANSACTIONS_EXPORT_LIMIT = 5000;
const BOOK_EXPORT_LIMIT = 1000; // enforced inside listBookOfBusiness

/**
 * Visible truncation marker. Appended as a final row (and mirrored in a
 * response header) so a partner reconciling against the file knows the tail
 * is missing instead of silently trusting an incomplete export.
 */
function truncationRow(columns: number, limit: number): (string | number)[] {
  const row = new Array<string | number>(columns).fill("");
  row[0] = `NOTE: export truncated at ${limit} rows — narrow the date range to get the rest.`;
  return row;
}

function csvResponse(
  filename: string,
  csv: string,
  truncated = false,
): NextResponse {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      ...(truncated ? { "X-Export-Truncated": "true" } : {}),
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
    const truncated = rows.length >= BOOK_EXPORT_LIMIT;
    const headers = [
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
    ];
    const body: (string | number)[][] = rows.map((r) => [
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
    ]);
    if (truncated) body.push(truncationRow(headers.length, BOOK_EXPORT_LIMIT));
    return csvResponse("book-of-business.csv", toCsv(headers, body), truncated);
  }

  if (dataset === "transactions") {
    // Fetch one extra row so truncation is detected exactly.
    const fetched = await listPartnerTransactions(
      ctx,
      from,
      TRANSACTIONS_EXPORT_LIMIT + 1,
    );
    const truncated = fetched.length > TRANSACTIONS_EXPORT_LIMIT;
    const rows = truncated
      ? fetched.slice(0, TRANSACTIONS_EXPORT_LIMIT)
      : fetched;
    const headers = [
      "Date",
      "Company",
      ...(ctx.kind === "org" ? ["Rep"] : []),
      "Reference",
      "Description",
      "Revenue",
      "Your commission",
    ];
    const body: (string | number)[][] = rows.map((r) => [
      isoDate(r.transactionDate),
      r.clinicName ?? "",
      ...(ctx.kind === "org" ? [r.repName ?? "Organization"] : []),
      r.reference ?? "",
      r.description ?? "",
      centsToDollarString(r.revenueCents),
      centsToDollarString(r.ownCommissionCents),
    ]);
    if (truncated) {
      body.push(truncationRow(headers.length, TRANSACTIONS_EXPORT_LIMIT));
    }
    return csvResponse("transactions.csv", toCsv(headers, body), truncated);
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
