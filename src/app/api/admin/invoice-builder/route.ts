import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLE, ForbiddenError, requireAdmin } from "@/lib/auth/admin";
import { checkSameOrigin } from "@/lib/security/origin";
import { recordAdminAudit } from "@/lib/audit/log";
import { log } from "@/lib/observability/logger";
import { parseInvoiceCsv } from "@/lib/invoices/csv";
import { renderInvoicePdf } from "@/lib/invoices/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB of CSV ≈ tens of thousands of rows

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function defaultInvoiceNumber(now: Date): string {
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LRX-${ymd}-${rand}`;
}

function pdfFilename(clientName: string, invoiceNumber: string): string {
  const base = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `logos-rx-invoice-${base || "client"}-${invoiceNumber.toLowerCase()}.pdf`;
}

/**
 * Admin-only invoice builder: takes the LifeFile-style shipment report CSV
 * plus client name / date of service / total and returns a Logos RX–branded
 * invoice PDF whose "Attachment A" pages itemize every CSV transaction.
 *
 * Stateless by design — nothing is persisted; the PDF streams straight back
 * to the admin's browser as a download. (Patient PII stays out of our store.)
 */
export async function POST(req: NextRequest) {
  try {
    if (!checkSameOrigin(req).ok) {
      return bad("Forbidden", 403);
    }
    const ctx = await requireAdmin({ minRole: ADMIN_ROLE });

    const formData = await req.formData();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return bad("Attach the transactions CSV file.");
    }
    if (file.size > MAX_FILE_SIZE) {
      return bad("CSV must be under 5 MB.");
    }

    const clientName = String(formData.get("clientName") ?? "")
      .trim()
      .slice(0, 160);
    if (!clientName) {
      return bad("Enter the client name.");
    }

    const dateOfService = String(formData.get("dateOfService") ?? "")
      .trim()
      .slice(0, 80);
    if (!dateOfService) {
      return bad("Enter the date of service.");
    }

    const totalRaw = String(formData.get("totalDollars") ?? "").trim();
    const totalDollars = Number(totalRaw.replace(/[$,\s]/g, ""));
    if (!totalRaw || !Number.isFinite(totalDollars) || totalDollars < 0) {
      return bad("Enter a valid invoice total.");
    }

    const invoiceNumber =
      String(formData.get("invoiceNumber") ?? "")
        .trim()
        .slice(0, 40) || defaultInvoiceNumber(new Date());

    const notes =
      String(formData.get("notes") ?? "").trim().slice(0, 500) || null;

    const parsed = parseInvoiceCsv(await file.text());
    if (parsed.rows.length === 0) {
      return bad(
        parsed.errors[0] ?? "No transactions found in the CSV file.",
      );
    }
    if (parsed.errors.length > 0) {
      return bad(
        `The CSV has ${parsed.errors.length} problem row(s). First: ${parsed.errors[0]}`,
      );
    }

    const totalCents = Math.round(totalDollars * 100);
    const pdf = await renderInvoicePdf({
      invoiceNumber,
      clientName,
      dateOfService,
      issuedAt: new Date(),
      totalCents,
      notes,
      transactions: parsed.rows,
    });

    await recordAdminAudit(
      ctx,
      "invoice.generate",
      { type: "invoice", id: invoiceNumber },
      {
        clientName,
        dateOfService,
        totalCents,
        transactionCount: parsed.rows.length,
        csvTotalCents: parsed.totalCents,
      },
    );

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFilename(clientName, invoiceNumber)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    log.error("admin invoice generation failed", { error: err });
    return bad("Invoice generation failed. Please try again.", 500);
  }
}
