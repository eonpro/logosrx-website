import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { employmentApplications } from "@/lib/db/schema";
import { sanitizeFilename } from "@/lib/security/filename";
import { detectResumeMime } from "@/lib/security/file-type";
import { checkSameOrigin } from "@/lib/security/origin";
import {
  HONEYPOT_FIELD,
  isHoneypotTripped,
  rateLimit,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_FIELD_LENGTH = 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getField(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_FIELD_LENGTH) return null;
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const originCheck = checkSameOrigin(req);
    if (!originCheck.ok) {
      return bad("Forbidden", 403);
    }

    const limit = await rateLimit("resume", req);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders(limit) },
      );
    }

    const formData = await req.formData();

    if (isHoneypotTripped(formData.get(HONEYPOT_FIELD))) {
      // Silently succeed — don't reveal that we detected the bot.
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const firstName = getField(formData, "firstName");
    const lastName = getField(formData, "lastName");
    const email = getField(formData, "email");
    const phone = getField(formData, "phone");
    const position = getField(formData, "position");
    const referralSource = getField(formData, "referralSource");
    const willingToRelocate = getField(formData, "willingToRelocate");
    const resume = formData.get("resume");

    if (!firstName || !lastName || !email || !phone || !position) {
      return bad(
        "First name, last name, email, phone, and position are required.",
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return bad("Invalid email address.");
    }

    let resumePathname: string | null = null;
    let resumeFilename: string | null = null;
    let resumeContentType: string | null = null;

    if (resume instanceof File && resume.size > 0) {
      if (!ALLOWED_TYPES.includes(resume.type)) {
        return bad("Resume must be a PDF, DOC, or DOCX file.");
      }
      if (resume.size > MAX_FILE_SIZE) {
        return bad("Resume must be under 25 MB.");
      }

      // Magic-byte verification: the browser-supplied `resume.type` is just a
      // hint derived from the filename, so an attacker could rename a `.exe`
      // to `.pdf`. We trust only the actual leading bytes.
      const verifiedType = await detectResumeMime(resume);
      if (!verifiedType) {
        return bad(
          "Resume must be a valid PDF, DOC, or DOCX file.",
        );
      }

      // NOTE: S4b will add a virus scan here once the ClamAV Lambda endpoint
      // is provisioned (see scratchpad → S4b).

      const safeName = sanitizeFilename(resume.name);
      // Random UUID prefix prevents path enumeration; the original (sanitized)
      // filename is kept as a leaf so admin downloads carry a meaningful name.
      const pathname = `resumes/${randomUUID()}/${safeName}`;

      const blob = await put(pathname, resume, {
        access: "private",
        addRandomSuffix: false,
        contentType: verifiedType,
        // 1 year — these are reviewed by humans, not refetched in hot loops.
        cacheControlMaxAge: 60 * 60 * 24 * 365,
      });

      resumePathname = blob.pathname;
      resumeFilename = safeName;
      resumeContentType = verifiedType;
    }

    const [inserted] = await db
      .insert(employmentApplications)
      .values({
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        position,
        referralSource,
        willingToRelocate,
        resumePathname,
        resumeFilename,
        resumeContentType,
      })
      .returning({ id: employmentApplications.id });

    return NextResponse.json({ success: true, id: inserted.id }, { status: 201 });
  } catch {
    // PII-safe: never echo the user-submitted payload back into logs.
    console.error("[api/applications] submit failed");
    return bad("Something went wrong. Please try again.", 500);
  }
}
