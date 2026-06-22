import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  partnerOrgMembers,
  partnerOrgs,
  partnerReps,
  type PartnerOrg,
  type PartnerRep,
} from "@/lib/db/schema";
import { roleAtLeast, type PartnerRole } from "@/lib/auth/partner-roles";

export type { PartnerRole } from "@/lib/auth/partner-roles";

/**
 * Partner-portal access control.
 *
 * A signed-in Clerk user maps to exactly one partner identity via DB lookup
 * on `clerkUserId` (mirroring how `clinics` links clinic accounts):
 *   - an ORG OWNER (row in `partner_orgs`) — full org visibility, manages reps
 *   - a REP (row in `partner_reps`) — sees only their own clinics/commissions
 *
 * Suspended identities are treated as having no access. A rep also loses
 * access when their parent org is suspended.
 */

export type PartnerKind = "org" | "rep";

export interface PartnerContext {
  userId: string;
  kind: PartnerKind;
  org: PartnerOrg;
  /** Set only for rep sessions. */
  rep: PartnerRep | null;
  /** Org role for `kind: "org"` (owner | admin | viewer); null for reps. */
  role: PartnerRole | null;
}

export class PartnerForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("forbidden");
    this.name = "PartnerForbiddenError";
  }
}

/**
 * Resolves the current request to a partner identity, or `null` when the
 * caller is anonymous, not a partner, or suspended. Safe for server
 * components (read-only).
 */
export async function getPartnerContext(): Promise<PartnerContext | null> {
  const { userId } = await auth();
  if (!userId) return null;

  // 1. Org owner (the account that was approved).
  const [org] = await db
    .select()
    .from(partnerOrgs)
    .where(eq(partnerOrgs.clerkUserId, userId))
    .limit(1);
  if (org) {
    if (org.status !== "active") return null;
    return { userId, kind: "org", org, rep: null, role: "owner" };
  }

  // 2. Invited org member (admin/viewer teammate).
  const [member] = await db
    .select({ member: partnerOrgMembers, org: partnerOrgs })
    .from(partnerOrgMembers)
    .innerJoin(partnerOrgs, eq(partnerOrgMembers.orgId, partnerOrgs.id))
    .where(eq(partnerOrgMembers.clerkUserId, userId))
    .limit(1);
  if (member) {
    if (member.member.status !== "active" || member.org.status !== "active") {
      return null;
    }
    return {
      userId,
      kind: "org",
      org: member.org,
      rep: null,
      role: member.member.role,
    };
  }

  // 3. Rep.
  const [row] = await db
    .select({ rep: partnerReps, org: partnerOrgs })
    .from(partnerReps)
    .innerJoin(partnerOrgs, eq(partnerReps.orgId, partnerOrgs.id))
    .where(eq(partnerReps.clerkUserId, userId))
    .limit(1);
  if (!row) return null;
  if (row.rep.status !== "active" || row.org.status !== "active") return null;

  return { userId, kind: "rep", org: row.org, rep: row.rep, role: null };
}

/**
 * Strict variant for server actions and mutations. Throws when the caller is
 * not an active partner.
 *
 *   - `orgOnly` rejects rep sessions (org-level features like rep/goal mgmt).
 *   - `minRole` requires at least that org role. It only constrains org users;
 *     reps (their own scoped data) are unaffected. So a management mutation
 *     should use `{ minRole: "admin" }` to block org *viewers* while still
 *     letting reps manage their own resources.
 */
export async function requirePartner(
  options: { orgOnly?: boolean; minRole?: PartnerRole } = {},
): Promise<PartnerContext> {
  const ctx = await getPartnerContext();
  if (!ctx) throw new PartnerForbiddenError();
  if (options.orgOnly && ctx.kind !== "org") throw new PartnerForbiddenError();
  if (
    options.minRole &&
    ctx.kind === "org" &&
    !roleAtLeast(ctx.role, options.minRole)
  ) {
    throw new PartnerForbiddenError();
  }
  return ctx;
}
