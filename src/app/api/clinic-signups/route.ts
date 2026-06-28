import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clinicSignups } from "@/lib/db/schema";
import { resolveReferralCode } from "@/lib/partners/attribution";
import { REF_COOKIE } from "@/lib/partners/referral";
import { checkSameOrigin } from "@/lib/security/origin";
import {
  HONEYPOT_FIELD,
  isHoneypotTripped,
  rateLimit,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";
import { log } from "@/lib/observability/logger";
import { clinicSignupSchema, parseForm } from "@/lib/validation/forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024; // 16 KB — plenty for this form, blocks abuse.

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const originCheck = checkSameOrigin(req);
    if (!originCheck.ok) return bad("Forbidden", 403);

    const limit = await rateLimit("form", req);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders(limit) },
      );
    }

    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) return bad("Payload too large", 413);

    const body = (await req.json()) as Record<string, unknown>;

    if (isHoneypotTripped(body[HONEYPOT_FIELD])) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const parsed = parseForm(clinicSignupSchema, body);
    if (!parsed.ok) return bad(parsed.error);
    const { clinicName, contactName, email, phone, npiNumber, state, specialty, message } =
      parsed.data;

    // Partner referral attribution from the /join/<code> cookie, if present.
    const attribution = await resolveReferralCode(
      req.cookies.get(REF_COOKIE)?.value,
    );

    const [inserted] = await db
      .insert(clinicSignups)
      .values({
        clinicName,
        contactName,
        email,
        phone,
        npiNumber,
        state,
        specialty,
        message,
        referralLinkId: attribution?.referralLinkId ?? null,
        partnerOrgId: attribution?.partnerOrgId ?? null,
        partnerRepId: attribution?.partnerRepId ?? null,
      })
      .returning({ id: clinicSignups.id });

    return NextResponse.json({ success: true, id: inserted.id }, { status: 201 });
  } catch (err) {
    // PII-safe: log the error (not the submitted payload) and surface to Sentry.
    log.error("clinic-signups submit failed", { error: err });
    return bad("Something went wrong. Please try again.", 500);
  }
}
