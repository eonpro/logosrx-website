"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerOrgs } from "@/lib/db/schema";
import { notifyNewPartnerApplication } from "@/lib/notifications/slack";
import { isClerkPhoneTaken } from "@/lib/partners/provision";
import { runAfterResponse } from "@/lib/runtime/after";
import {
  clientKeyFromHeaders,
  rateLimitKey,
} from "@/lib/security/rate-limit";

const PHONE_IN_USE =
  "Another account is already using this phone number. Please enter a different one.";

export interface PartnerApplicationInput {
  orgName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
}

export interface PartnerApplicationResult {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public submission for the affiliate program. Creates a `pending` partner
 * org; an admin reviews it at `/admin/partners`, sets the commission rate,
 * and approves it (which provisions the Clerk login + activation email).
 */
export async function submitPartnerApplication(
  input: PartnerApplicationInput,
): Promise<PartnerApplicationResult> {
  const requestHeaders = await headers();
  try {
    const limit = await rateLimitKey(
      "form",
      `partner-apply:${clientKeyFromHeaders(requestHeaders)}`,
    );
    if (!limit.success) {
      return {
        ok: false,
        error: "Too many attempts. Please wait a minute and try again.",
      };
    }
  } catch {
    // Fail open: a rate-limiter backend issue must never block applications.
    console.error("[partners] rate-limit check failed; allowing request");
  }

  const orgName = input.orgName.trim().slice(0, 200);
  const contactName = input.contactName.trim().slice(0, 200);
  const email = input.email.trim().toLowerCase().slice(0, 255);
  const phone = input.phone.trim().slice(0, 30);
  const website = input.website.trim().slice(0, 255);
  const notes = input.notes.trim().slice(0, 4000);

  if (!orgName || !contactName || !email || !phone) {
    return {
      ok: false,
      error: "Organization name, contact name, email, and phone are required.",
    };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (phone.replace(/\D/g, "").length < 7) {
    return { ok: false, error: "Please enter a valid phone number." };
  }

  // Phone numbers are unique account identifiers (enforced by the auth
  // provider). Reject a duplicate at submission so the applicant can fix it
  // here, rather than failing later at approval. Checked against existing
  // partner applications/orgs and against existing accounts.
  if (await isClerkPhoneTaken(phone)) {
    return { ok: false, error: PHONE_IN_USE };
  }

  try {
    const [existing] = await db
      .select({ id: partnerOrgs.id, status: partnerOrgs.status })
      .from(partnerOrgs)
      .where(eq(partnerOrgs.contactEmail, email))
      .limit(1);
    if (existing) {
      return {
        ok: false,
        error:
          existing.status === "pending"
            ? "An application with this email is already under review."
            : "A partner account with this email already exists. Try signing in.",
      };
    }

    const [phoneOrg] = await db
      .select({ id: partnerOrgs.id })
      .from(partnerOrgs)
      .where(eq(partnerOrgs.contactPhone, phone))
      .limit(1);
    if (phoneOrg) {
      return { ok: false, error: PHONE_IN_USE };
    }

    await db.insert(partnerOrgs).values({
      name: orgName,
      contactName,
      contactEmail: email,
      contactPhone: phone || null,
      website: website || null,
      notes: notes || null,
      status: "pending",
    });
  } catch (err) {
    console.error("[partners] application insert failed:", err);
    return {
      ok: false,
      error: "Could not submit your application. Please try again.",
    };
  }

  runAfterResponse(
    notifyNewPartnerApplication({
      orgName,
      contactName,
      contactEmail: email,
      contactPhone: phone,
      website,
    }),
  );

  return { ok: true };
}
