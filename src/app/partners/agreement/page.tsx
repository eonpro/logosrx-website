export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerAgreements } from "@/lib/db/schema";
import { getPartnerContext } from "@/lib/auth/partner";
import ExecutedAgreement from "@/components/partners/ExecutedAgreement";
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            Your signed agreement
          </h1>
          <p className="mt-1 text-sm text-navy/70">
            Your executed Marketing Services Agreement, kept on file for you and
            the pharmacy.
          </p>
        </div>
        {agreement && <PrintButton />}
      </div>

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
        <div className="rounded-2xl border border-beige bg-white p-10 text-center text-sm text-navy/65">
          No signed agreement on file yet.
        </div>
      )}
    </div>
  );
}
