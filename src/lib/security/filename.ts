/**
 * Sanitizes a user-supplied filename for safe storage and Content-Disposition.
 *
 * Goals:
 *   - Strip directory traversal segments (`..`, `/`, `\`).
 *   - Remove control characters and characters that are illegal on Windows / unsafe in URLs.
 *   - Preserve the file extension when present.
 *   - Cap total length so DB columns (varchar 255) cannot overflow.
 *
 * Intent: defense-in-depth. Path safety is also enforced by always prefixing
 * uploads with a `crypto.randomUUID()` segment.
 */
export function sanitizeFilename(input: string, maxLength = 200): string {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return "file";

  // Collapse path-traversal segments and separators.
  const flat = trimmed.split(/[\\/]+/).pop() ?? "file";

  // Whitelist: letters, numbers, dot, hyphen, underscore. Collapse everything else to '-'.
  const cleaned = flat
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  // Reject any name made up entirely of dots (e.g. ".", "..", "..." ...).
  // Some filesystems treat these as the current/parent directory; even
  // when they don't, they're never a legitimate user filename.
  if (!cleaned || /^\.+$/.test(cleaned)) return "file";

  if (cleaned.length <= maxLength) return cleaned;

  // Preserve the extension when truncating.
  const dot = cleaned.lastIndexOf(".");
  if (dot > 0 && cleaned.length - dot <= 12) {
    const ext = cleaned.slice(dot);
    return cleaned.slice(0, maxLength - ext.length) + ext;
  }
  return cleaned.slice(0, maxLength);
}

/**
 * RFC 6266 / 5987 encoded value for the `filename*` parameter so that
 * non-ASCII filenames render correctly without exposing raw bytes.
 */
export function encodeContentDispositionFilename(filename: string): string {
  const safe = sanitizeFilename(filename);
  return `attachment; filename="${safe.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}
