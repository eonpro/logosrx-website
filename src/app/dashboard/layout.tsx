import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import DashboardShell from "@/components/dashboard/DashboardShell";

/**
 * Authenticated clinic portal. Hoists `ClerkProvider` here (out of the root
 * layout) so marketing pages don't ship the Clerk client bundle, matching the
 * pattern used by the admin and auth route groups. `DashboardShell` provides
 * the shared portal chrome (brand, tab nav, LifeFile hand-off, user button).
 * The CSP nonce (set by the proxy) is forwarded for the strict `script-src`.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <ClerkProvider afterSignOutUrl="/" nonce={nonce}>
      <DashboardShell>{children}</DashboardShell>
    </ClerkProvider>
  );
}
