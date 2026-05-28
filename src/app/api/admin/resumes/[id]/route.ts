import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";
import { employmentApplications } from "@/lib/db/schema";
import { ForbiddenError, requireAdmin } from "@/lib/auth/admin";
import { encodeContentDispositionFilename } from "@/lib/security/filename";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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
        resumePathname: employmentApplications.resumePathname,
        resumeFilename: employmentApplications.resumeFilename,
        resumeContentType: employmentApplications.resumeContentType,
      })
      .from(employmentApplications)
      .where(eq(employmentApplications.id, id))
      .limit(1);

    if (!row?.resumePathname) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const result = await get(row.resumePathname, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const filename = row.resumeFilename ?? "resume";
    const contentType =
      row.resumeContentType ?? result.blob.contentType ?? "application/octet-stream";

    return new Response(result.stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(result.blob.size),
        "Content-Disposition": encodeContentDispositionFilename(filename),
        // Defense in depth — the global header sets this too, but the Blob
        // response goes through a streaming proxy so we re-assert it here.
        "X-Content-Type-Options": "nosniff",
        // Resume files are PII; never cache at the edge or in the browser.
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
    console.error("[api/admin/resumes/:id] download failed");
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
