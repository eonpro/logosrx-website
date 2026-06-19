import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { referralLinks } from "@/lib/db/schema";
import {
  REF_COOKIE,
  REF_COOKIE_MAX_AGE_SECONDS,
  isValidReferralCode,
} from "@/lib/partners/referral";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public referral-link landing: `/join/<code>`.
 *
 * Records the click, drops the code into a 90-day cookie, and forwards the
 * visitor into clinic onboarding. Attribution is applied at signup time (see
 * `stampClinicAttribution`), so the cookie — not this redirect — is the
 * source of truth. Unknown or deactivated codes still land on onboarding,
 * just without the cookie: a dead partner link should never dead-end a
 * prospective clinic.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: raw } = await params;
  const code = raw?.toLowerCase() ?? "";

  const destination = new URL("/onboarding", req.nextUrl.origin);
  const redirect = NextResponse.redirect(destination, { status: 307 });

  if (!isValidReferralCode(code)) return redirect;

  try {
    const [link] = await db
      .select({ id: referralLinks.id, active: referralLinks.active })
      .from(referralLinks)
      .where(eq(referralLinks.code, code))
      .limit(1);

    if (!link || !link.active) return redirect;

    // Click counter is best-effort telemetry; don't await-fail the redirect.
    await db
      .update(referralLinks)
      .set({ clickCount: sql`${referralLinks.clickCount} + 1` })
      .where(eq(referralLinks.id, link.id));

    redirect.cookies.set(REF_COOKIE, code, {
      maxAge: REF_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } catch {
    console.error("[join] referral redirect lookup failed");
  }

  return redirect;
}
