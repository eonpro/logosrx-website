import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import { getPartnerContext } from "@/lib/auth/partner";
import { partnerHasQuotes } from "@/lib/quotes/data";
import PartnerMsaGate from "./PartnerMsaGate";
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
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  // MSA gate: an active partner (org owner or rep) who hasn't executed the
  // Marketing Services Agreement is blocked from the portal until they sign.
  // This wraps every partner route, so the signing screen replaces all portal
  // chrome; anonymous routes (ctx null) are unaffected.
  const needsMsa = Boolean(
    ctx && (ctx.kind === "org" ? !ctx.org.msaSignedAt : !ctx.rep?.msaSignedAt),
  );

  // Margin orgs can create quotes; any partner with attributed quotes (e.g. an
  // admin-created referral) can view them, so surface the nav item for them too.
  const marginEnabled = ctx?.org.compensationModel === "margin";
  const quotesEnabled = Boolean(
    ctx &&
      (marginEnabled ||
        (await partnerHasQuotes({
          orgId: ctx.org.id,
          repId: ctx.kind === "rep" ? ctx.rep!.id : null,
        }))),
  );

  return (
    <ClerkProvider afterSignOutUrl="/" nonce={nonce}>
      {needsMsa && ctx ? (
        <PartnerMsaGate
          signerKind={ctx.kind}
          defaultSignerName={
            ctx.kind === "rep" ? ctx.rep?.name ?? "" : ctx.org.contactName ?? ""
          }
          defaultEntityName={ctx.org.name}
          orgName={ctx.org.name}
        />
      ) : (
        <PartnersShell
          kind={ctx?.kind ?? null}
          role={ctx?.role ?? null}
          orgName={ctx?.org.name ?? null}
          repName={ctx?.rep?.name ?? null}
          marginEnabled={marginEnabled}
          quotesEnabled={quotesEnabled}
        >
          {children}
        </PartnersShell>
      )}
    </ClerkProvider>
  );
}
