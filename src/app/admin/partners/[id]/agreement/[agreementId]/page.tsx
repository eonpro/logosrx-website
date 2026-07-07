export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerAgreements, partnerOrgs } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import ExecutedAgreement from "@/components/partners/ExecutedAgreement";
import PrintButton from "@/app/partners/agreement/PrintButton";
import { btnGhost } from "@/components/ui/portal";

export default async function AdminPartnerAgreementPage({
  params,
}: {
  params: Promise<{ id: string; agreementId: string }>;
}) {
  await requireAdmin();
  const { id: rawOrg, agreementId: rawAgreement } = await params;
  const orgId = Number(rawOrg);
  const agreementId = Number(rawAgreement);
  if (
    !Number.isInteger(orgId) ||
    orgId <= 0 ||
    !Number.isInteger(agreementId) ||
    agreementId <= 0
  ) {
    notFound();
  }

  const [row] = await db
    .select()
    .from(partnerAgreements)
    .where(
      and(
        eq(partnerAgreements.id, agreementId),
        eq(partnerAgreements.orgId, orgId),
      ),
    )
    .limit(1);
  if (!row) notFound();

  const [org] = await db
    .select({ name: partnerOrgs.name })
    .from(partnerOrgs)
    .where(eq(partnerOrgs.id, orgId))
    .limit(1);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <Link href={`/admin/partners/${orgId}`} className={`${btnGhost} -ml-4`}>
            ← {org?.name ?? "Partner"}
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Executed agreement
          </h1>
        </div>
        <PrintButton />
      </div>

      <ExecutedAgreement
        agreement={{
          documentTitle: row.documentTitle,
          documentVersion: row.documentVersion,
          documentText: row.documentText,
          documentHash: row.documentHash,
          legalEntityName: row.legalEntityName,
          signerName: row.signerName,
          signerTitle: row.signerTitle,
          signerEmail: row.signerEmail,
          signatureImage: row.signatureImage,
          signedIp: row.signedIp,
          signedAt: row.signedAt,
        }}
        className="mx-auto max-w-3xl"
      />
    </div>
  );
}
