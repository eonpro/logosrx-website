import { ClerkProvider } from "@clerk/nextjs";
import AdminShell from "./AdminShell";

/**
 * Server-side admin layout. Hoists `ClerkProvider` out of the root layout
 * (P1c) so marketing pages don't bundle the Clerk client. The interactive
 * shell (sidebar, active-route highlight, user button) lives inside
 * `AdminShell`, a client component below this boundary.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <AdminShell>{children}</AdminShell>
    </ClerkProvider>
  );
}
