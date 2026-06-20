import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";

/**
 * Public provider intake flow. Wrapped in `ClerkProvider` (kept out of the root
 * layout so marketing pages don't ship the Clerk bundle) because the wizard
 * signs the new clinic in client-side after their account is created on submit.
 * The CSP nonce (set by the proxy) is forwarded for the strict `script-src`.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <ClerkProvider afterSignOutUrl="/" nonce={nonce}>
      {children}
    </ClerkProvider>
  );
}
