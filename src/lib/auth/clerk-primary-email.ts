import { clerkClient } from "@clerk/nextjs/server";

/** One Clerk Backend lookup for the user's primary email. Null on any failure. */
export async function fetchClerkPrimaryEmail(
  userId: string,
): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primary =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
      user.emailAddresses[0];
    return primary?.emailAddress ?? null;
  } catch {
    return null;
  }
}
