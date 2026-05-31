import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";

/**
 * AES-256-GCM helpers for encrypting sensitive onboarding fields (card number,
 * CVV) at rest. This is defense-in-depth around a deliberate, non-PCI-compliant
 * product decision to store raw card data; it does NOT make storage compliant.
 *
 * Key source: `ONBOARDING_ENCRYPTION_KEY` env var. Accepts a 32-byte key as
 * base64 or hex; any other value is hashed to 32 bytes with SHA-256 so the app
 * still boots in dev. In production a strong, dedicated key MUST be set.
 *
 * Serialized format (single base64 string): iv(12) || authTag(16) || ciphertext
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

let cachedKey: Buffer | null = null;

function resolveKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.ONBOARDING_ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ONBOARDING_ENCRYPTION_KEY is required in production to encrypt payment data.",
      );
    }
    // Dev-only deterministic fallback so the wizard works without secrets.
    cachedKey = createHash("sha256").update("logos-dev-fallback-key").digest();
    return cachedKey;
  }

  let key: Buffer | null = null;
  // Try base64 then hex; require exactly 32 bytes to use directly.
  for (const enc of ["base64", "hex"] as const) {
    try {
      const buf = Buffer.from(raw, enc);
      if (buf.length === KEY_BYTES) {
        key = buf;
        break;
      }
    } catch {
      // fall through to hashing
    }
  }
  // Any other input: derive a stable 32-byte key via SHA-256.
  cachedKey = key ?? createHash("sha256").update(raw).digest();
  return cachedKey;
}

/** Encrypts a UTF-8 string. Returns base64 (iv|tag|ciphertext), or null for empty input. */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, resolveKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

/** Decrypts a value produced by `encrypt`. Returns null on empty/invalid input. */
export function decrypt(payload: string | null | undefined): string | null {
  if (payload == null || payload === "") return null;
  try {
    const buf = Buffer.from(payload, "base64");
    const iv = buf.subarray(0, IV_BYTES);
    const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES);
    const decipher = createDecipheriv(ALGORITHM, resolveKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
