"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

const MIN_PASSWORD_LENGTH = 8;

export interface ActivateResult {
  ok: boolean;
  error?: string;
}

/** Extracts a user-facing message from a Clerk Backend API error. */
function clerkErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (
      err as {
        errors?: Array<{ code?: string; message?: string; longMessage?: string }>;
      }
    ).errors;
    const first = errors?.[0];
    if (first) {
      if (first.code === "form_password_pwned") {
        return "That password has appeared in a data breach. Please choose a different one.";
      }
      return first.longMessage || first.message || "Could not set your password.";
    }
  }
  return "Could not set your password.";
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
    return { ok: false, error: clerkErrorMessage(err) };
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

  return { ok: true };
}
