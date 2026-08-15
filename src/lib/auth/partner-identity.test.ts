import { describe, expect, it } from "vitest";
import { partnerContextFromIdentityRow } from "./partner-identity";

const created = "2026-01-15T12:00:00.000Z";
const updated = "2026-02-01T12:00:00.000Z";

function orgJson(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    clerk_user_id: "user_owner",
    name: "Northstar",
    contact_name: "Ada",
    contact_email: "ada@northstar.test",
    contact_phone: null,
    website: null,
    notes: null,
    status: "active",
    compensation_model: "commission",
    commission_rate_bps: 500,
    msa_signed_at: "2026-03-01T00:00:00.000Z",
    approved_at: created,
    approved_by: "user_admin",
    created_at: created,
    updated_at: updated,
    ...overrides,
  };
}

function repJson(overrides: Record<string, unknown> = {}) {
  return {
    id: 44,
    org_id: 10,
    clerk_user_id: "user_rep",
    name: "Riley Rep",
    email: "riley@northstar.test",
    phone: null,
    status: "active",
    commission_rate_bps: 200,
    msa_signed_at: null,
    invited_at: created,
    activated_at: created,
    created_at: created,
    updated_at: updated,
    ...overrides,
  };
}

describe("partnerContextFromIdentityRow", () => {
  it("maps an org-owner row (priority 1)", () => {
    const ctx = partnerContextFromIdentityRow("user_owner", {
      priority: 1,
      kind: "org",
      role: "owner",
      org: orgJson(),
      rep: null,
    });
    expect(ctx).toMatchObject({
      userId: "user_owner",
      kind: "org",
      role: "owner",
      rep: null,
    });
    expect(ctx?.org.id).toBe(10);
    expect(ctx?.org.name).toBe("Northstar");
    expect(ctx?.org.commissionRateBps).toBe(500);
    expect(ctx?.org.msaSignedAt).toEqual(new Date("2026-03-01T00:00:00.000Z"));
    expect(ctx?.org.createdAt).toEqual(new Date(created));
  });

  it("maps an invited org member with their assigned role", () => {
    const ctx = partnerContextFromIdentityRow("user_member", {
      kind: "org",
      role: "admin",
      org: orgJson({ clerk_user_id: "user_owner" }),
      rep: null,
    });
    expect(ctx?.kind).toBe("org");
    expect(ctx?.role).toBe("admin");
    expect(ctx?.rep).toBeNull();
  });

  it("maps a viewer member", () => {
    const ctx = partnerContextFromIdentityRow("user_viewer", {
      kind: "org",
      role: "viewer",
      org: orgJson(),
      rep: null,
    });
    expect(ctx?.role).toBe("viewer");
  });

  it("maps a rep row and attaches the rep record", () => {
    const ctx = partnerContextFromIdentityRow("user_rep", {
      kind: "rep",
      role: null,
      org: orgJson(),
      rep: repJson(),
    });
    expect(ctx).toMatchObject({
      userId: "user_rep",
      kind: "rep",
      role: null,
    });
    expect(ctx?.rep?.id).toBe(44);
    expect(ctx?.rep?.name).toBe("Riley Rep");
    expect(ctx?.rep?.commissionRateBps).toBe(200);
    expect(ctx?.rep?.msaSignedAt).toBeNull();
    expect(ctx?.rep?.activatedAt).toEqual(new Date(created));
  });

  it("returns null when the row or org is missing", () => {
    expect(partnerContextFromIdentityRow("user_1", null)).toBeNull();
    expect(partnerContextFromIdentityRow("user_1", undefined)).toBeNull();
    expect(
      partnerContextFromIdentityRow("user_1", { kind: "org", role: "owner" }),
    ).toBeNull();
  });

  it("returns null for a rep row without a rep payload", () => {
    expect(
      partnerContextFromIdentityRow("user_rep", {
        kind: "rep",
        role: null,
        org: orgJson(),
        rep: null,
      }),
    ).toBeNull();
  });

  it("rejects unknown kinds and roles", () => {
    expect(
      partnerContextFromIdentityRow("user_1", {
        kind: "clinic",
        role: "owner",
        org: orgJson(),
      }),
    ).toBeNull();
    expect(
      partnerContextFromIdentityRow("user_1", {
        kind: "org",
        role: "superadmin",
        org: orgJson(),
      }),
    ).toBeNull();
  });
});
