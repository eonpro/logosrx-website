"use server";

import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pricingQuotes } from "@/lib/db/schema";
import { getQuoteWithItemsByToken, isQuoteOpenable } from "@/lib/quotes/data";
import {
  ACCESS_TTL_SECONDS,
  CLAIM_TTL_SECONDS,
  QUOTE_ACCESS_COOKIE,
  QUOTE_CLAIM_COOKIE,
  signQuoteAccess,
  signQuoteClaim,
  verifyQuoteAccess,
  verifyQuotePassword,
} from "@/lib/quotes/crypto";
import { clientKeyFromHeaders, rateLimitKey } from "@/lib/security/rate-limit";

export interface UnlockResult {
  ok: boolean;
  error?: string;
}

const isProd = process.env.NODE_ENV === "production";

/**
 * Verifies the password for a quote link. On success, sets a short-lived,
 * HMAC-signed httpOnly cookie granting access so the recipient isn't re-prompted
 * on every navigation. Rate-limited per caller to blunt brute-force attempts.
 */
export async function unlockQuote(
  token: string,
  password: string,
): Promise<UnlockResult> {
  const clean = (token ?? "").trim().toLowerCase();
  if (!clean) return { ok: false, error: "Invalid link." };

  try {
    const h = await headers();
    const limit = await rateLimitKey(
      "form",
      `quote-unlock:${clean}:${clientKeyFromHeaders(h)}`,
    );
    if (!limit.success) {
      return {
        ok: false,
        error: "Too many attempts. Please wait a minute and try again.",
      };
    }
  } catch {
    // Fail open: a limiter hiccup must not lock a legitimate recipient out.
  }

  const data = await getQuoteWithItemsByToken(clean);
  if (!data || !isQuoteOpenable(data.quote)) {
    return { ok: false, error: "This quote is no longer available." };
  }

  if (!password || !verifyQuotePassword(password, data.quote.passwordHash)) {
    return { ok: false, error: "Incorrect password. Please try again." };
  }

  const store = await cookies();
  store.set(QUOTE_ACCESS_COOKIE, signQuoteAccess(clean), {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TTL_SECONDS,
  });

  // Stamp first-view time (best-effort, once).
  if (!data.quote.viewedAt) {
    try {
      await db
        .update(pricingQuotes)
        .set({ viewedAt: new Date() })
        .where(eq(pricingQuotes.id, data.quote.id));
    } catch {
      // non-critical
    }
  }

  return { ok: true };
}

export interface AcceptResult {
  ok: boolean;
  error?: string;
  next?: string;
}

/**
 * Records acceptance of a quote and arms the signed `quote_claim` cookie so the
 * quoted pricing follows the recipient into account creation. Requires a valid
 * access grant for this token (i.e. the password was entered).
 */
export async function acceptQuote(token: string): Promise<AcceptResult> {
  const clean = (token ?? "").trim().toLowerCase();
  if (!clean) return { ok: false, error: "Invalid link." };

  try {
    const h = await headers();
    const limit = await rateLimitKey(
      "form",
      `quote-accept:${clean}:${clientKeyFromHeaders(h)}`,
    );
    if (!limit.success) {
      return {
        ok: false,
        error: "Too many attempts. Please wait a minute and try again.",
      };
    }
  } catch {
    // Fail open: a limiter hiccup must not block a legitimate acceptance.
  }

  const store = await cookies();
  if (!verifyQuoteAccess(store.get(QUOTE_ACCESS_COOKIE)?.value, clean)) {
    return { ok: false, error: "Please re-enter the password to continue." };
  }

  const data = await getQuoteWithItemsByToken(clean);
  if (!data || !isQuoteOpenable(data.quote)) {
    return { ok: false, error: "This quote is no longer available." };
  }

  try {
    // Only advance an `active` quote to `accepted`; never downgrade a claimed one.
    if (data.quote.status === "active") {
      await db
        .update(pricingQuotes)
        .set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() })
        .where(eq(pricingQuotes.id, data.quote.id));
    }
  } catch {
    // non-critical — the claim cookie is what binds pricing on signup
  }

  store.set(QUOTE_CLAIM_COOKIE, signQuoteClaim(data.quote.id, clean), {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: CLAIM_TTL_SECONDS,
  });

  return { ok: true, next: "/onboarding" };
}
