import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { roleAtLeast, type PartnerRole } from "@/lib/auth/partner-roles";
import {
  partnerContextFromIdentityRow,
  type PartnerIdentity,
  type PartnerIdentityRow,
} from "@/lib/auth/partner-identity";
import type { PartnerOrg, PartnerRep } from "@/lib/db/schema";

export type { PartnerRole } from "@/lib/auth/partner-roles";

/**
 * Partner-portal access control.
 *
 * A signed-in Clerk user maps to exactly one partner identity via a single
 * UNION lookup on `clerkUserId` (mirroring how `clinics` links clinic accounts):
 *   - an ORG OWNER (row in `partner_orgs`) — full org visibility, manages reps
 *   - a REP (row in `partner_reps`) — sees only their own clinics/commissions
 *
 * Suspended identities are treated as having no access. A rep also loses
 * access when their parent org is suspended.
 */

export type PartnerKind = "org" | "rep";

export type PartnerContext = PartnerIdentity;

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
 *
 * Wrapped in React `cache()` so layout + page + nested RSC share one lookup
 * per request. The SQL is a single UNION (owner → member → rep) so reps do
 * not pay three sequential round-trips.
 */
export const getPartnerContext = cache(
  async (): Promise<PartnerContext | null> => {
    const { userId } = await auth();
    if (!userId) return null;

    const result = await db.execute(sql`
      (
        SELECT
          1 AS priority,
          'org'::text AS kind,
          'owner'::text AS role,
          to_jsonb(o) AS org,
          NULL::jsonb AS rep
        FROM partner_orgs o
        WHERE o.clerk_user_id = ${userId}
          AND o.status = 'active'
      )
      UNION ALL
      (
        SELECT
          2,
          'org',
          m.role::text,
          to_jsonb(o),
          NULL::jsonb
        FROM partner_org_members m
        INNER JOIN partner_orgs o ON o.id = m.org_id
        WHERE m.clerk_user_id = ${userId}
          AND m.status = 'active'
          AND o.status = 'active'
      )
      UNION ALL
      (
        SELECT
          3,
          'rep',
          NULL,
          to_jsonb(o),
          to_jsonb(r)
        FROM partner_reps r
        INNER JOIN partner_orgs o ON o.id = r.org_id
        WHERE r.clerk_user_id = ${userId}
          AND r.status = 'active'
          AND o.status = 'active'
      )
      ORDER BY priority
      LIMIT 1
    `);

    return partnerContextFromIdentityRow(
      userId,
      (result.rows[0] ?? null) as PartnerIdentityRow | null,
    );
  },
);

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

export type { PartnerOrg, PartnerRep };
