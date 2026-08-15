import type { PartnerOrg, PartnerRep } from "@/lib/db/schema";
import type { PartnerRole } from "@/lib/auth/partner-roles";

export type { PartnerRole };

/** Raw UNION row from the single partner-identity lookup. */
export interface PartnerIdentityRow {
  priority?: unknown;
  kind?: unknown;
  role?: unknown;
  org?: unknown;
  rep?: unknown;
}

export interface PartnerIdentity {
  userId: string;
  kind: "org" | "rep";
  org: PartnerOrg;
  rep: PartnerRep | null;
  role: PartnerRole | null;
}

const ORG_ROLES = new Set<PartnerRole>(["owner", "admin", "viewer"]);

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function asRequiredDate(value: unknown): Date | null {
  return asDate(value);
}

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function hydrateOrg(raw: unknown): PartnerOrg | null {
  const r = record(raw);
  if (!r) return null;
  const id = asNumber(r.id);
  const name = asString(r.name);
  const contactEmail = asString(r.contact_email ?? r.contactEmail);
  const status = asString(r.status);
  const compensationModel = asString(
    r.compensation_model ?? r.compensationModel,
  );
  const createdAt = asRequiredDate(r.created_at ?? r.createdAt);
  const updatedAt = asRequiredDate(r.updated_at ?? r.updatedAt);
  const commissionRateBps = asNumber(
    r.commission_rate_bps ?? r.commissionRateBps,
  );
  if (
    id == null ||
    !name ||
    !contactEmail ||
    (status !== "pending" && status !== "active" && status !== "suspended") ||
    (compensationModel !== "commission" && compensationModel !== "margin") ||
    !createdAt ||
    !updatedAt ||
    commissionRateBps == null
  ) {
    return null;
  }
  return {
    id,
    clerkUserId: asString(r.clerk_user_id ?? r.clerkUserId),
    name,
    contactName: asString(r.contact_name ?? r.contactName),
    contactEmail,
    contactPhone: asString(r.contact_phone ?? r.contactPhone),
    website: asString(r.website),
    notes: asString(r.notes),
    status,
    compensationModel,
    commissionRateBps,
    msaSignedAt: asDate(r.msa_signed_at ?? r.msaSignedAt),
    approvedAt: asDate(r.approved_at ?? r.approvedAt),
    approvedBy: asString(r.approved_by ?? r.approvedBy),
    createdAt,
    updatedAt,
  };
}

function hydrateRep(raw: unknown): PartnerRep | null {
  const r = record(raw);
  if (!r) return null;
  const id = asNumber(r.id);
  const orgId = asNumber(r.org_id ?? r.orgId);
  const name = asString(r.name);
  const email = asString(r.email);
  const status = asString(r.status);
  const commissionRateBps = asNumber(
    r.commission_rate_bps ?? r.commissionRateBps,
  );
  const invitedAt = asRequiredDate(r.invited_at ?? r.invitedAt);
  const createdAt = asRequiredDate(r.created_at ?? r.createdAt);
  const updatedAt = asRequiredDate(r.updated_at ?? r.updatedAt);
  if (
    id == null ||
    orgId == null ||
    !name ||
    !email ||
    (status !== "pending" && status !== "active" && status !== "suspended") ||
    commissionRateBps == null ||
    !invitedAt ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }
  return {
    id,
    orgId,
    clerkUserId: asString(r.clerk_user_id ?? r.clerkUserId),
    name,
    email,
    phone: asString(r.phone),
    status,
    commissionRateBps,
    msaSignedAt: asDate(r.msa_signed_at ?? r.msaSignedAt),
    invitedAt,
    activatedAt: asDate(r.activated_at ?? r.activatedAt),
    createdAt,
    updatedAt,
  };
}

/**
 * Maps one UNION identity row (owner / member / rep) into a partner context.
 * SQL already filters to active identities and orders owner > member > rep.
 */
export function partnerContextFromIdentityRow(
  userId: string,
  row: PartnerIdentityRow | null | undefined,
): PartnerIdentity | null {
  if (!row) return null;
  const kind = row.kind;
  const org = hydrateOrg(row.org);
  if (!org) return null;

  if (kind === "org") {
    const role = asString(row.role);
    if (!role || !ORG_ROLES.has(role as PartnerRole)) return null;
    return {
      userId,
      kind: "org",
      org,
      rep: null,
      role: role as PartnerRole,
    };
  }

  if (kind === "rep") {
    const rep = hydrateRep(row.rep);
    if (!rep) return null;
    return { userId, kind: "rep", org, rep, role: null };
  }

  return null;
}
