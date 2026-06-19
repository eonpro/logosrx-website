import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { SITE_URL } from "@/lib/constants";

/**
 * Shared Clerk Backend API helpers used by every account-provisioning flow
 * (clinic onboarding, partner org approval, rep invites, activation).
 * Single source of truth — these were previously copy-pasted per flow.
 */

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
