import { ClerkProvider } from "@clerk/nextjs";
import { getPartnerContext } from "@/lib/auth/partner";
import PartnersShell from "./PartnersShell";

/**
 * Affiliate partner portal. Hoists `ClerkProvider` here (out of the root
 * layout) so marketing pages don't ship the Clerk client bundle, matching the
 * admin/dashboard route groups. The partner identity (org owner vs rep) is
 * resolved server-side and drives which nav items the shell renders.
 */
export default async function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Null for anonymous visitors (sign-in/apply pages) and non-partners; the
  // individual pages enforce access, the shell only adapts its chrome.
  const ctx = await getPartnerContext();

  return (
    <ClerkProvider afterSignOutUrl="/">
      <PartnersShell
        kind={ctx?.kind ?? null}
        orgName={ctx?.org.name ?? null}
        repName={ctx?.rep?.name ?? null}
        marginEnabled={ctx?.org.compensationModel === "margin"}
      >
        {children}
      </PartnersShell>
    </ClerkProvider>
  );
}
