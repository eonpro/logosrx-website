"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { partnerOrgMembers } from "@/lib/db/schema";
import { requirePartner } from "@/lib/auth/partner";
import type { AssignableRole } from "@/lib/auth/partner-roles";
import {
  buildPartnerActivateUrl,
  createPartnerClerkUser,
  PartnerProvisionError,
} from "@/lib/partners/provision";
import {
  clerkErrorMessage,
  setClerkUserPassword,
  validatePasswordInput,
} from "@/lib/auth/clerk-users";
import { sendOrgMemberInviteEmail } from "@/lib/notifications/email";
import { recordPartnerAudit } from "@/lib/audit/log";
import { runAfterResponse } from "@/lib/runtime/after";

export interface TeamActionResult {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: AssignableRole[] = ["admin", "viewer"];

/**
 * Invites a teammate to the org with a role. Owner or admin only. Provisions
 * the Clerk login and emails a one-time activation link (same flow as reps).
 */
export async function inviteMember(input: {
  name: string;
  email: string;
  role: string;
  /** Optional initial password; lets the teammate sign in without an activation link. */
  password?: string;
}): Promise<TeamActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });

  const name = input.name.trim().slice(0, 200);
  const email = input.email.trim().toLowerCase().slice(0, 255);
  if (!name || !email) return { ok: false, error: "Name and email are required." };
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!ROLES.includes(input.role as AssignableRole)) {
    return { ok: false, error: "Invalid role." };
  }
  const role = input.role as AssignableRole;

  const initialPassword = input.password?.trim() || undefined;
  if (initialPassword) {
    const pwErr = validatePasswordInput(initialPassword);
    if (pwErr) return { ok: false, error: pwErr };
  }

  // Block collisions with the owner's own email or an existing member.
  if (ctx.org.contactEmail?.toLowerCase() === email) {
    return { ok: false, error: "That's the organization owner's email." };
  }
  const [existing] = await db
    .select({ id: partnerOrgMembers.id })
    .from(partnerOrgMembers)
    .where(
      and(eq(partnerOrgMembers.orgId, ctx.org.id), eq(partnerOrgMembers.email, email)),
    )
    .limit(1);
  if (existing) return { ok: false, error: "A teammate with this email already exists." };

  let clerkUserId: string;
  try {
    clerkUserId = await createPartnerClerkUser({ email, name, password: initialPassword });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof PartnerProvisionError
          ? err.message
          : "Could not create the teammate's account.",
    };
  }

  try {
    await db.insert(partnerOrgMembers).values({
      orgId: ctx.org.id,
      clerkUserId,
      name,
      email,
      role,
      status: "active",
      invitedBy: ctx.userId,
    });
  } catch {
    console.error("[partners] member insert failed; rolling back Clerk user");
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkUserId);
    } catch {
      console.error("[partners] member rollback deleteUser failed");
    }
    return { ok: false, error: "Could not add the teammate. Please try again." };
  }

  runAfterResponse(
    (async () => {
      const activateUrl = await buildPartnerActivateUrl(clerkUserId);
      await sendOrgMemberInviteEmail({
        to: email,
        name,
        orgName: ctx.org.name,
        role,
        activateUrl: activateUrl ?? undefined,
      });
    })(),
  );
  await recordPartnerAudit(
    ctx,
    "partner.member_invite",
    { type: "partner_org", id: ctx.org.id },
    { email, role },
  );

  revalidatePath("/partners/team");
  return { ok: true };
}

/** Changes a teammate's role. Owner or admin only. */
export async function setMemberRole(
  memberId: number,
  role: string,
): Promise<TeamActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });
  if (!ROLES.includes(role as AssignableRole)) {
    return { ok: false, error: "Invalid role." };
  }
  const updated = await db
    .update(partnerOrgMembers)
    .set({ role: role as AssignableRole, updatedAt: new Date() })
    .where(
      and(eq(partnerOrgMembers.id, memberId), eq(partnerOrgMembers.orgId, ctx.org.id)),
    )
    .returning({ id: partnerOrgMembers.id });
  if (updated.length === 0) return { ok: false, error: "Teammate not found." };

  await recordPartnerAudit(
    ctx,
    "partner.member_role",
    { type: "partner_org", id: ctx.org.id },
    { memberId, role },
  );
  revalidatePath("/partners/team");
  return { ok: true };
}

/** Removes a teammate (and their Clerk login). Owner or admin only. */
export async function removeMember(
  memberId: number,
): Promise<TeamActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });

  const [deleted] = await db
    .delete(partnerOrgMembers)
    .where(
      and(eq(partnerOrgMembers.id, memberId), eq(partnerOrgMembers.orgId, ctx.org.id)),
    )
    .returning({ clerkUserId: partnerOrgMembers.clerkUserId });
  if (!deleted) return { ok: false, error: "Teammate not found." };

  if (deleted.clerkUserId) {
    runAfterResponse(
      (async () => {
        try {
          const client = await clerkClient();
          await client.users.deleteUser(deleted.clerkUserId!);
        } catch {
          console.error("[partners] member Clerk delete failed (non-critical)");
        }
      })(),
    );
  }

  await recordPartnerAudit(ctx, "partner.member_remove", {
    type: "partner_org",
    id: ctx.org.id,
  });
  revalidatePath("/partners/team");
  return { ok: true };
}

/** Re-sends a teammate's activation email with a fresh ticket. */
export async function resendMemberInvite(
  memberId: number,
): Promise<TeamActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });

  const [m] = await db
    .select()
    .from(partnerOrgMembers)
    .where(
      and(eq(partnerOrgMembers.id, memberId), eq(partnerOrgMembers.orgId, ctx.org.id)),
    )
    .limit(1);
  if (!m) return { ok: false, error: "Teammate not found." };
  if (!m.clerkUserId) {
    return { ok: false, error: "This teammate has no account to activate." };
  }

  const activateUrl = await buildPartnerActivateUrl(m.clerkUserId);
  if (!activateUrl) {
    return { ok: false, error: "Could not generate an activation link." };
  }
  const sent = await sendOrgMemberInviteEmail({
    to: m.email,
    name: m.name,
    orgName: ctx.org.name,
    role: m.role,
    activateUrl,
  });
  if (!sent) {
    return { ok: false, error: "The invitation email could not be sent." };
  }
  return { ok: true };
}

/**
 * Directly sets a teammate's sign-in password (no email round-trip) so they can
 * sign in with credentials handed to them. Scoped to the caller's org.
 */
export async function setMemberPassword(
  memberId: number,
  password: string,
): Promise<TeamActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });

  const pwErr = validatePasswordInput(password ?? "");
  if (pwErr) return { ok: false, error: pwErr };

  const [m] = await db
    .select()
    .from(partnerOrgMembers)
    .where(
      and(eq(partnerOrgMembers.id, memberId), eq(partnerOrgMembers.orgId, ctx.org.id)),
    )
    .limit(1);
  if (!m) return { ok: false, error: "Teammate not found." };
  if (!m.clerkUserId) {
    return { ok: false, error: "This teammate has no account yet." };
  }

  try {
    await setClerkUserPassword(m.clerkUserId, password);
  } catch (err) {
    return { ok: false, error: clerkErrorMessage(err, "Could not set the password.") };
  }

  await recordPartnerAudit(
    ctx,
    "partner.member_set_password",
    { type: "partner_org", id: ctx.org.id },
    { memberId },
  );
  revalidatePath("/partners/team");
  return { ok: true };
}
