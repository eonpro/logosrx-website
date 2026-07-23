import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";
import { partnerTransactions } from "@/lib/db/schema";
import { ForbiddenError, requireAdmin } from "@/lib/auth/admin";
import { encodeContentDispositionFilename } from "@/lib/security/filename";
import { log } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Streams the invoice PDF attached to a partner transaction. Admin-only:
 * invoices contain patient names and order details (PII/PHI), so the blob is
 * private and this proxy is the only way to read it.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { id: idParam } = await context.params;
    const id = Number.parseInt(idParam, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const [row] = await db
      .select({
        invoicePathname: partnerTransactions.invoicePathname,
        invoiceFilename: partnerTransactions.invoiceFilename,
      })
      .from(partnerTransactions)
      .where(eq(partnerTransactions.id, id))
      .limit(1);

    if (!row?.invoicePathname) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const result = await get(row.invoicePathname, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const filename = row.invoiceFilename ?? "invoice.pdf";

    return new Response(result.stream, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(result.blob.size),
        "Content-Disposition": encodeContentDispositionFilename(filename),
        // Defense in depth — the global header sets this too, but the Blob
        // response goes through a streaming proxy so we re-assert it here.
        "X-Content-Type-Options": "nosniff",
        // Invoices carry patient PII; never cache at the edge or in the browser.
        "Cache-Control": "private, no-store, max-age=0",
        // Block embedding (e.g. PDF viewers in a hostile iframe).
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
        "X-Frame-Options": "DENY",
        Vary: "Cookie, Authorization",
      },
    });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    log.error("admin invoice download failed", { error: err });
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
