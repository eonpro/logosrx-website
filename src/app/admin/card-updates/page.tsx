export const dynamic = "force-dynamic";

import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import {
  listCardUpdateLinks,
  listClinicOptions,
  isCardLinkExpired,
} from "@/lib/payment-links/data";
import { SITE_URL } from "@/lib/constants";
import { PageHeader } from "@/components/ui/portal";
import CardLinksManager, { type CardLinkRow } from "./CardLinksManager";

export default async function CardUpdatesPage() {
  const ctx = await requireAdmin();
  const canEdit = ctx.role === ADMIN_ROLE;

  const [links, clinicOptions] = await Promise.all([
    listCardUpdateLinks(),
    listClinicOptions(),
  ]);

  const rows: CardLinkRow[] = links.map(({ link, clinic, cardLast4 }) => ({
    id: link.id,
    clinicId: clinic.id,
    clinicName:
      clinic.clinicName?.trim() ||
      clinic.practiceLegalName?.trim() ||
      `Clinic #${clinic.id}`,
    contactEmail: clinic.contactEmail,
    status:
      link.status === "active" && isCardLinkExpired(link)
        ? "expired"
        : link.status,
    url:
      link.status === "active" && !isCardLinkExpired(link)
        ? `${SITE_URL}/update-card/${link.token}`
        : null,
    cardLast4: link.status === "used" ? cardLast4 : null,
    createdAt: link.createdAt.toISOString(),
    createdByEmail: link.createdByEmail,
    expiresAt: link.expiresAt?.toISOString() ?? null,
    viewedAt: link.viewedAt?.toISOString() ?? null,
    usedAt: link.usedAt?.toISOString() ?? null,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Admin"
        title="Card Update Links"
        description="Single-use links you send a clinic so they can securely re-enter their payment card — same form as onboarding. Submitted cards appear on the clinic's page under Payment card."
      />
      <CardLinksManager
        rows={rows}
        clinicOptions={clinicOptions}
        canEdit={canEdit}
      />
    </div>
  );
}
