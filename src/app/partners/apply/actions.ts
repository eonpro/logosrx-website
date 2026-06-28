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
import { log } from "@/lib/observability/logger";
import { parseForm, partnerApplicationSchema } from "@/lib/validation/forms";

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
  } catch (err) {
    // Fail open: a rate-limiter backend issue must never block applications.
    log.warn("partner apply rate-limit check failed; allowing request", {
      error: err instanceof Error ? err.message : "unknown",
    });
  }

  const parsed = parseForm(partnerApplicationSchema, input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const { orgName, contactName, email, phone } = parsed.data;
  // Optional fields normalize to null in the schema; keep local empty-string
  // forms for the notify payload (which expects strings).
  const website = parsed.data.website ?? "";
  const notes = parsed.data.notes ?? "";

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
    log.error("partner application insert failed", { error: err });
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
