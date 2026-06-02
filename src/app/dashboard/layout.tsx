import { ClerkProvider } from "@clerk/nextjs";
import DashboardShell from "@/components/dashboard/DashboardShell";

/**
 * Authenticated clinic portal. Hoists `ClerkProvider` here (out of the root
 * layout) so marketing pages don't ship the Clerk client bundle, matching the
 * pattern used by the admin and auth route groups. `DashboardShell` provides
 * the shared portal chrome (brand, tab nav, LifeFile hand-off, user button).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <DashboardShell>{children}</DashboardShell>
    </ClerkProvider>
  );
}
