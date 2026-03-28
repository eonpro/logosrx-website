import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clinicSignups } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { clinicName, contactName, email, phone, npiNumber, state, specialty, message } =
      body as Record<string, string | undefined>;

    if (!clinicName || !contactName || !email || !phone) {
      return NextResponse.json(
        { error: "Clinic name, contact name, email, and phone are required." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }

    const [inserted] = await db
      .insert(clinicSignups)
      .values({
        clinicName: clinicName.trim(),
        contactName: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        npiNumber: npiNumber?.trim() || null,
        state: state?.trim() || null,
        specialty: specialty?.trim() || null,
        message: message?.trim() || null,
      })
      .returning({ id: clinicSignups.id });

    return NextResponse.json({ success: true, id: inserted.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit clinic signup:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
