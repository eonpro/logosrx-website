import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { getAppSecret } from "@/lib/security/secret";

/**
 * Cryptographic helpers for password-gated pricing quotes.
 *
 *   - Public link token: an unguessable, URL-safe slug (`/quote/<token>`).
 *   - Quote password: a short, human-readable code an admin shares out-of-band.
 *     Only its scrypt hash is persisted; the plaintext is shown once.
 *   - Access cookie: a stateless, HMAC-signed grant proving the correct password
 *     was entered for a given token (so the recipient isn't re-prompted on every
 *     navigation). Short-lived.
 *   - Claim cookie: an HMAC-signed pointer carried from "Accept" through account
 *     creation so the new clinic gets the quoted pricing.
 *
 * No external dependencies — everything is built on `node:crypto`.
 */

export const QUOTE_ACCESS_COOKIE = "quote_access";
export const QUOTE_CLAIM_COOKIE = "quote_claim";

/** Access grant lifetime: long enough to read + accept, short enough to be safe. */
export const ACCESS_TTL_SECONDS = 60 * 60 * 2; // 2 hours
/** Claim pointer lifetime: long enough to finish the onboarding wizard. */
export const CLAIM_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// Unambiguous alphabets (no 0/O/1/I/L) so codes are easy to read aloud / type.
const TOKEN_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Generates an unguessable, URL-safe quote link token (~24 chars, base32-ish). */
export function generateQuoteToken(length = 24): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)];
  }
  return out;
}

/**
 * Generates a readable quote password, e.g. `7HFK-Q3MN-XP9R`. Three groups of
 * four characters from an unambiguous alphabet — strong enough to gate a link
 * while still being phone/SMS friendly.
 */
export function generateQuotePassword(groups = 3, groupLen = 4): string {
  const parts: string[] = [];
  for (let g = 0; g < groups; g++) {
    let part = "";
    for (let i = 0; i < groupLen; i++) {
      part += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
    }
    parts.push(part);
  }
  return parts.join("-");
}

/** Hashes a quote password with scrypt. Serialized as `saltHex:hashHex`. */
export function hashQuotePassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(normalizePassword(password), salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** Constant-time verification of a quote password against a stored hash. */
export function verifyQuotePassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = (stored ?? "").split(":");
  if (!saltHex || !hashHex) return false;
  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = Buffer.from(hashHex, "hex");
    actual = scryptSync(normalizePassword(password), Buffer.from(saltHex, "hex"), expected.length);
  } catch {
    return false;
  }
  if (expected.length !== actual.length || expected.length === 0) return false;
  return timingSafeEqual(expected, actual);
}

/**
 * Quote passwords are case-insensitive and ignore the group separators, so a
 * recipient typing `7hfkq3mnxp9r` or `7HFK-Q3MN-XP9R` both work.
 */
function normalizePassword(password: string): string {
  return (password ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ---------------------------------------------------------------------------
// HMAC-signed cookies
// ---------------------------------------------------------------------------

let cachedKey: Buffer | null = null;

/**
 * Derives a stable HMAC key from the app's master secret. Throws in production
 * when the secret is unset (via `getAppSecret`) so quote cookies can never be
 * signed with a publicly-known development key.
 */
function hmacKey(): Buffer {
  if (cachedKey) return cachedKey;
  cachedKey = createHash("sha256").update(`quote-hmac:${getAppSecret()}`).digest();
  return cachedKey;
}

function sign(payload: string): string {
  return createHmac("sha256", hmacKey()).update(payload).digest("base64url");
}

function safeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Builds a signed access-cookie value granting the bearer access to `token`. */
export function signQuoteAccess(token: string, ttlSeconds = ACCESS_TTL_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = `${token}.${exp}`;
  return `${body}.${sign(body)}`;
}

/** Verifies a signed access-cookie value matches `token` and hasn't expired. */
export function verifyQuoteAccess(value: string | undefined, token: string): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [tok, expStr, mac] = parts;
  const body = `${tok}.${expStr}`;
  if (!safeEqualStr(mac, sign(body))) return false;
  if (tok !== token) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  return true;
}

/** Builds a signed claim-cookie value pointing at an accepted quote. */
export function signQuoteClaim(
  quoteId: number,
  token: string,
  ttlSeconds = CLAIM_TTL_SECONDS,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = `${quoteId}.${token}.${exp}`;
  return `${body}.${sign(body)}`;
}

export interface QuoteClaim {
  quoteId: number;
  token: string;
}

/** Verifies a signed claim-cookie value and returns its payload, or null. */
export function verifyQuoteClaim(value: string | undefined): QuoteClaim | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [idStr, token, expStr, mac] = parts;
  const body = `${idStr}.${token}.${expStr}`;
  if (!safeEqualStr(mac, sign(body))) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  const quoteId = Number(idStr);
  if (!Number.isInteger(quoteId) || quoteId <= 0) return null;
  return { quoteId, token };
}
