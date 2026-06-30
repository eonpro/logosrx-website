import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import {
  buildActivateUrl,
  clerkErrorMessage,
  deriveUsername,
  markPrimaryEmailVerified,
  toE164,
} from "@/lib/auth/clerk-users";
import { log } from "@/lib/observability/logger";

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

/**
 * Whether a Clerk user already exists with this phone number. The auth instance
 * treats phone numbers as unique account identifiers, so the public application
 * form uses this to reject a duplicate up front with a clear message. Returns
 * `false` on any lookup error so a Clerk hiccup never blocks an application.
 */
export async function isClerkPhoneTaken(
  phone: string | null | undefined,
): Promise<boolean> {
  const e164 = toE164(phone);
  if (!e164) return false;
  try {
    const client = await clerkClient();
    const res = (await client.users.getUserList({
      phoneNumber: [e164],
    })) as unknown;
    const list = Array.isArray(res)
      ? res
      : ((res as { data?: unknown[] })?.data ?? []);
    return list.length > 0;
  } catch {
    return false;
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
 * The auth instance requires (and uniquely indexes) a phone number, so we send
 * the org's phone. Phone uniqueness is validated up front on the application
 * form (`isClerkPhoneTaken`); if a duplicate still reaches here, we surface a
 * clear "phone already in use" message so an admin can edit the org's contact
 * details to a unique number and re-approve. Throws `PartnerProvisionError`
 * with a safe, specific message on genuine failure.
 */
export async function createPartnerClerkUser(args: {
  email: string;
  name: string;
  phone?: string | null;
  /**
   * Optional admin/owner-chosen initial password. When provided, the account is
   * created with it (and its email marked verified) so the partner can sign in
   * immediately with handed-over credentials instead of an activation link.
   * Omit to keep the throwaway-password + activation-link flow.
   */
  password?: string | null;
}): Promise<string> {
  const client = await clerkClient();
  const email = args.email.trim().toLowerCase();
  const [firstName, ...rest] = args.name.trim().split(/\s+/);
  const lastName = rest.join(" ");
  const phoneNumber = toE164(args.phone);
  const initialPassword = args.password?.trim() || null;

  // Reuse an existing account if one already has this email. When an initial
  // password was supplied, apply it to that account too so the caller's intent
  // (sign in with these credentials) holds regardless of who created it first.
  const existingId = await findClerkUserIdByEmail(client, email);
  if (existingId) {
    if (initialPassword) {
      try {
        await client.users.updateUser(existingId, { password: initialPassword });
        await markPrimaryEmailVerified(client, existingId);
      } catch (err) {
        const info = clerkErrorInfo(err);
        throw new PartnerProvisionError(
          info.message
            ? `Could not set the password: ${info.message}`
            : clerkErrorMessage(err, "Could not set the password."),
        );
      }
    }
    return existingId;
  }

  try {
    const user = await client.users.createUser({
      emailAddress: [email],
      username: deriveUsername(email, "partner"),
      phoneNumber: phoneNumber ? [phoneNumber] : undefined,
      password: initialPassword || randomPassword(),
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      skipLegalChecks: true,
    });
    if (initialPassword) {
      try {
        await markPrimaryEmailVerified(client, user.id);
      } catch (err) {
        log.warn("partner verify-email after create failed (non-critical)", {
          error: err instanceof Error ? err.message : "unknown",
        });
      }
    }
    return user.id;
  } catch (err) {
    // The email now exists (a race with another approval) — link to it.
    const linked = await findClerkUserIdByEmail(client, email);
    if (linked) return linked;

    const info = clerkErrorInfo(err);
    log.error("partner createUser failed", { error: err });
    if (info.code === "form_identifier_exists" && info.param === "phone_number") {
      throw new PartnerProvisionError(
        "Another account is already using this phone number. Edit the partner's contact details to a unique number, then approve again.",
      );
    }
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
