import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailSignups } from "@/lib/db/schema";
import { checkSameOrigin } from "@/lib/security/origin";
import {
  HONEYPOT_FIELD,
  isHoneypotTripped,
  rateLimit,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";
import { log } from "@/lib/observability/logger";
import { emailSignupSchema, parseForm } from "@/lib/validation/forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2 * 1024; // 2 KB — single email field, no need for more.

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const originCheck = checkSameOrigin(req);
    if (!originCheck.ok) return bad("Forbidden", 403);

    const limit = await rateLimit("email", req);
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

    const parsed = parseForm(emailSignupSchema, body);
    if (!parsed.ok) return bad(parsed.error);

    await db
      .insert(emailSignups)
      .values({ email: parsed.data.email })
      .onConflictDoNothing({ target: emailSignups.email });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    log.error("email-signups submit failed", { error: err });
    return bad("Something went wrong. Please try again.", 500);
  }
}
