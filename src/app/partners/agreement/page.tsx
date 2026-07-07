export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerAgreements } from "@/lib/db/schema";
import { getPartnerContext } from "@/lib/auth/partner";
import ExecutedAgreement from "@/components/partners/ExecutedAgreement";
import { PageHeader, EmptyState } from "@/components/ui/portal";
import PartnerNoAccess from "../PartnerNoAccess";
import PrintButton from "./PrintButton";

export const metadata: Metadata = {
  title: "Marketing Services Agreement",
};

export default async function PartnerAgreementPage() {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  const isOrg = ctx.kind === "org";
  const [agreement] = await db
    .select()
    .from(partnerAgreements)
    .where(
      and(
        eq(partnerAgreements.orgId, ctx.org.id),
        isOrg
          ? isNull(partnerAgreements.repId)
          : eq(partnerAgreements.repId, ctx.rep!.id),
      ),
    )
    .orderBy(desc(partnerAgreements.signedAt))
    .limit(1);

  return (
    <div>
      <PageHeader
        eyebrow="Partner Portal"
        title="Your signed agreement"
        description="Your executed Marketing Services Agreement, kept on file for you and the pharmacy."
        actions={agreement ? <PrintButton /> : undefined}
      />

      {agreement ? (
        <ExecutedAgreement
          agreement={{
            documentTitle: agreement.documentTitle,
            documentVersion: agreement.documentVersion,
            documentText: agreement.documentText,
            documentHash: agreement.documentHash,
            legalEntityName: agreement.legalEntityName,
            signerName: agreement.signerName,
            signerTitle: agreement.signerTitle,
            signerEmail: agreement.signerEmail,
            signatureImage: agreement.signatureImage,
            signedIp: agreement.signedIp,
            signedAt: agreement.signedAt,
          }}
          className="mx-auto max-w-3xl"
        />
      ) : (
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState title="No signed agreement on file yet" />
        </div>
      )}
    </div>
  );
}
