import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { emailFromSessionClaims } from "./admin-claims";
import { fetchClerkPrimaryEmail } from "./clerk-primary-email";
import {
  ADMIN_ROLE,
  VIEWER_ROLE,
  roleForEmail,
  type AdminRole,
} from "./admin-allowlist";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_HEADER,
  verifyAdminSession,
} from "./admin-session";

export { emailFromSessionClaims } from "./admin-claims";
export { ADMIN_ROLE, VIEWER_ROLE, roleForEmail };
export type { AdminRole };

/**
 * Admin access is gated by an email allowlist (no Clerk Organizations required).
 *
 * The proxy (`src/proxy.ts`) is the auth authority: it resolves identity once
 * per request (JWT claim → signed cookie → one Clerk lookup), allowlists it,
 * and forwards a signed session token. This module verifies that token.
 *
 * Configure via env vars (comma- or whitespace-separated, case-insensitive):
 *   - `ADMIN_EMAILS`        → full admins
 *   - `ADMIN_VIEWER_EMAILS` → read-only viewers
 */

export interface AdminContext {
  userId: string;
  email: string;
  role: AdminRole;
}

/**
 * Fetches the user's primary email. Prefers the signed admin session (cookie
 * or proxy-forwarded header), then JWT claims, then the Clerk Backend API.
 */
export async function getPrimaryEmail(
  userId: string,
  sessionClaims?: unknown,
): Promise<string | null> {
  const fromClaims = emailFromSessionClaims(sessionClaims);
  if (fromClaims) return fromClaims;

  try {
    const headerToken = (await headers()).get(ADMIN_SESSION_HEADER);
    const cookieToken = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
    const session = await verifyAdminSession(headerToken ?? cookieToken, userId);
    if (session) return session.email;
  } catch {
    // headers()/cookies() throw outside a request (scripts, some tests).
  }

  return fetchClerkPrimaryEmail(userId);
}

/**
 * Returns the admin context if the current request belongs to an authenticated
 * user whose email is on the allowlist. Returns `null` otherwise.
 *
 * Wrapped in React `cache()` so layout + page + nested RSC share one lookup
 * per request.
 */
export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const email = await getPrimaryEmail(userId, sessionClaims);
  const role = roleForEmail(email);
  if (!email || !role) return null;

  return { userId, email, role };
});

/**
 * Strict variant for server actions, route handlers, and admin-only mutations.
 * Throws `ForbiddenError` if the caller is not an allowlisted admin.
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
