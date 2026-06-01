import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Admin access is gated by an email allowlist (no Clerk Organizations required).
 *
 * Configure via env vars (comma- or whitespace-separated, case-insensitive):
 *   - `ADMIN_EMAILS`        → full admins (can approve/reject clinics, etc.)
 *   - `ADMIN_VIEWER_EMAILS` → read-only "viewers" (optional)
 *
 * A user signs in at `/admin/sign-in` with their normal Clerk account; if their
 * primary email is on the allowlist, they're let into `/admin`.
 */

/** Logical roles kept for API compatibility with existing call sites. */
export const ADMIN_ROLE = "admin" as const;
export const VIEWER_ROLE = "viewer" as const;

export type AdminRole = typeof ADMIN_ROLE | typeof VIEWER_ROLE;

export interface AdminContext {
  userId: string;
  email: string;
  role: AdminRole;
}

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
export function roleForEmail(email: string | null | undefined): AdminRole | null {
  if (!email) return null;
  const e = email.trim().toLowerCase();
  if (ADMIN_EMAILS.has(e)) return ADMIN_ROLE;
  if (VIEWER_EMAILS.has(e)) return VIEWER_ROLE;
  return null;
}

/** Fetches the user's primary email address from Clerk. */
export async function getPrimaryEmail(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primary =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
      user.emailAddresses[0];
    return primary?.emailAddress ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns the admin context if the current request belongs to an authenticated
 * user whose email is on the allowlist. Returns `null` otherwise.
 *
 * Read-only check; safe to call inside `loading.tsx` / server components.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const email = await getPrimaryEmail(userId);
  const role = roleForEmail(email);
  if (!email || !role) return null;

  return { userId, email, role };
}

/**
 * Strict variant for server actions, route handlers, and admin-only mutations.
 * Throws `ForbiddenError` if the caller is not an allowlisted admin. The thrown
 * error message is intentionally generic so it can be safely surfaced.
 */
export async function requireAdmin(
  options: { minRole?: AdminRole } = {},
): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) throw new ForbiddenError();

  const minRole = options.minRole ?? VIEWER_ROLE;
  if (minRole === ADMIN_ROLE && ctx.role !== ADMIN_ROLE) {
    throw new ForbiddenError();
  }
  return ctx;
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("forbidden");
    this.name = "ForbiddenError";
  }
}
