/**
 * Single source of truth for the application's master secret.
 *
 * `ONBOARDING_ENCRYPTION_KEY` is used both for AES-256-GCM encryption of
 * sensitive onboarding fields at rest AND for HMAC-signing the password-gated
 * quote access/claim cookies. If it is ever unset in production we must fail
 * loudly: silently falling back to a publicly-known development key would let
 * an attacker forge encryption material and quote-access cookies.
 *
 * In development we allow a deterministic fallback so the app boots without
 * secrets, mirroring the previous behavior of the individual modules.
 */

/** Deterministic dev-only fallback. NEVER used in production (we throw instead). */
export const DEV_FALLBACK_SECRET = "logos-dev-fallback-key";

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    // Vercel sets VERCEL_ENV to "preview" | "production" | "development".
    // Treat anything that isn't an explicit non-prod marker as production.
    process.env.VERCEL_ENV !== "preview" &&
    process.env.VERCEL_ENV !== "development"
  );
}

/**
 * Returns the raw application secret, throwing in production when it is not
 * configured. Callers derive purpose-specific keys from this value (e.g. an
 * HMAC key or a 32-byte AES key) so the same secret never reuses the same
 * derived key across contexts.
 */
export function getAppSecret(): string {
  const raw = process.env.ONBOARDING_ENCRYPTION_KEY;
  if (raw && raw.length > 0) return raw;

  if (isProductionRuntime()) {
    throw new Error(
      "ONBOARDING_ENCRYPTION_KEY is required in production. It is used for " +
        "at-rest encryption and for signing quote-access cookies; refusing to " +
        "fall back to a public development key.",
    );
  }
  return DEV_FALLBACK_SECRET;
}
