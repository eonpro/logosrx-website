"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { clerkErrorMessage } from "@/lib/auth/clerk-users";
import { db } from "@/lib/db";
import { partnerOrgMembers, partnerReps } from "@/lib/db/schema";

const MIN_PASSWORD_LENGTH = 8;

export interface ActivateResult {
  ok: boolean;
  error?: string;
}

/**
 * Sets the password for the currently-authenticated clinic and marks their
 * email verified. Called from `/activate` after the one-time sign-in ticket has
 * established a session, so we trust `auth()` for the user identity (the ticket
 * itself is proof the clinic controls the approval email).
 */
export async function activateSetPassword(
  password: string,
): Promise<ActivateResult> {
  const { userId } = await auth();
  if (!userId) {
    return {
      ok: false,
      error:
        "Your activation link has expired. Use “Forgot password” on the sign-in page to set a new password.",
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  const client = await clerkClient();

  try {
    await client.users.updateUser(userId, { password });
  } catch (err) {
    console.error("[activate] updateUser failed");
    return {
      ok: false,
      error: clerkErrorMessage(err, "Could not set your password."),
    };
  }

  // Mark the primary email verified so the clinic isn't prompted to verify on
  // first sign-in. Non-critical: a failure here doesn't block activation.
  try {
    const user = await client.users.getUser(userId);
    if (user.primaryEmailAddressId) {
      await client.emailAddresses.updateEmailAddress(
        user.primaryEmailAddressId,
        { verified: true },
      );
    }
  } catch {
    console.error("[activate] email verify failed (non-critical)");
  }

  // If this account is an invited partner rep, stamp first activation.
  // Best-effort: a failure never blocks the password set.
  try {
    await db
      .update(partnerReps)
      .set({ activatedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(partnerReps.clerkUserId, userId),
          isNull(partnerReps.activatedAt),
        ),
      );
  } catch {
    console.error("[activate] rep activation stamp failed (non-critical)");
  }

  // Likewise stamp an invited org member's first activation.
  try {
    await db
      .update(partnerOrgMembers)
      .set({ activatedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(partnerOrgMembers.clerkUserId, userId),
          isNull(partnerOrgMembers.activatedAt),
        ),
      );
  } catch {
    console.error("[activate] member activation stamp failed (non-critical)");
  }

  return { ok: true };
}
