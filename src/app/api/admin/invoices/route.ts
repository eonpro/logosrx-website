import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";
import { ADMIN_ROLE, ForbiddenError, requireAdmin } from "@/lib/auth/admin";
import { checkSameOrigin } from "@/lib/security/origin";
import { detectPdfMime } from "@/lib/security/file-type";
import { sanitizeFilename } from "@/lib/security/filename";
import { recordAdminAudit } from "@/lib/audit/log";
import { log } from "@/lib/observability/logger";
import {
  createTransactionWithCommission,
  DuplicateReferenceError,
  TransactionError,
} from "@/lib/partners/transactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseDollars(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Admin-only invoice upload: attaches a pharmacy invoice PDF to an attributed
 * clinic and records the sale as a partner transaction, generating commission
 * ledger entries so the clinic's sales rep gets credit automatically.
 *
 * The PDF is verified by magic bytes and stored in a private Vercel Blob;
 * admins retrieve it via `GET /api/admin/invoices/[id]` (streamed, never a
 * public URL — invoices contain patient PII).
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
      return bad("Attach the invoice PDF.");
    }
    if (file.size > MAX_FILE_SIZE) {
      return bad("Invoice must be under 15 MB.");
    }
    // Trust the bytes, not the browser-declared type: a renamed .exe must not
    // land in the store even though only admins can download it back.
    const verifiedType = await detectPdfMime(file);
    if (!verifiedType) {
      return bad("Invoice must be a valid PDF file.");
    }

    const clinicId = Number.parseInt(String(formData.get("clinicId") ?? ""), 10);
    if (!Number.isFinite(clinicId) || clinicId <= 0) {
      return bad("Select a clinic.");
    }

    const date = new Date(String(formData.get("dateIso") ?? ""));
    if (Number.isNaN(date.getTime())) {
      return bad("Enter a valid invoice date.");
    }

    const amountDollars = parseDollars(formData.get("amountDollars"));
    if (amountDollars == null) {
      return bad("Enter a valid invoice total.");
    }

    const costRaw = formData.get("costDollars");
    let costCents: number | null = null;
    if (typeof costRaw === "string" && costRaw.trim() !== "") {
      const costDollars = parseDollars(costRaw);
      if (costDollars == null) return bad("Enter a valid cost amount.");
      costCents = Math.round(costDollars * 100);
    }

    const description =
      String(formData.get("description") ?? "").trim().slice(0, 300) || null;
    const reference =
      String(formData.get("reference") ?? "").trim().slice(0, 120) || null;

    const safeName = sanitizeFilename(file.name);
    // Random UUID prefix prevents path enumeration; the original (sanitized)
    // filename is kept as a leaf so downloads carry a meaningful name.
    const pathname = `invoices/${randomUUID()}/${safeName}`;

    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: verifiedType,
      // Reviewed by humans, not refetched in hot loops.
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });

    let transactionId: number;
    try {
      transactionId = await createTransactionWithCommission({
        clinicId,
        date,
        revenueCents: Math.round(amountDollars * 100),
        costCents,
        description,
        reference,
        source: "invoice",
        invoicePathname: blob.pathname,
        invoiceFilename: safeName,
        createdBy: ctx.userId,
      });
    } catch (err) {
      // The blob upload already succeeded; without this compensating delete a
      // failed insert would leave an unreferenced private blob behind forever.
      await del(blob.url).catch(() => {});
      if (err instanceof DuplicateReferenceError) {
        return bad("A transaction with this reference already exists.", 409);
      }
      if (err instanceof TransactionError) {
        return bad(err.message);
      }
      throw err;
    }

    await recordAdminAudit(ctx, "partner.invoice_upload", {
      type: "clinic",
      id: clinicId,
    }, {
      transactionId,
      revenueCents: Math.round(amountDollars * 100),
      costCents,
      reference,
    });

    return NextResponse.json(
      { success: true, transactionId },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    log.error("admin invoice upload failed", { error: err });
    return bad("Upload failed. Please try again.", 500);
  }
}
