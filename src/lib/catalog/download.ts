import { createHash, timingSafeEqual } from "node:crypto";
import { fetchWithTimeout } from "@/lib/http/fetch";

/**
 * Private catalog PDF download — configuration + access-token verification.
 *
 * The 2026 catalog is a ~34 MB PDF hosted in Vercel Blob (uploaded once via
 * `scripts/upload-catalog.ts`). It is downloadable only through the unlisted
 * `/download/catalog?key=…` route, which is handed out as a private share link
 * and never linked from the public site.
 *
 * Two env vars drive it:
 *   - `CATALOG_PDF_URL`        → the (unguessable) Vercel Blob URL of the PDF.
 *   - `CATALOG_DOWNLOAD_TOKEN` → the high-entropy secret required as `?key=`.
 *
 * Rotating `CATALOG_DOWNLOAD_TOKEN` instantly revokes every outstanding link.
 *
 * Both the token and the blob URL are server-only: the route streams the file
 * through itself, so a recipient only ever sees the branded download URL.
 */

export interface CatalogDownloadConfig {
  /** Secret required in the `?key=` query param, or `null` when unset. */
  token: string | null;
  /** Vercel Blob (or any HTTP) URL of the catalog PDF, or `null` when unset. */
  pdfUrl: string | null;
  /**
   * Optional cover-image URL shown on the download landing page. Falls back to
   * a styled placeholder when unset.
   */
  coverUrl: string | null;
  /**
   * Optional URL of the flipbook `manifest.json` (built by
   * `scripts/build-flipbook.ts`). When set, the landing page shows a
   * "View online" button linking to the page-flip viewer.
   */
  flipbookUrl: string | null;
}

/** Filename presented to the browser on download. */
export const CATALOG_DOWNLOAD_FILENAME = "Logos-RX-Catalog-2026.pdf";

/** Reads the catalog-download configuration from the environment. */
export function getCatalogDownloadConfig(
  env: NodeJS.ProcessEnv = process.env,
): CatalogDownloadConfig {
  const token = env.CATALOG_DOWNLOAD_TOKEN?.trim();
  const pdfUrl = env.CATALOG_PDF_URL?.trim();
  const coverUrl = env.CATALOG_COVER_URL?.trim();
  const flipbookUrl = env.CATALOG_FLIPBOOK_URL?.trim();
  return {
    token: token && token.length > 0 ? token : null,
    pdfUrl: pdfUrl && pdfUrl.length > 0 ? pdfUrl : null,
    coverUrl: coverUrl && coverUrl.length > 0 ? coverUrl : null,
    flipbookUrl: flipbookUrl && flipbookUrl.length > 0 ? flipbookUrl : null,
  };
}

/** Shape of the flipbook `manifest.json` produced by `scripts/build-flipbook.ts`. */
export interface FlipbookManifest {
  version: number;
  pageCount: number;
  pages: string[];
}

/**
 * Fetches and validates the flipbook manifest. Returns the ordered page image
 * URLs, or `null` when the manifest is unset, unreachable, or malformed (so the
 * viewer can fail gracefully to a 404 rather than a broken page).
 */
export async function getFlipbookPages(
  manifestUrl: string | null,
): Promise<string[] | null> {
  if (!manifestUrl) return null;
  try {
    const res = await fetchWithTimeout(manifestUrl, {
      next: { revalidate: 300 },
    } as RequestInit);
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<FlipbookManifest>;
    const pages = data.pages;
    if (!Array.isArray(pages) || pages.length === 0) return null;
    return pages.filter((p): p is string => typeof p === "string" && p.length > 0);
  } catch {
    return null;
  }
}

/**
 * Constant-time equality. Hashing both inputs to a fixed 32-byte digest before
 * `timingSafeEqual` keeps the comparison constant-time even when the supplied
 * value differs in length from the secret (which would otherwise throw / leak
 * length via an early return).
 */
function constantTimeEquals(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a, "utf8").digest();
  const bh = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ah, bh);
}

/**
 * Verifies a caller-supplied token against the configured secret.
 *
 * Fails **closed**: returns `false` when either the provided value or the
 * configured secret is missing/empty, so a misconfigured deployment (no token
 * set) denies access rather than letting everyone through.
 */
export function verifyCatalogToken(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;
  return constantTimeEquals(provided, expected);
}
