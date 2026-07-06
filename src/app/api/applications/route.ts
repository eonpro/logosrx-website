import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";
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
import { log } from "@/lib/observability/logger";
import {
  employmentApplicationSchema,
  parseForm,
} from "@/lib/validation/forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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

    const parsed = parseForm(employmentApplicationSchema, {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      position: formData.get("position"),
      referralSource: formData.get("referralSource"),
      willingToRelocate: formData.get("willingToRelocate"),
    });
    if (!parsed.ok) return bad(parsed.error);
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      referralSource,
      willingToRelocate,
    } = parsed.data;
    const resume = formData.get("resume");

    let resumePathname: string | null = null;
    let resumeFilename: string | null = null;
    let resumeContentType: string | null = null;
    // Tracked separately so we can delete the uploaded blob if the row insert
    // below fails — otherwise a failed insert leaks an orphaned private blob.
    let resumeBlobUrl: string | null = null;

    if (resume instanceof File && resume.size > 0) {
      if (resume.size > MAX_FILE_SIZE) {
        return bad("Resume must be under 25 MB.");
      }

      // Content verification only: the browser-supplied `resume.type` is just
      // a hint derived from the filename — spoofable in both directions (a
      // renamed `.exe`, or a legit PDF sent as `application/octet-stream`).
      // We trust only the actual bytes: magic numbers plus container
      // structure for the Office formats.
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
      resumeBlobUrl = blob.url;
    }

    let inserted: { id: number };
    try {
      [inserted] = await db
        .insert(employmentApplications)
        .values({
        firstName,
        lastName,
        email,
        phone,
          position,
          referralSource,
          willingToRelocate,
          resumePathname,
          resumeFilename,
          resumeContentType,
        })
        .returning({ id: employmentApplications.id });
    } catch (err) {
      // The blob upload already succeeded; without this compensating delete a
      // failed insert would leave an unreferenced private blob behind forever.
      if (resumeBlobUrl) {
        await del(resumeBlobUrl).catch(() => {});
      }
      throw err;
    }

    return NextResponse.json({ success: true, id: inserted.id }, { status: 201 });
  } catch (err) {
    // PII-safe: log the error (not the user-submitted payload) and report it.
    log.error("applications submit failed", { error: err });
    return bad("Something went wrong. Please try again.", 500);
  }
}
