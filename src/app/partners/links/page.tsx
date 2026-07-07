export const dynamic = "force-dynamic";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerReps, referralLinks } from "@/lib/db/schema";
import { getPartnerContext } from "@/lib/auth/partner";
import { SITE_URL } from "@/lib/constants";
import { PageHeader } from "@/components/ui/portal";
import PartnerNoAccess from "../PartnerNoAccess";
import LinksManager from "./LinksManager";

export default async function PartnerLinksPage() {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  const scope =
    ctx.kind === "rep"
      ? and(
          eq(referralLinks.orgId, ctx.org.id),
          eq(referralLinks.repId, ctx.rep!.id),
        )
      : eq(referralLinks.orgId, ctx.org.id);

  const [links, reps] = await Promise.all([
    db
      .select({
        id: referralLinks.id,
        code: referralLinks.code,
        label: referralLinks.label,
        repId: referralLinks.repId,
        repName: partnerReps.name,
        active: referralLinks.active,
        clickCount: referralLinks.clickCount,
        signupCount: referralLinks.signupCount,
        createdAt: referralLinks.createdAt,
      })
      .from(referralLinks)
      .leftJoin(partnerReps, eq(referralLinks.repId, partnerReps.id))
      .where(scope)
      .orderBy(desc(referralLinks.createdAt)),
    ctx.kind === "org"
      ? db
          .select({ id: partnerReps.id, name: partnerReps.name })
          .from(partnerReps)
          .where(eq(partnerReps.orgId, ctx.org.id))
          .orderBy(partnerReps.name)
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Partner Portal"
        title="Referral Links"
        description={
          <>
            Share a link with providers — clinics that sign up through it are
            automatically tied to{" "}
            {ctx.kind === "rep" ? "you" : "your organization"}.
          </>
        }
      />

      <LinksManager
        links={links.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        }))}
        reps={reps}
        kind={ctx.kind}
        siteUrl={SITE_URL}
      />
    </div>
  );
}
