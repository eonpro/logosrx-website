import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import {
  buildActivateUrl,
  clerkErrorMessage,
  deriveUsername,
  toE164,
} from "@/lib/auth/clerk-users";

/**
 * Clerk account provisioning for partner orgs and reps.
 *
 * Partners never choose a password up front (an org is approved by an admin;
 * a rep is invited by their org), so we create the Clerk user with a random
 * throwaway password and email a one-time activation link. The `/activate`
 * page consumes the ticket, signs them in, and lets them set a real password
 * — the exact flow rep-onboarded clinics already use.
 */

/** Random, never-disclosed placeholder password (activation replaces it). */
function randomPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

export class PartnerProvisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PartnerProvisionError";
  }
}

/**
 * Creates the Clerk user backing a partner login. Throws
 * `PartnerProvisionError` with a safe, user-facing message on failure.
 */
export async function createPartnerClerkUser(args: {
  email: string;
  name: string;
  phone?: string | null;
}): Promise<string> {
  const client = await clerkClient();
  const [firstName, ...rest] = args.name.trim().split(/\s+/);
  const lastName = rest.join(" ");
  const phoneNumber = toE164(args.phone);

  try {
    const user = await client.users.createUser({
      emailAddress: [args.email.trim().toLowerCase()],
      username: deriveUsername(args.email, "partner"),
      phoneNumber: phoneNumber ? [phoneNumber] : undefined,
      password: randomPassword(),
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      skipLegalChecks: true,
    });
    return user.id;
  } catch (err) {
    console.error("[partners] createUser failed");
    throw new PartnerProvisionError(
      clerkErrorMessage(err, "Could not create the account."),
    );
  }
}

/**
 * Partner-flavored activation link: same one-time-ticket flow as clinics, but
 * landing in the partner portal after the password is set.
 */
export async function buildPartnerActivateUrl(
  clerkUserId: string,
): Promise<string | null> {
  return buildActivateUrl(clerkUserId, { next: "/partners" });
}
