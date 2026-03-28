import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailSignups } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email?: string };

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }

    await db
      .insert(emailSignups)
      .values({ email: email.trim().toLowerCase() })
      .onConflictDoNothing({ target: emailSignups.email });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit email signup:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
