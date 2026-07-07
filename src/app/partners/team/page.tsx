export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerOrgMembers } from "@/lib/db/schema";
import { getPartnerContext } from "@/lib/auth/partner";
import { roleAtLeast } from "@/lib/auth/partner-roles";
import { PageHeader } from "@/components/ui/portal";
import PartnerNoAccess from "../PartnerNoAccess";
import TeamManager from "./TeamManager";

export default async function PartnerTeamPage() {
  const ctx = await getPartnerContext();
  // Team management is for org owners/admins (viewers and reps can't manage).
  if (!ctx || ctx.kind !== "org" || !roleAtLeast(ctx.role, "admin")) {
    return <PartnerNoAccess />;
  }

  const members = await db
    .select({
      id: partnerOrgMembers.id,
      name: partnerOrgMembers.name,
      email: partnerOrgMembers.email,
      role: partnerOrgMembers.role,
      status: partnerOrgMembers.status,
      activatedAt: partnerOrgMembers.activatedAt,
    })
    .from(partnerOrgMembers)
    .where(eq(partnerOrgMembers.orgId, ctx.org.id))
    .orderBy(desc(partnerOrgMembers.createdAt));

  return (
    <div>
      <PageHeader
        eyebrow="Partner Portal"
        title="Team"
        description={
          <>
            Add teammates to {ctx.org.name}. <strong>Admins</strong> can manage
            everything (reps, links, pricing, goals); <strong>viewers</strong>{" "}
            have read-only access.
          </>
        }
      />

      <TeamManager
        owner={{
          name: ctx.org.contactName ?? ctx.org.name,
          email: ctx.org.contactEmail,
        }}
        members={members.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          status: m.status,
          activated: m.activatedAt != null,
        }))}
      />
    </div>
  );
}
