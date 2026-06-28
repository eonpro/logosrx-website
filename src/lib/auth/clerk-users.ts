import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { SITE_URL } from "@/lib/constants";
import { log } from "@/lib/observability/logger";

/**
 * Shared Clerk Backend API helpers used by every account-provisioning flow
 * (clinic onboarding, partner org approval, rep invites, activation).
 * Single source of truth — these were previously copy-pasted per flow.
 */

/** Minimum password length enforced anywhere we set/accept a password. */
export const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 100;

/**
 * Validates an admin- or user-supplied password. Returns an error message, or
 * `null` when acceptable. Length only — Clerk enforces breach/strength checks
 * server-side and surfaces them via `clerkErrorMessage`.
 */
export function validatePasswordInput(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return "Password is too long.";
  }
  return null;
}

/**
 * Marks a user's primary email as verified so they aren't prompted to verify on
 * first sign-in. Best-effort by convention at the call sites; throws here so the
 * caller decides whether a failure is critical.
 */
export async function markPrimaryEmailVerified(
  client: Awaited<ReturnType<typeof clerkClient>>,
  userId: string,
): Promise<void> {
  const user = await client.users.getUser(userId);
  if (user.primaryEmailAddressId) {
    await client.emailAddresses.updateEmailAddress(user.primaryEmailAddressId, {
      verified: true,
    });
  }
}

/**
 * Sets a Clerk user's password directly (admin/owner-initiated). Used both when
 * first creating an account and to reset it later, so a user can sign in with
 * credentials handed to them — no activation link required. By default also
 * marks their primary email verified (non-critical). Throws on failure so the
 * caller can surface `clerkErrorMessage(err)`.
 */
export async function setClerkUserPassword(
  clerkUserId: string,
  password: string,
  options: { verifyEmail?: boolean } = {},
): Promise<void> {
  const client = await clerkClient();
  await client.users.updateUser(clerkUserId, { password });
  if (options.verifyEmail !== false) {
    try {
      await markPrimaryEmailVerified(client, clerkUserId);
    } catch (err) {
      log.warn("verify-email after password set failed (non-critical)", {
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }
}

/**
 * Best-effort E.164 normalization for US-style phone numbers. Clerk requires
 * phone numbers in E.164 when the instance treats phone as a required field.
 */
export function toE164(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits ? `+${digits}` : undefined;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : undefined;
}

/**
 * Derives a unique, valid Clerk username from the email local-part. The random
 * suffix avoids collisions; sign-in still uses email + password, so this value
 * is never surfaced to the user. Some Clerk instances require a username on
 * every user, which is why we supply one at all.
 */
export function deriveUsername(email: string, prefix = "user"): string {
  const local =
    email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ?? "";
  const base = (local.length >= 3 ? local : `${prefix}${local}`).slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}_${suffix}`;
}

/**
 * Extracts a user-facing message from a Clerk Backend API error. Known error
 * codes get friendlier copy; everything else falls back to Clerk's message or
 * the provided fallback.
 */
export function clerkErrorMessage(
  err: unknown,
  fallback = "Something went wrong.",
): string {
  if (err && typeof err === "object" && "errors" in err) {
    const first = (
      err as {
        errors?: Array<{ code?: string; message?: string; longMessage?: string }>;
      }
    ).errors?.[0];
    if (first) {
      if (first.code === "form_identifier_exists") {
        return "An account with this email already exists. Please sign in instead.";
      }
      if (first.code === "form_password_pwned") {
        return "That password has appeared in a data breach. Please choose a different one.";
      }
      return first.longMessage || first.message || fallback;
    }
  }
  return fallback;
}

/**
 * Mints a one-time activation link for an existing Clerk account. The link
 * lands on `/activate`, which consumes the ticket to sign the user in and let
 * them set their own password (+ verifies their email). `next` controls where
 * they land afterwards (defaults to the clinic dashboard inside `/activate`).
 *
 * Returns `null` (never throws) when the ticket can't be minted, so approval
 * and notification flows are never blocked by a Clerk hiccup.
 */
export async function buildActivateUrl(
  clerkUserId: string | null | undefined,
  options: { next?: string; expiresInSeconds?: number } = {},
): Promise<string | null> {
  if (!clerkUserId) return null;
  try {
    const client = await clerkClient();
    const token = await client.signInTokens.createSignInToken({
      userId: clerkUserId,
      // 7 days — long enough to act on an approval/invite email.
      expiresInSeconds: options.expiresInSeconds ?? 604800,
    });
    const next = options.next
      ? `&next=${encodeURIComponent(options.next)}`
      : "";
    return `${SITE_URL}/activate?ticket=${encodeURIComponent(token.token)}${next}`;
  } catch {
    return null;
  }
}
