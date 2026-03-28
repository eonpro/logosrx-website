import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { employmentApplications } from "@/lib/db/schema";
import { put } from "@vercel/blob";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const firstName = formData.get("firstName") as string | null;
    const lastName = formData.get("lastName") as string | null;
    const email = formData.get("email") as string | null;
    const phone = formData.get("phone") as string | null;
    const position = formData.get("position") as string | null;
    const referralSource = formData.get("referralSource") as string | null;
    const willingToRelocate = formData.get("willingToRelocate") as string | null;
    const resume = formData.get("resume") as File | null;

    if (!firstName || !lastName || !email || !phone || !position) {
      return NextResponse.json(
        { error: "First name, last name, email, phone, and position are required." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }

    let resumeUrl: string | null = null;
    let resumeFilename: string | null = null;

    if (resume && resume.size > 0) {
      if (!ALLOWED_TYPES.includes(resume.type)) {
        return NextResponse.json(
          { error: "Resume must be a PDF, DOC, or DOCX file." },
          { status: 400 },
        );
      }
      if (resume.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Resume must be under 25 MB." },
          { status: 400 },
        );
      }

      const blob = await put(`resumes/${Date.now()}-${resume.name}`, resume, {
        access: "public",
      });
      resumeUrl = blob.url;
      resumeFilename = resume.name;
    }

    const [inserted] = await db
      .insert(employmentApplications)
      .values({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        position: position.trim(),
        referralSource: referralSource?.trim() || null,
        willingToRelocate: willingToRelocate?.trim() || null,
        resumeUrl,
        resumeFilename,
      })
      .returning({ id: employmentApplications.id });

    return NextResponse.json({ success: true, id: inserted.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit application:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
