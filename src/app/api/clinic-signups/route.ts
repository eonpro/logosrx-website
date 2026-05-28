import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clinicSignups } from "@/lib/db/schema";
import { checkSameOrigin } from "@/lib/security/origin";
import {
  HONEYPOT_FIELD,
  isHoneypotTripped,
  rateLimit,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024; // 16 KB — plenty for this form, blocks abuse.

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function clean(value: unknown, maxLength = 1024): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) return null;
  return trimmed;
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

    const clinicName = clean(body.clinicName, 200);
    const contactName = clean(body.contactName, 200);
    const email = clean(body.email, 255);
    const phone = clean(body.phone, 30);
    const npiNumber = clean(body.npiNumber, 20);
    const state = clean(body.state, 50);
    const specialty = clean(body.specialty, 100);
    const message = clean(body.message, 4000);

    if (!clinicName || !contactName || !email || !phone) {
      return bad(
        "Clinic name, contact name, email, and phone are required.",
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return bad("Invalid email address.");
    }

    const [inserted] = await db
      .insert(clinicSignups)
      .values({
        clinicName,
        contactName,
        email: email.toLowerCase(),
        phone,
        npiNumber,
        state,
        specialty,
        message,
      })
      .returning({ id: clinicSignups.id });

    return NextResponse.json({ success: true, id: inserted.id }, { status: 201 });
  } catch {
    console.error("[api/clinic-signups] submit failed");
    return bad("Something went wrong. Please try again.", 500);
  }
}
