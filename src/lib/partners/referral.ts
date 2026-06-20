import { SITE_URL } from "@/lib/constants";

/**
 * Referral-link primitives shared by the `/join/<code>` redirect, the
 * onboarding attribution stamp, and the partner portal link manager.
 *
 * Pure helpers only (no DB access) so they're trivially unit-testable; the
 * route handlers / server actions do the persistence.
 */

/** Cookie that carries the referral code from `/join/<code>` to signup. */
export const REF_COOKIE = "lx_ref";

/** Attribution window: 90 days, per the affiliate program terms. */
export const REF_COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

const CODE_LENGTH = 10;
// Unambiguous lowercase alphanumerics (no 0/o/1/l) — these codes get read
// aloud and retyped, so skip the characters people confuse.
const CODE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** Generates a new random referral code (e.g. "k3vq8m2xnp"). */
export function generateReferralCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return code;
}

/** Cheap shape check before hitting the DB from the public redirect route. */
export function isValidReferralCode(code: string): boolean {
  return /^[a-z0-9]{4,32}$/i.test(code);
}

export interface AttributableLink {
  id: number;
  orgId: number;
  repId: number | null;
  active: boolean;
}

export interface ReferralAttribution {
  referralLinkId: number;
  partnerOrgId: number;
  partnerRepId: number | null;
}

/**
 * Maps a referral link to the attribution columns stamped onto a new clinic
 * (or lead). Returns null for deactivated links — they stop attributing the
 * moment a partner turns them off.
 */
export function attributionFromLink(
  link: AttributableLink | null | undefined,
): ReferralAttribution | null {
  if (!link || !link.active) return null;
  return {
    referralLinkId: link.id,
    partnerOrgId: link.orgId,
    partnerRepId: link.repId,
  };
}

/** Builds the public URL for a referral code. */
export function referralUrl(code: string): string {
  return `${SITE_URL}/join/${code}`;
}
