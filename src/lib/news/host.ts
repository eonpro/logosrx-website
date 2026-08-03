/**
 * Host helpers for the Logos RX newsroom subdomain.
 *
 * Production: `news.logosrx.com`
 * Local: `news.localhost` (browsers map *.localhost → 127.0.0.1)
 */

export function normalizeHost(host: string): string {
  return host.split(":")[0]!.toLowerCase();
}

/** True when the request should serve the newsroom surface. */
export function isNewsHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const h = normalizeHost(host);
  return h === "news.logosrx.com" || h === "news.localhost";
}

/** Internal App Router mount (must not start with `_` — Next treats those as private). */
export const NEWS_INTERNAL_MOUNT = "/news-site";

/**
 * Map a public news-host pathname to the internal App Router mount.
 * Returns null when the path should not be rewritten (assets, sitemap, etc.).
 */
export function rewriteNewsPath(pathname: string): string | null {
  if (pathname === "/" || pathname === "") return NEWS_INTERNAL_MOUNT;
  if (pathname === "/newsroom" || pathname.startsWith("/newsroom/")) {
    return `${NEWS_INTERNAL_MOUNT}${pathname}`;
  }
  return null;
}

/** Convert an internal `/news-site…` path to the public news-host path. */
export function newsPublicPath(internalPath: string): string {
  if (
    internalPath === NEWS_INTERNAL_MOUNT ||
    internalPath === `${NEWS_INTERNAL_MOUNT}/`
  ) {
    return "/";
  }
  if (internalPath.startsWith(`${NEWS_INTERNAL_MOUNT}/`)) {
    return internalPath.slice(NEWS_INTERNAL_MOUNT.length) || "/";
  }
  return internalPath;
}
