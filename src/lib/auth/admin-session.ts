/**
 * HMAC-signed admin session, usable on the Edge (`src/proxy.ts`) and Node.
 *
 * The proxy is the auth authority: it resolves the caller's email (JWT claim,
 * existing cookie, or a one-time Clerk lookup), checks the allowlist, and
 * forwards a signed token as both a cookie and an internal request header.
 * Pages verify that token — they never need the Clerk Backend API on a warm
 * session.
 *
 * Cookie stores `{ userId, email, exp }` only. Role is recomputed from the
 * env allowlist on every request so removing someone takes effect immediately.
 */

import { getAppSecret } from "@/lib/security/secret";

export const ADMIN_SESSION_COOKIE = "lr_admin_session";
/** Set by the proxy on the *request* so the first response can verify too. */
export const ADMIN_SESSION_HEADER = "x-admin-session";

export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;
/** Refresh the cookie when fewer than this many seconds remain. */
const REFRESH_WITHIN_SECONDS = 60 * 60;

export type AdminSessionPayload = {
  userId: string;
  email: string;
  exp: number;
};

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

let cachedKey: CryptoKey | null = null;

async function hmacKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const material = new TextEncoder().encode(`admin-session-hmac:${getAppSecret()}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  cachedKey = await crypto.subtle.importKey(
    "raw",
    digest,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return cachedKey;
}

async function sign(body: string): Promise<string> {
  const key = await hmacKey();
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return toBase64Url(new Uint8Array(mac));
}

export async function signAdminSession(
  userId: string,
  email: string,
  ttlSeconds = ADMIN_SESSION_TTL_SECONDS,
): Promise<string> {
  const payload: AdminSessionPayload = {
    userId,
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await sign(body)}`;
}

export async function verifyAdminSession(
  value: string | undefined | null,
  userId: string,
): Promise<AdminSessionPayload | null> {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  if (!safeEqual(mac, await sign(body))) return null;

  try {
    const parsed = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as Partial<AdminSessionPayload>;
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    if (parsed.userId !== userId) return null;
    if (parsed.exp * 1000 < Date.now()) return null;
    if (!parsed.email.includes("@")) return null;
    return { userId: parsed.userId, email: parsed.email, exp: parsed.exp };
  } catch {
    return null;
  }
}

export function shouldRefreshAdminSession(payload: AdminSessionPayload): boolean {
  const remaining = payload.exp - Math.floor(Date.now() / 1000);
  return remaining < REFRESH_WITHIN_SECONDS;
}

export function adminSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
    // Local http://localhost must be able to store the session; Vercel is HTTPS.
    secure: process.env.NODE_ENV === "production",
  };
}
