import { auth } from "@clerk/nextjs/server";

/**
 * Slug of the Clerk Organization that gates admin access.
 *
 * Create this Organization in the Clerk dashboard:
 *   - Name: "Logos Admin"
 *   - Slug: "logos-admin"
 *   - Default roles: `org:admin` (full access) and `org:member` (read-only "viewer")
 *
 * The slug can be overridden via env var if you rename the org.
 */
export const ADMIN_ORG_SLUG =
  process.env.NEXT_PUBLIC_CLERK_ADMIN_ORG_SLUG ?? "logos-admin";

/** Clerk's default org roles. We treat `org:member` as the read-only "viewer". */
export const ADMIN_ROLE = "org:admin" as const;
export const VIEWER_ROLE = "org:member" as const;

export type AdminRole = typeof ADMIN_ROLE | typeof VIEWER_ROLE;

export interface AdminContext {
  userId: string;
  orgId: string;
  orgSlug: string;
  role: AdminRole;
}

/**
 * Returns the admin context if the current request belongs to an authenticated
 * user inside the Logos admin org. Returns `null` otherwise.
 *
 * Read-only check; safe to call inside `loading.tsx` / server components.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const session = await auth();
  const { userId, orgId, orgSlug, orgRole } = session;

  if (!userId || !orgId || orgSlug !== ADMIN_ORG_SLUG) return null;
  if (orgRole !== ADMIN_ROLE && orgRole !== VIEWER_ROLE) return null;

  return {
    userId,
    orgId,
    orgSlug,
    role: orgRole as AdminRole,
  };
}

/**
 * Strict variant for server actions, route handlers, and admin-only mutations.
 * Throws `ForbiddenError` if the caller is not inside the admin org. The
 * thrown error message is intentionally generic so it can be safely surfaced.
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
