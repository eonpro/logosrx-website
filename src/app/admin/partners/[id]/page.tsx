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
import { catalogProducts, standardCatalogPrice } from "@/data/catalog";
import PartnerOrgManager from "./PartnerOrgManager";
import OrgFloorManager from "./OrgFloorManager";

export default async function AdminPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id: raw } = await params;
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

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/partners"
          className="text-xs font-medium text-navy/55 hover:text-magenta"
        >
          ← All partners
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy">{org.name}</h1>
        <p className="text-navy/70 text-sm mt-1">
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
        </p>
        {org.notes && (
          <p className="mt-2 max-w-2xl rounded-xl bg-white border border-beige px-4 py-3 text-sm text-navy/75">
            {org.notes}
          </p>
        )}
        <p className="mt-3 text-sm">
          <span className="text-navy/55">Marketing Services Agreement: </span>
          {org.msaSignedAt ? (
            <span className="font-medium text-emerald-700">
              Signed{" "}
              {org.msaSignedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          ) : (
            <span className="font-medium text-amber-700">Not signed yet</span>
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
        <section className="overflow-x-auto rounded-2xl border border-beige bg-white">
          <div className="border-b border-beige px-5 py-4">
            <h2 className="text-sm font-semibold text-navy">
              Reps ({reps.length})
            </h2>
          </div>
          {reps.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-navy/65">
              No reps yet.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
                <tr>
                  <th className="px-5 py-3 font-semibold">Rep</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">MSA</th>
                  <th className="px-5 py-3 font-semibold text-right">Rate</th>
                  <th className="px-5 py-3 font-semibold text-right">Clinics</th>
                  <th className="px-5 py-3 font-semibold text-right">Unpaid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige text-navy">
                {reps.map((rep) => (
                  <tr key={rep.id}>
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
                        <span className="text-emerald-700">Signed</span>
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

        <section className="overflow-x-auto rounded-2xl border border-beige bg-white">
          <div className="border-b border-beige px-5 py-4">
            <h2 className="text-sm font-semibold text-navy">
              Referral links ({links.length})
            </h2>
          </div>
          {links.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-navy/65">
              No referral links yet.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
                <tr>
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Label</th>
                  <th className="px-5 py-3 font-semibold text-right">Clicks</th>
                  <th className="px-5 py-3 font-semibold text-right">
                    Sign-ups
                  </th>
                  <th className="px-5 py-3 font-semibold">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige text-navy">
                {links.map((link) => (
                  <tr key={link.id}>
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

      <section className="mt-8 overflow-x-auto rounded-2xl border border-beige bg-white">
        <div className="border-b border-beige px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">
            Signed agreements ({agreements.length})
          </h2>
        </div>
        {agreements.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-navy/65">
            No executed agreements yet.
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Signer</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Version</th>
                <th className="px-5 py-3 font-semibold">Signed</th>
                <th className="px-5 py-3 font-semibold text-right">Copy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {agreements.map((a) => (
                <tr key={a.id}>
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

      <section className="mt-8 overflow-x-auto rounded-2xl border border-beige bg-white">
        <div className="border-b border-beige px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">
            Linked clinics ({clinicRows.length})
          </h2>
        </div>
        {clinicRows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-navy/65">
            No clinics attributed to this org yet.
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Clinic</th>
                <th className="px-5 py-3 font-semibold">Referred by</th>
                <th className="px-5 py-3 font-semibold">Verification</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {clinicRows.map((clinic) => (
                <tr key={clinic.id}>
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

      <section className="mt-8 overflow-x-auto rounded-2xl border border-beige bg-white">
        <div className="border-b border-beige px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">Payout history</h2>
        </div>
        {payoutRows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-navy/65">
            No payouts recorded yet.
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Paid to</th>
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Recorded by</th>
                <th className="px-5 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {payoutRows.map((p) => (
                <tr key={p.id}>
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
