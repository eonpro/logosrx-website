import { ClerkProvider } from "@clerk/nextjs";

/**
 * Public provider intake flow. Wrapped in `ClerkProvider` (kept out of the root
 * layout so marketing pages don't ship the Clerk bundle) because the wizard
 * signs the new clinic in client-side after their account is created on submit.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProvider afterSignOutUrl="/">{children}</ClerkProvider>;
}
