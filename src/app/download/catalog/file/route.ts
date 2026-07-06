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

  // Sanity-check the first bytes are actually a PDF before labeling the
  // response `application/pdf` — a misconfigured CATALOG_PDF_URL (or a
  // replaced blob) would otherwise ship arbitrary bytes as a trusted PDF.
  // Peek only the first chunk so the ~34 MB still streams through.
  const reader = upstream.body.getReader();
  const first = await reader.read().catch(() => null);
  if (!first || first.done || !startsWithPdfMagic(first.value)) {
    reader.cancel().catch(() => {});
    log.error("catalog file: upstream content is not a PDF", {
      status: upstream.status,
      contentType: upstream.headers.get("content-type"),
    });
    return new NextResponse("Catalog is temporarily unavailable.", {
      status: 502,
    });
  }

  // Re-attach the peeked chunk in front of the remaining stream.
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(first.value);
    },
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${CATALOG_DOWNLOAD_FILENAME}"`,
    // Private, link-gated content — never cache on shared CDNs.
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new NextResponse(body, { status: 200, headers });
}

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

function startsWithPdfMagic(chunk: Uint8Array): boolean {
  if (chunk.length < PDF_MAGIC.length) return false;
  return PDF_MAGIC.every((b, i) => chunk[i] === b);
}
