import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  partnerOrgs,
  partnerReps,
  type PartnerOrg,
  type PartnerRep,
} from "@/lib/db/schema";

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

  const [org] = await db
    .select()
    .from(partnerOrgs)
    .where(eq(partnerOrgs.clerkUserId, userId))
    .limit(1);
  if (org) {
    if (org.status !== "active") return null;
    return { userId, kind: "org", org, rep: null };
  }

  const [row] = await db
    .select({ rep: partnerReps, org: partnerOrgs })
    .from(partnerReps)
    .innerJoin(partnerOrgs, eq(partnerReps.orgId, partnerOrgs.id))
    .where(eq(partnerReps.clerkUserId, userId))
    .limit(1);
  if (!row) return null;
  if (row.rep.status !== "active" || row.org.status !== "active") return null;

  return { userId, kind: "rep", org: row.org, rep: row.rep };
}

/**
 * Strict variant for server actions and mutations. Throws when the caller is
 * not an active partner; `orgOnly` additionally rejects rep sessions (e.g.
 * managing reps or their commission rates is owner-only).
 */
export async function requirePartner(
  options: { orgOnly?: boolean } = {},
): Promise<PartnerContext> {
  const ctx = await getPartnerContext();
  if (!ctx) throw new PartnerForbiddenError();
  if (options.orgOnly && ctx.kind !== "org") throw new PartnerForbiddenError();
  return ctx;
}
