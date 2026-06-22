import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerApiKeys, partnerOrgs, type PartnerOrg } from "@/lib/db/schema";
import type { PartnerContext } from "@/lib/auth/partner";

/**
 * Partner API key handling. Keys look like `lxpk_<random>`; only a SHA-256
 * hash is persisted (the plaintext is shown once at creation). Verification
 * hashes the presented token and looks it up by the indexed hash column, so no
 * plaintext ever round-trips through the DB.
 */

const PREFIX = "lxpk_";

export interface MintedKey {
  /** Full plaintext key — show once, never stored. */
  plaintext: string;
  /** Non-secret display prefix, e.g. "lxpk_ab12cd". */
  keyPrefix: string;
  /** SHA-256 hex hash to persist. */
  keyHash: string;
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/** Generates a new API key (returns plaintext once + the values to store). */
export function mintApiKey(): MintedKey {
  const plaintext = PREFIX + randomBytes(24).toString("base64url");
  return {
    plaintext,
    keyPrefix: plaintext.slice(0, 12),
    keyHash: hashApiKey(plaintext),
  };
}

/** Extracts a bearer token from an Authorization header. */
export function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = m?.[1]?.trim();
  return token && token.startsWith(PREFIX) ? token : null;
}

export interface ApiKeyAuth {
  org: PartnerOrg;
  keyId: number;
}

/**
 * Authenticates a request by its `Authorization: Bearer lxpk_...` header.
 * Returns the org (active, non-revoked key) or null. Updates `lastUsedAt`
 * best-effort.
 */
export async function authenticateApiKey(
  authHeader: string | null,
): Promise<ApiKeyAuth | null> {
  const token = bearerToken(authHeader);
  if (!token) return null;
  const keyHash = hashApiKey(token);

  const [row] = await db
    .select({ key: partnerApiKeys, org: partnerOrgs })
    .from(partnerApiKeys)
    .innerJoin(partnerOrgs, eq(partnerApiKeys.orgId, partnerOrgs.id))
    .where(eq(partnerApiKeys.keyHash, keyHash))
    .limit(1);

  if (!row) return null;
  if (row.key.revokedAt) return null;
  if (row.org.status !== "active") return null;

  // Touch lastUsedAt without blocking the response.
  void db
    .update(partnerApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(partnerApiKeys.id, row.key.id))
    .catch(() => {});

  return { org: row.org, keyId: row.key.id };
}

/**
 * Builds an org-scoped PartnerContext for an API key, so the existing read
 * models (which only read `kind` + `org.id`) can serve API responses with the
 * same scoping as the org-owner UI.
 */
export function apiOrgContext(org: PartnerOrg): PartnerContext {
  return {
    userId: `apikey:${org.id}`,
    kind: "org",
    org,
    rep: null,
    role: "admin",
  };
}
