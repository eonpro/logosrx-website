import { emailFromSessionClaims } from "./admin-claims";
import { roleForEmail } from "./admin-allowlist";
import { fetchClerkPrimaryEmail } from "./clerk-primary-email";
import {
  signAdminSession,
  verifyAdminSession,
  shouldRefreshAdminSession,
} from "./admin-session";

export type AdminGateResult =
  | {
      status: "allow";
      email: string;
      sessionToken: string;
      setCookie: boolean;
    }
  | { status: "deny" }
  | { status: "unknown" };

/**
 * Resolve an allowlisted admin identity for the proxy. Order:
 *   1. Clerk session JWT claims (no network)
 *   2. HMAC cookie from a previous hit
 *   3. Clerk Backend API (once per browser session, then we mint the cookie)
 *
 * `unknown` means we could not see an email (Clerk blip, empty profile) —
 * the Node page is allowed to try so a real admin isn't bounced.
 */
export async function resolveAdminGate(
  userId: string,
  sessionClaims: unknown,
  cookieValue: string | undefined,
): Promise<AdminGateResult> {
  const fromClaims = emailFromSessionClaims(sessionClaims);
  if (fromClaims) {
    if (!roleForEmail(fromClaims)) return { status: "deny" };
    return allow(userId, fromClaims, cookieValue);
  }

  const fromCookie = await verifyAdminSession(cookieValue, userId);
  if (fromCookie) {
    if (!roleForEmail(fromCookie.email)) return { status: "deny" };
    if (shouldRefreshAdminSession(fromCookie)) {
      return {
        status: "allow",
        email: fromCookie.email,
        sessionToken: await signAdminSession(userId, fromCookie.email),
        setCookie: true,
      };
    }
    return {
      status: "allow",
      email: fromCookie.email,
      sessionToken: cookieValue!,
      setCookie: false,
    };
  }

  const fromClerk = await fetchClerkPrimaryEmail(userId);
  if (fromClerk === null) return { status: "unknown" };
  if (!roleForEmail(fromClerk)) return { status: "deny" };
  return allow(userId, fromClerk, undefined);
}

async function allow(
  userId: string,
  email: string,
  cookieValue: string | undefined,
): Promise<Extract<AdminGateResult, { status: "allow" }>> {
  const sessionToken = await signAdminSession(userId, email);
  const existing = await verifyAdminSession(cookieValue, userId);
  return {
    status: "allow",
    email: email.trim().toLowerCase(),
    sessionToken,
    setCookie: !existing || shouldRefreshAdminSession(existing),
  };
}
