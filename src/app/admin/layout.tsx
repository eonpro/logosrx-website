import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import ClerkPreconnect from "@/components/auth/ClerkPreconnect";
import AdminShell from "./AdminShell";

/**
 * Server-side admin layout. Hoists `ClerkProvider` out of the root layout
 * (P1c) so marketing pages don't bundle the Clerk client. The interactive
 * shell (sidebar, active-route highlight, user button) lives inside
 * `AdminShell`, a client component below this boundary. The CSP nonce (set by
 * the proxy) is forwarded so Clerk's inline scripts pass the strict CSP.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <ClerkProvider nonce={nonce}>
      <ClerkPreconnect />
      <AdminShell>{children}</AdminShell>
    </ClerkProvider>
  );
}
