import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";

/**
 * Wraps the public sign-in / sign-up routes with `ClerkProvider`. Hoisted out
 * of the root layout (P1c) so marketing pages don't ship the Clerk client
 * bundle (~80 KB gzipped) on first visit. The CSP nonce (set by the proxy) is
 * forwarded so Clerk's inline scripts pass the strict `script-src`.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <ClerkProvider nonce={nonce}>{children}</ClerkProvider>;
}
