/**
 * Pure partner org-role helpers (no server deps) so they're unit-testable and
 * usable in client components.
 *
 * Within a partner organization a Clerk user has one role:
 *   - `owner`  — the account that applied/was approved; full control.
 *   - `admin`  — invited teammate with full management rights.
 *   - `viewer` — invited teammate with read-only access.
 *
 * Reps are a separate identity (`kind: "rep"`) and are not org members; role
 * gating does not apply to them (they're already scoped to their own data).
 */

export type PartnerRole = "owner" | "admin" | "viewer";

/** Roles that can be assigned to invited members (owner is implicit). */
export type AssignableRole = "admin" | "viewer";

const RANK: Record<PartnerRole, number> = { owner: 3, admin: 2, viewer: 1 };

/** True when `role` meets or exceeds `min` in the org permission hierarchy. */
export function roleAtLeast(
  role: PartnerRole | null | undefined,
  min: PartnerRole,
): boolean {
  if (!role) return false;
  return RANK[role] >= RANK[min];
}

export const ROLE_LABEL: Record<PartnerRole, string> = {
  owner: "Owner",
  admin: "Admin",
  viewer: "Viewer",
};
