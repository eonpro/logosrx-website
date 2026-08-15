import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import ClerkPreconnect from "@/components/auth/ClerkPreconnect";
import AdminShell from "./AdminShell";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * Colocate admin SSR with Aurora (us-east-1). A west-coast function plus
 * IAM+TCP to Virginia is a large share of "every tab feels stuck".
 */
export const preferredRegion = "iad1";

/**
 * Server-side admin layout. Hoists `ClerkProvider` out of the root layout
 * (P1c) so marketing pages don't bundle the Clerk client.
 *
 * Auth is decided in `src/proxy.ts` (allowlist + signed session). This
 * `requireAdmin()` is a cheap header/cookie verify so the shell never
 * renders for a non-admin. `/admin/sign-in` skips it. Page data streams
 * behind `loading.tsx`.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const nonce = headerList.get("x-nonce") ?? undefined;
  const pathname = headerList.get("x-pathname") ?? "";
  if (pathname && !pathname.startsWith("/admin/sign-in")) {
    await requireAdmin();
  }
  return (
    <ClerkProvider nonce={nonce}>
      <ClerkPreconnect />
      <AdminShell>{children}</AdminShell>
    </ClerkProvider>
  );
}
