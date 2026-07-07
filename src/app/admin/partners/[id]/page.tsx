export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinics,
  commissionEntries,
  partnerAgreements,
  partnerOrgs,
  partnerReps,
  payouts,
  referralLinks,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { bpsToPercent, formatBps, formatCents } from "@/lib/partners/commission";
import { getOrgFloorMap } from "@/lib/partners/pricing";
import { standardCatalogPrice } from "@/data/catalog";
import { getCatalogProducts } from "@/lib/catalog/store";
import PartnerOrgManager from "./PartnerOrgManager";
import OrgFloorManager from "./OrgFloorManager";
import EditOrgContact from "./EditOrgContact";
import {
  Badge,
  EmptyState,
  PageHeader,
  btnGhost,
  rowClass,
  tableWrapClass,
  theadClass,
} from "@/components/ui/portal";

export default async function AdminPartnerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireAdmin();
  const { id: raw } = await params;
  const { edit } = await searchParams;
  const orgId = Number(raw);
  if (!Number.isInteger(orgId) || orgId <= 0) notFound();

  const [org] = await db
    .select()
    .from(partnerOrgs)
    .where(eq(partnerOrgs.id, orgId))
    .limit(1);
  if (!org) notFound();

  const floorMap = await getOrgFloorMap(orgId);
  const floorRows = Array.from(floorMap.entries()).map(
    ([productId, f]) => [productId, f.floorCents] as const,
  );

  const [reps, clinicRows, links, unpaidRows, payoutRows, agreements] =
    await Promise.all([
    db
      .select({
        id: partnerReps.id,
        name: partnerReps.name,
        email: partnerReps.email,
        status: partnerReps.status,
        commissionRateBps: partnerReps.commissionRateBps,
        activatedAt: partnerReps.activatedAt,
        msaSignedAt: partnerReps.msaSignedAt,
        clinicCount: count(clinics.id),
      })
      .from(partnerReps)
      .leftJoin(clinics, eq(clinics.partnerRepId, partnerReps.id))
      .where(eq(partnerReps.orgId, orgId))
      .groupBy(partnerReps.id)
      .orderBy(partnerReps.name),
    db
      .select({
        id: clinics.id,
        clinicName: clinics.clinicName,
        practiceLegalName: clinics.practiceLegalName,
        contactEmail: clinics.contactEmail,
        verificationStatus: clinics.verificationStatus,
        repName: partnerReps.name,
        createdAt: clinics.createdAt,
      })
      .from(clinics)
      .leftJoin(partnerReps, eq(clinics.partnerRepId, partnerReps.id))
      .where(eq(clinics.partnerOrgId, orgId))
      .orderBy(desc(clinics.createdAt))
      .limit(100),
    db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.orgId, orgId))
      .orderBy(desc(referralLinks.createdAt)),
    db
      .select({
        payee: commissionEntries.payee,
        repId: commissionEntries.repId,
        status: commissionEntries.status,
        totalCents:
          sql<number>`coalesce(sum(${commissionEntries.amountCents}), 0)`.mapWith(
            Number,
          ),
      })
      .from(commissionEntries)
      .where(
        and(
          eq(commissionEntries.orgId, orgId),
          inArray(commissionEntries.status, ["pending", "approved"]),
        ),
      )
      .groupBy(
        commissionEntries.payee,
        commissionEntries.repId,
        commissionEntries.status,
      ),
    db
      .select({
        id: payouts.id,
        payee: payouts.payee,
        repName: partnerReps.name,
        amountCents: payouts.amountCents,
        method: payouts.method,
        reference: payouts.reference,
        paidAt: payouts.paidAt,
        recordedByEmail: payouts.recordedByEmail,
      })
      .from(payouts)
      .leftJoin(partnerReps, eq(payouts.repId, partnerReps.id))
      .where(eq(payouts.orgId, orgId))
      .orderBy(desc(payouts.paidAt))
      .limit(100),
    db
      .select({
        id: partnerAgreements.id,
        signerKind: partnerAgreements.signerKind,
        signerName: partnerAgreements.signerName,
        signerTitle: partnerAgreements.signerTitle,
        documentVersion: partnerAgreements.documentVersion,
        signedAt: partnerAgreements.signedAt,
        repName: partnerReps.name,
      })
      .from(partnerAgreements)
      .leftJoin(partnerReps, eq(partnerAgreements.repId, partnerReps.id))
      .where(eq(partnerAgreements.orgId, orgId))
      .orderBy(desc(partnerAgreements.signedAt)),
  ]);

  // Payable = approved net (what a payout settles); awaiting = pending earnings.
  const orgPayableCents = unpaidRows
    .filter((r) => r.payee === "org" && r.status === "approved")
    .reduce((s, r) => s + r.totalCents, 0);
  const orgAwaitingCents = unpaidRows
    .filter((r) => r.payee === "org" && r.status === "pending")
    .reduce((s, r) => s + r.totalCents, 0);
  const repUnpaidById = new Map<number, number>();
  for (const r of unpaidRows) {
    if (r.payee === "rep" && r.repId != null && r.status === "approved") {
      repUnpaidById.set(r.repId, (repUnpaidById.get(r.repId) ?? 0) + r.totalCents);
    }
  }
  const hasPending = unpaidRows.some((r) => r.status === "pending");

  const catalogProducts = await getCatalogProducts();

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/partners" className={`${btnGhost} -ml-4`}>
          ← All partners
        </Link>
      </div>

      <PageHeader
        eyebrow="Partner"
        title={org.name}
        description={
          <>
            {org.contactName} · {org.contactEmail}
            {org.contactPhone && <> · {org.contactPhone}</>}
            {org.website && (
              <>
                {" "}
                ·{" "}
                <a
                  href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-magenta hover:underline"
                >
                  {org.website}
                </a>
              </>
            )}
          </>
        }
      />

      <div className="-mt-4 mb-8">
        {org.notes && (
          <p className="mt-2 max-w-2xl rounded-2xl border border-beige/70 bg-white px-5 py-3.5 text-sm text-navy/75 shadow-soft">
            {org.notes}
          </p>
        )}
        <EditOrgContact
          defaultOpen={edit === "1"}
          org={{
            id: org.id,
            orgName: org.name,
            contactName: org.contactName ?? "",
            email: org.contactEmail,
            phone: org.contactPhone ?? "",
            website: org.website ?? "",
          }}
        />
        <p className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-navy/55">Marketing Services Agreement:</span>
          {org.msaSignedAt ? (
            <Badge tone="success">
              Signed{" "}
              {org.msaSignedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Badge>
          ) : (
            <Badge tone="warning">Not signed yet</Badge>
          )}
        </p>
      </div>

      <PartnerOrgManager
        org={{
          id: org.id,
          status: org.status,
          compensationModel: org.compensationModel,
          ratePercent: bpsToPercent(org.commissionRateBps),
          hasAccount: Boolean(org.clerkUserId),
          unpaidCents: orgPayableCents,
          awaitingCents: orgAwaitingCents,
          hasPending,
        }}
        reps={reps.map((r) => ({
          id: r.id,
          name: r.name,
          unpaidCents: repUnpaidById.get(r.id) ?? 0,
        }))}
      />

      <div className="mt-8">
        <OrgFloorManager
          orgId={org.id}
          active={org.compensationModel === "margin"}
          products={catalogProducts.map((p) => {
            const std = standardCatalogPrice(p);
            return {
              productId: p.id,
              name: p.name,
              strength: p.strength ?? null,
              unit: p.unit ?? null,
              standardCents: std == null ? null : Math.round(std * 100),
            };
          })}
          floors={Object.fromEntries(floorRows)}
        />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <section className={`${tableWrapClass} overflow-x-auto`}>
          <div className="border-b border-beige px-5 py-4">
            <h2 className="text-sm font-semibold text-navy">
              Reps ({reps.length})
            </h2>
          </div>
          {reps.length === 0 ? (
            <EmptyState
              title="No reps yet"
              body="Reps invited by this org will show up here."
            />
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className={theadClass}>
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Rep</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">MSA</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Rate</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Clinics</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Unpaid</th>
                </tr>
              </thead>
              <tbody className="text-navy">
                {reps.map((rep) => (
                  <tr key={rep.id} className={rowClass}>
                    <td className="px-5 py-3">
                      <span className="font-medium">{rep.name}</span>
                      <span className="block text-xs text-navy/55">
                        {rep.email}
                      </span>
                    </td>
                    <td className="px-5 py-3 capitalize">
                      {rep.status === "active" && !rep.activatedAt
                        ? "Invited"
                        : rep.status}
                    </td>
                    <td className="px-5 py-3">
                      {rep.msaSignedAt ? (
                        <Badge tone="success">Signed</Badge>
                      ) : (
                        <span className="text-navy/40">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatBps(rep.commissionRateBps)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {rep.clinicCount}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatCents(repUnpaidById.get(rep.id) ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className={`${tableWrapClass} overflow-x-auto`}>
          <div className="border-b border-beige px-5 py-4">
            <h2 className="text-sm font-semibold text-navy">
              Referral links ({links.length})
            </h2>
          </div>
          {links.length === 0 ? (
            <EmptyState
              title="No referral links yet"
              body="Links created by this org will show up here."
            />
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className={theadClass}>
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Code</th>
                  <th className="px-5 py-3.5 font-semibold">Label</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Clicks</th>
                  <th className="px-5 py-3.5 font-semibold text-right">
                    Sign-ups
                  </th>
                  <th className="px-5 py-3.5 font-semibold">Active</th>
                </tr>
              </thead>
              <tbody className="text-navy">
                {links.map((link) => (
                  <tr key={link.id} className={rowClass}>
                    <td className="px-5 py-3 font-mono text-xs">{link.code}</td>
                    <td className="px-5 py-3">{link.label || "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {link.clickCount}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {link.signupCount}
                    </td>
                    <td className="px-5 py-3">{link.active ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className={`${tableWrapClass} mt-8 overflow-x-auto`}>
        <div className="border-b border-beige px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">
            Signed agreements ({agreements.length})
          </h2>
        </div>
        {agreements.length === 0 ? (
          <EmptyState
            title="No executed agreements yet"
            body="Signed MSAs for this org and its reps will show up here."
          />
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-3.5 font-semibold">Signer</th>
                <th className="px-5 py-3.5 font-semibold">Role</th>
                <th className="px-5 py-3.5 font-semibold">Version</th>
                <th className="px-5 py-3.5 font-semibold">Signed</th>
                <th className="px-5 py-3.5 font-semibold text-right">Copy</th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {agreements.map((a) => (
                <tr key={a.id} className={rowClass}>
                  <td className="px-5 py-3">
                    <span className="font-medium">{a.signerName}</span>
                    {a.signerTitle && (
                      <span className="block text-xs text-navy/55">
                        {a.signerTitle}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {a.signerKind === "org"
                      ? "Organization"
                      : (a.repName ?? "Rep")}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">
                    {a.documentVersion}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {a.signedAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/partners/${orgId}/agreement/${a.id}`}
                      className="font-medium text-magenta hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={`${tableWrapClass} mt-8 overflow-x-auto`}>
        <div className="border-b border-beige px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">
            Linked clinics ({clinicRows.length})
          </h2>
        </div>
        {clinicRows.length === 0 ? (
          <EmptyState
            title="No linked clinics yet"
            body="Clinics attributed to this org will show up here."
          />
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-3.5 font-semibold">Clinic</th>
                <th className="px-5 py-3.5 font-semibold">Referred by</th>
                <th className="px-5 py-3.5 font-semibold">Verification</th>
                <th className="px-5 py-3.5 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {clinicRows.map((clinic) => (
                <tr key={clinic.id} className={rowClass}>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/clinics/${clinic.id}`}
                      className="font-medium hover:text-magenta"
                    >
                      {clinic.clinicName || clinic.practiceLegalName || "—"}
                    </Link>
                    <span className="block text-xs text-navy/55">
                      {clinic.contactEmail}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {clinic.repName ?? "Organization"}
                  </td>
                  <td className="px-5 py-3 capitalize">
                    {clinic.verificationStatus}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {clinic.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={`${tableWrapClass} mt-8 overflow-x-auto`}>
        <div className="border-b border-beige px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">Payout history</h2>
        </div>
        {payoutRows.length === 0 ? (
          <EmptyState
            title="No payouts recorded yet"
            body="Recorded payouts to this org and its reps will show up here."
          />
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-3.5 font-semibold">Date</th>
                <th className="px-5 py-3.5 font-semibold">Paid to</th>
                <th className="px-5 py-3.5 font-semibold">Method</th>
                <th className="px-5 py-3.5 font-semibold">Reference</th>
                <th className="px-5 py-3.5 font-semibold">Recorded by</th>
                <th className="px-5 py-3.5 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {payoutRows.map((p) => (
                <tr key={p.id} className={rowClass}>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {p.paidAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    {p.payee === "org" ? org.name : (p.repName ?? "Rep")}
                  </td>
                  <td className="px-5 py-3 capitalize">{p.method ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs">
                    {p.reference ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-xs">{p.recordedByEmail ?? "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
                    {formatCents(p.amountCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
