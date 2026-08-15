/**
 * Pulls an email address out of Clerk session JWT claims when present.
 * Common keys plus nested `user.*` so a custom session token (Dashboard →
 * Sessions → Customize, `email: "{{user.primary_email_address}}"`) skips the
 * Clerk Backend API on every admin navigation.
 */
export function emailFromSessionClaims(claims: unknown): string | null {
  if (!claims || typeof claims !== "object") return null;
  const c = claims as Record<string, unknown>;
  const nested =
    c.user && typeof c.user === "object"
      ? (c.user as Record<string, unknown>)
      : undefined;
  const candidate =
    c.email ??
    c.primary_email ??
    c.primary_email_address ??
    c.email_address ??
    nested?.email ??
    nested?.primary_email_address ??
    nested?.email_address;
  return typeof candidate === "string" && candidate.includes("@")
    ? candidate
    : null;
}
