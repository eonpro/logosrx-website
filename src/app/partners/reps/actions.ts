"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { partnerReps } from "@/lib/db/schema";
import { requirePartner } from "@/lib/auth/partner";
import {
  percentToBps,
  validateRepRateBps,
} from "@/lib/partners/commission";
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
import { sendRepInviteEmail } from "@/lib/notifications/email";
import { runAfterResponse } from "@/lib/runtime/after";

export interface RepActionResult {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Org-owner action: creates a rep under the org, provisions their Clerk
 * login, and emails them a one-time activation link. The rep's commission
 * rate is carved out of the org's rate, so it can never exceed it.
 */
export async function inviteRep(input: {
  name: string;
  email: string;
  phone: string;
  ratePercent: number;
  /** Optional initial password; lets the rep sign in without an activation link. */
  password?: string;
}): Promise<RepActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });

  const name = input.name.trim().slice(0, 200);
  const email = input.email.trim().toLowerCase().slice(0, 255);
  const phone = input.phone.trim().slice(0, 30);
  if (!name || !email) {
    return { ok: false, error: "Name and email are required." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const initialPassword = input.password?.trim() || undefined;
  if (initialPassword) {
    const pwErr = validatePasswordInput(initialPassword);
    if (pwErr) return { ok: false, error: pwErr };
  }

  const rateBps = percentToBps(input.ratePercent);
  const rateErr = validateRepRateBps(rateBps, ctx.org.commissionRateBps);
  if (rateErr) return { ok: false, error: rateErr };

  const [existing] = await db
    .select({ id: partnerReps.id })
    .from(partnerReps)
    .where(
      and(eq(partnerReps.orgId, ctx.org.id), eq(partnerReps.email, email)),
    )
    .limit(1);
  if (existing) {
    return { ok: false, error: "A rep with this email already exists." };
  }

  // 1. Provision the Clerk login (throwaway password; activation sets a real
  //    one). Done first so a Clerk failure surfaces before any DB write.
  let clerkUserId: string;
  try {
    clerkUserId = await createPartnerClerkUser({
      email,
      name,
      phone,
      password: initialPassword,
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof PartnerProvisionError
          ? err.message
          : "Could not create the rep's account.",
    };
  }

  // 2. Persist the rep. Roll back the orphaned Clerk user on failure so the
  //    org owner can retry cleanly.
  try {
    await db.insert(partnerReps).values({
      orgId: ctx.org.id,
      clerkUserId,
      name,
      email,
      phone: phone || null,
      // Org-created accounts need no separate approval step.
      status: "active",
      commissionRateBps: rateBps,
    });
  } catch {
    console.error("[partners] rep insert failed; rolling back Clerk user");
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkUserId);
    } catch {
      console.error("[partners] rollback deleteUser failed");
    }
    return { ok: false, error: "Could not save the rep. Please try again." };
  }

  // 3. Invitation email (best-effort; "Resend invite" covers failures).
  runAfterResponse(
    (async () => {
      const activateUrl = await buildPartnerActivateUrl(clerkUserId);
      await sendRepInviteEmail({
        to: email,
        repName: name,
        orgName: ctx.org.name,
        activateUrl: activateUrl ?? undefined,
      });
    })(),
  );

  revalidatePath("/partners/reps");
  return { ok: true };
}

/** Org-owner action: adjusts a rep's commission rate (snapshot-safe: only future transactions are affected). */
export async function setRepRate(
  repId: number,
  ratePercent: number,
): Promise<RepActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });

  const rateBps = percentToBps(ratePercent);
  const rateErr = validateRepRateBps(rateBps, ctx.org.commissionRateBps);
  if (rateErr) return { ok: false, error: rateErr };

  const updated = await db
    .update(partnerReps)
    .set({ commissionRateBps: rateBps, updatedAt: new Date() })
    .where(
      and(eq(partnerReps.id, repId), eq(partnerReps.orgId, ctx.org.id)),
    )
    .returning({ id: partnerReps.id });
  if (updated.length === 0) return { ok: false, error: "Rep not found." };

  revalidatePath("/partners/reps");
  return { ok: true };
}

/** Org-owner action: suspends or reactivates a rep's portal access. */
export async function setRepStatus(
  repId: number,
  status: "active" | "suspended",
): Promise<RepActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });
  if (status !== "active" && status !== "suspended") {
    return { ok: false, error: "Invalid status." };
  }

  const updated = await db
    .update(partnerReps)
    .set({ status, updatedAt: new Date() })
    .where(
      and(eq(partnerReps.id, repId), eq(partnerReps.orgId, ctx.org.id)),
    )
    .returning({ id: partnerReps.id });
  if (updated.length === 0) return { ok: false, error: "Rep not found." };

  revalidatePath("/partners/reps");
  return { ok: true };
}

/** Org-owner action: re-sends a rep's activation email with a fresh ticket. */
export async function resendRepInvite(
  repId: number,
): Promise<RepActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });

  const [rep] = await db
    .select()
    .from(partnerReps)
    .where(
      and(eq(partnerReps.id, repId), eq(partnerReps.orgId, ctx.org.id)),
    )
    .limit(1);
  if (!rep) return { ok: false, error: "Rep not found." };
  if (!rep.clerkUserId) {
    return { ok: false, error: "This rep has no account to activate." };
  }

  const activateUrl = await buildPartnerActivateUrl(rep.clerkUserId);
  if (!activateUrl) {
    return {
      ok: false,
      error: "Could not generate an activation link. Please try again.",
    };
  }

  const sent = await sendRepInviteEmail({
    to: rep.email,
    repName: rep.name,
    orgName: ctx.org.name,
    activateUrl,
  });
  if (!sent) {
    return {
      ok: false,
      error: "The invitation email could not be sent. Please try again.",
    };
  }

  return { ok: true };
}

/**
 * Org-owner action: directly sets a rep's sign-in password (no email round-trip)
 * so they can sign in with credentials handed to them. Scoped to the caller's org.
 */
export async function setRepPassword(
  repId: number,
  password: string,
): Promise<RepActionResult> {
  const ctx = await requirePartner({ orgOnly: true, minRole: "admin" });

  const pwErr = validatePasswordInput(password ?? "");
  if (pwErr) return { ok: false, error: pwErr };

  const [rep] = await db
    .select()
    .from(partnerReps)
    .where(and(eq(partnerReps.id, repId), eq(partnerReps.orgId, ctx.org.id)))
    .limit(1);
  if (!rep) return { ok: false, error: "Rep not found." };
  if (!rep.clerkUserId) {
    return { ok: false, error: "This rep has no account yet." };
  }

  try {
    await setClerkUserPassword(rep.clerkUserId, password);
  } catch (err) {
    return { ok: false, error: clerkErrorMessage(err, "Could not set the password.") };
  }

  revalidatePath("/partners/reps");
  return { ok: true };
}
