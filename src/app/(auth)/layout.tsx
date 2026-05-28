import { ClerkProvider } from "@clerk/nextjs";

/**
 * Wraps the public sign-in / sign-up routes with `ClerkProvider`. Hoisted out
 * of the root layout (P1c) so marketing pages don't ship the Clerk client
 * bundle (~80 KB gzipped) on first visit.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
