import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import {
  buildActivateUrl,
  clerkErrorMessage,
  deriveUsername,
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

/** Returns the id of an existing Clerk user with this email, or null. */
async function findClerkUserIdByEmail(
  client: Awaited<ReturnType<typeof clerkClient>>,
  email: string,
): Promise<string | null> {
  try {
    // Clerk Backend SDK returns a paginated `{ data, totalCount }` object;
    // older shapes returned a bare array — handle both defensively.
    const res = (await client.users.getUserList({
      emailAddress: [email],
    })) as unknown;
    const list = Array.isArray(res)
      ? res
      : ((res as { data?: Array<{ id: string }> })?.data ?? []);
    return list[0]?.id ?? null;
  } catch {
    return null;
  }
}

/** First Clerk error code + which identifier it was about, if any. */
function clerkErrorInfo(err: unknown): { code?: string; param?: string; message?: string } {
  if (err && typeof err === "object" && "errors" in err) {
    const first = (
      err as {
        errors?: Array<{
          code?: string;
          message?: string;
          longMessage?: string;
          meta?: { paramName?: string };
        }>;
      }
    ).errors?.[0];
    if (first) {
      return {
        code: first.code,
        param: first.meta?.paramName,
        message: first.longMessage || first.message,
      };
    }
  }
  return {};
}

/**
 * Provisions (or reuses) the Clerk user backing a partner login.
 *
 * Approval/invite must be idempotent: if a Clerk account already exists for the
 * email — a prior approval attempt, a re-application, or because the person
 * already has a Logos account — we link to that existing user instead of
 * failing. Only when no user exists do we create one (with a throwaway
 * password; activation sets the real one).
 *
 * Note: we deliberately do NOT send a phone number to Clerk. The instance does
 * not accept `phone_number` on user creation ("data doesn't match user
 * requirements set for this instance"), and the phone isn't needed for login —
 * it's already stored on the partner org. Throws `PartnerProvisionError` with a
 * safe, specific message on genuine failure.
 */
export async function createPartnerClerkUser(args: {
  email: string;
  name: string;
  /** Accepted for call-site compatibility; intentionally not sent to Clerk. */
  phone?: string | null;
}): Promise<string> {
  const client = await clerkClient();
  const email = args.email.trim().toLowerCase();
  const [firstName, ...rest] = args.name.trim().split(/\s+/);
  const lastName = rest.join(" ");

  // Reuse an existing account if one already has this email.
  const existingId = await findClerkUserIdByEmail(client, email);
  if (existingId) return existingId;

  try {
    const user = await client.users.createUser({
      emailAddress: [email],
      username: deriveUsername(email, "partner"),
      password: randomPassword(),
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      skipLegalChecks: true,
    });
    return user.id;
  } catch (err) {
    // The email now exists (a race with another approval) — link to it.
    const linked = await findClerkUserIdByEmail(client, email);
    if (linked) return linked;

    const info = clerkErrorInfo(err);
    console.error("[partners] createUser failed:", err);
    // Surface the actual offending field so the cause is unambiguous.
    throw new PartnerProvisionError(
      info.message
        ? `Could not create the account: ${info.message}${info.param ? ` (${info.param})` : ""}`
        : clerkErrorMessage(err, "Could not create the account."),
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
