import "server-only";
import { fetchWithTimeout } from "@/lib/http/fetch";

/**
 * Step-up re-authentication for sensitive admin reads (card reveals): verifies
 * the admin's own password against Clerk's Backend API. Kept out of the
 * "use server" action modules so it can never be invoked directly from a
 * client — only through the audited actions that wrap it.
 */
export async function verifyAdminPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) return false;
  try {
    const res = await fetchWithTimeout(
      `https://api.clerk.com/v1/users/${userId}/verify_password`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { verified?: boolean };
    return data.verified === true;
  } catch {
    return false;
  }
}
