import { NextRequest, NextResponse } from "next/server";
import {
  CATALOG_DOWNLOAD_FILENAME,
  getCatalogDownloadConfig,
  verifyCatalogToken,
} from "@/lib/catalog/download";
import { rateLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { log } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Private catalog file stream.
 *
 *   GET /download/catalog/file?key=<CATALOG_DOWNLOAD_TOKEN>
 *
 * The actual PDF bytes behind the `/download/catalog` info page's "Download"
 * button. Same token gate as the page; rotating `CATALOG_DOWNLOAD_TOKEN`
 * revokes every outstanding link.
 *
 * The PDF lives in Vercel Blob (see `scripts/upload-catalog.ts`). We stream the
 * upstream body straight through so (a) the ~34 MB never buffers in function
 * memory and (b) the unguessable blob URL is never exposed to the client — the
 * recipient only ever sees this branded URL and a clean filename.
 */
export async function GET(req: NextRequest) {
  // Throttle so the token can't be brute-forced. Token entropy already makes
  // guessing infeasible; this is defense-in-depth + a noisy-neighbor guard.
  const limit = await rateLimit("download", req);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const { token, pdfUrl } = getCatalogDownloadConfig();

  // Fail closed: an unconfigured deployment denies access rather than 404-ing
  // in a way that distinguishes "no file" from "wrong key".
  if (!token || !pdfUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  const provided = req.nextUrl.searchParams.get("key");
  if (!verifyCatalogToken(provided, token)) {
    // Generic 404 (not 401/403) so the endpoint's existence isn't advertised
    // to anyone probing without the correct key.
    return new NextResponse("Not found", { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(pdfUrl, { cache: "no-store" });
  } catch (err) {
    log.error("catalog file: failed to reach blob storage", { error: err });
    return new NextResponse("Catalog is temporarily unavailable.", {
      status: 502,
    });
  }

  if (!upstream.ok || !upstream.body) {
    log.error("catalog file: upstream returned no body", {
      status: upstream.status,
    });
    return new NextResponse("Catalog is temporarily unavailable.", {
      status: 502,
    });
  }

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${CATALOG_DOWNLOAD_FILENAME}"`,
    // Private, link-gated content — never cache on shared CDNs.
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new NextResponse(upstream.body, { status: 200, headers });
}
