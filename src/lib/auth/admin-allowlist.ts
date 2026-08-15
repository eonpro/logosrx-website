/**
 * Email allowlist for the admin portal. Edge-safe (no Clerk, no React) so
 * `src/proxy.ts` can gate `/admin` without a Node round-trip.
 *
 *   - `ADMIN_EMAILS`        → full admins
 *   - `ADMIN_VIEWER_EMAILS` → read-only viewers
 */

export const ADMIN_ROLE = "admin" as const;
export const VIEWER_ROLE = "viewer" as const;

export type AdminRole = typeof ADMIN_ROLE | typeof VIEWER_ROLE;

function parseEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(/[,\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

const ADMIN_EMAILS = parseEmails(process.env.ADMIN_EMAILS);
const VIEWER_EMAILS = parseEmails(process.env.ADMIN_VIEWER_EMAILS);

/** Returns the role for an email if allowlisted, else `null`. */
export function roleForEmail(
  email: string | null | undefined,
): AdminRole | null {
  if (!email) return null;
  const e = email.trim().toLowerCase();
  if (ADMIN_EMAILS.has(e)) return ADMIN_ROLE;
  if (VIEWER_EMAILS.has(e)) return VIEWER_ROLE;
  return null;
}
