import { ClerkProvider } from "@clerk/nextjs";

/**
 * Authenticated clinic portal. Hoists `ClerkProvider` here (out of the root
 * layout) so marketing pages don't ship the Clerk client bundle, matching the
 * pattern used by the admin and auth route groups.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">{children}</ClerkProvider>
  );
}
