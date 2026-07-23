import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { clinicApiKeys, clinics, type Clinic } from "@/lib/db/schema";

/**
 * Clinic ordering-API key handling (`/api/clinic/v1/*`). Keys look like
 * `lxck_<random>`; only a SHA-256 hash is persisted (the plaintext is shown
 * once at mint time, to an admin). Mirrors `src/lib/partners/api-auth.ts`.
 *
 * Clinic isolation starts here: the authenticated key resolves to exactly one
 * clinic row, and every downstream read/write is scoped to that clinic id —
 * the caller can never name a clinic in the request.
 */

const PREFIX = "lxck_";

export interface MintedClinicKey {
  /** Full plaintext key — show once, never stored. */
  plaintext: string;
  /** Non-secret display prefix, e.g. "lxck_ab12cd". */
  keyPrefix: string;
  /** SHA-256 hex hash to persist. */
  keyHash: string;
}

export function hashClinicApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/** Generates a new clinic API key (plaintext once + the values to store). */
export function mintClinicApiKey(): MintedClinicKey {
  const plaintext = PREFIX + randomBytes(24).toString("base64url");
  return {
    plaintext,
    keyPrefix: plaintext.slice(0, 12),
    keyHash: hashClinicApiKey(plaintext),
  };
}

/**
 * Extracts the key from a request, accepting either header convention:
 * `Authorization: Bearer lxck_...` (matches the partner API) or
 * `X-Api-Key: lxck_...` (matches what pharmacy-API integrators expect).
 */
export function clinicKeyToken(headers: {
  get(name: string): string | null;
}): string | null {
  const auth = headers.get("authorization");
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    const token = m?.[1]?.trim();
    if (token?.startsWith(PREFIX)) return token;
  }
  const headerKey = headers.get("x-api-key")?.trim();
  if (headerKey?.startsWith(PREFIX)) return headerKey;
  return null;
}

export interface ClinicApiAuth {
  clinic: Clinic;
  keyId: number;
}

/**
 * Authenticates a request. Returns the clinic (verified, non-revoked key) or
 * null. The ordering-enabled gate is NOT enforced here — the route layer
 * distinguishes "bad key" (401/403) from "clinic not enrolled" (403 with a
 * specific code) so integrators get actionable errors.
 */
export async function authenticateClinicApiKey(headers: {
  get(name: string): string | null;
}): Promise<ClinicApiAuth | null> {
  const token = clinicKeyToken(headers);
  if (!token) return null;
  const keyHash = hashClinicApiKey(token);

  const [row] = await db
    .select({ key: clinicApiKeys, clinic: clinics })
    .from(clinicApiKeys)
    .innerJoin(clinics, eq(clinicApiKeys.clinicId, clinics.id))
    .where(eq(clinicApiKeys.keyHash, keyHash))
    .limit(1);

  if (!row) return null;
  if (row.key.revokedAt) return null;

  // Touch lastUsedAt without blocking the response.
  void db
    .update(clinicApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(clinicApiKeys.id, row.key.id))
    .catch(() => {});

  return { clinic: row.clinic, keyId: row.key.id };
}
