import "server-only";
import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinics,
  commissionEntries,
  partnerReps,
  partnerTransactions,
  payouts,
} from "@/lib/db/schema";
import type { PartnerContext } from "@/lib/auth/partner";
import {
  summarizeCommissionRows,
  type CommissionRollupRow,
  type CommissionSummary,
} from "@/lib/partners/commission";

/**
 * Read models for the partner portal. Every query is scoped by the caller's
 * partner identity: org owners see their whole group (their reps included);
 * reps see only what's attributed to them personally.
 */

/** Drizzle condition limiting clinics to the viewer's attribution scope. */
function clinicScope(ctx: PartnerContext) {
  return ctx.kind === "org"
    ? eq(clinics.partnerOrgId, ctx.org.id)
    : eq(clinics.partnerRepId, ctx.rep!.id);
}

export interface RevenueSummary {
  revenueCents: number;
  transactionCount: number;
}

/** Total attributed revenue + transaction count, optionally since `from`. */
export async function getRevenueSummary(
  ctx: PartnerContext,
  from?: Date,
): Promise<RevenueSummary> {
  const conditions = [clinicScope(ctx)];
  if (from) conditions.push(gte(partnerTransactions.transactionDate, from));

  const [row] = await db
    .select({
      revenueCents:
        sql<number>`coalesce(sum(${partnerTransactions.revenueCents}), 0)`.mapWith(
          Number,
        ),
      transactionCount: count(),
    })
    .from(partnerTransactions)
    .innerJoin(clinics, eq(partnerTransactions.clinicId, clinics.id))
    .where(and(...conditions));

  return {
    revenueCents: row?.revenueCents ?? 0,
    transactionCount: row?.transactionCount ?? 0,
  };
}

/** Commission totals (own / rep / unpaid / paid), optionally since `from`. */
export async function getCommissionSummary(
  ctx: PartnerContext,
  from?: Date,
): Promise<CommissionSummary> {
  const conditions =
    ctx.kind === "org"
      ? [eq(commissionEntries.orgId, ctx.org.id)]
      : [
          eq(commissionEntries.repId, ctx.rep!.id),
          eq(commissionEntries.payee, "rep" as const),
        ];
  if (from) conditions.push(gte(partnerTransactions.transactionDate, from));

  const rows = await db
    .select({
      payee: commissionEntries.payee,
      status: commissionEntries.status,
      totalCents:
        sql<number>`coalesce(sum(${commissionEntries.amountCents}), 0)`.mapWith(
          Number,
        ),
    })
    .from(commissionEntries)
    .innerJoin(
      partnerTransactions,
      eq(commissionEntries.transactionId, partnerTransactions.id),
    )
    .where(and(...conditions))
    .groupBy(commissionEntries.payee, commissionEntries.status);

  return summarizeCommissionRows(rows as CommissionRollupRow[], ctx.kind);
}

export interface PartnerTransactionRow {
  id: number;
  transactionDate: Date;
  clinicName: string | null;
  description: string | null;
  reference: string | null;
  revenueCents: number;
  /** Viewer's commission on this transaction. */
  ownCommissionCents: number;
  /** Rep share on this transaction (org viewers; 0 otherwise). */
  repCommissionCents: number;
  repName: string | null;
}

/** Attributed transactions with per-row commission, newest first. */
export async function listPartnerTransactions(
  ctx: PartnerContext,
  from?: Date,
  limit = 200,
): Promise<PartnerTransactionRow[]> {
  const conditions = [clinicScope(ctx)];
  if (from) conditions.push(gte(partnerTransactions.transactionDate, from));

  // Constant, not user input — safe to inline as a SQL literal.
  const ownPayee = sql.raw(ctx.kind === "org" ? "'org'" : "'rep'");

  const rows = await db
    .select({
      id: partnerTransactions.id,
      transactionDate: partnerTransactions.transactionDate,
      clinicName: clinics.clinicName,
      practiceLegalName: clinics.practiceLegalName,
      description: partnerTransactions.description,
      reference: partnerTransactions.reference,
      revenueCents: partnerTransactions.revenueCents,
      ownCommissionCents: sql<number>`coalesce(sum(
        case when ${commissionEntries.payee} = ${ownPayee}
        then ${commissionEntries.amountCents} end), 0)`.mapWith(Number),
      repCommissionCents: sql<number>`coalesce(sum(
        case when ${commissionEntries.payee} = 'rep'
        then ${commissionEntries.amountCents} end), 0)`.mapWith(Number),
      repName: partnerReps.name,
    })
    .from(partnerTransactions)
    .innerJoin(clinics, eq(partnerTransactions.clinicId, clinics.id))
    .leftJoin(
      commissionEntries,
      eq(commissionEntries.transactionId, partnerTransactions.id),
    )
    .leftJoin(partnerReps, eq(clinics.partnerRepId, partnerReps.id))
    .where(and(...conditions))
    .groupBy(
      partnerTransactions.id,
      clinics.clinicName,
      clinics.practiceLegalName,
      partnerReps.name,
    )
    .orderBy(desc(partnerTransactions.transactionDate))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    transactionDate: r.transactionDate,
    clinicName: r.clinicName || r.practiceLegalName,
    description: r.description,
    reference: r.reference,
    revenueCents: r.revenueCents,
    ownCommissionCents: r.ownCommissionCents,
    // A rep's own share IS the rep share; don't show it twice.
    repCommissionCents: ctx.kind === "org" ? r.repCommissionCents : 0,
    repName: r.repName,
  }));
}

/** Viewer's unpaid balance (pending + approved entries), all time. */
async function sumEntriesByStatus(
  ctx: PartnerContext,
  statuses: ("pending" | "approved" | "paid")[],
): Promise<number> {
  const conditions =
    ctx.kind === "org"
      ? [
          eq(commissionEntries.orgId, ctx.org.id),
          eq(commissionEntries.payee, "org" as const),
        ]
      : [
          eq(commissionEntries.repId, ctx.rep!.id),
          eq(commissionEntries.payee, "rep" as const),
        ];

  const [row] = await db
    .select({
      totalCents:
        sql<number>`coalesce(sum(${commissionEntries.amountCents}), 0)`.mapWith(
          Number,
        ),
    })
    .from(commissionEntries)
    .where(and(...conditions, inArray(commissionEntries.status, statuses)));
  return row?.totalCents ?? 0;
}

/**
 * Payable-now balance: net of APPROVED entries (approved earnings minus
 * approved clawbacks). This is exactly what a payout will settle.
 */
export async function getUnpaidBalanceCents(
  ctx: PartnerContext,
): Promise<number> {
  return sumEntriesByStatus(ctx, ["approved"]);
}

/** Earned but not yet approved by Logos RX (awaiting the approval gate). */
export async function getAwaitingApprovalCents(
  ctx: PartnerContext,
): Promise<number> {
  return sumEntriesByStatus(ctx, ["pending"]);
}

export interface PayoutRow {
  id: number;
  payee: "org" | "rep";
  repName: string | null;
  amountCents: number;
  method: string | null;
  reference: string | null;
  paidAt: Date;
}

/** Payout history. Org owners see the whole group's payouts; reps their own. */
export async function listPayouts(ctx: PartnerContext): Promise<PayoutRow[]> {
  const scope =
    ctx.kind === "org"
      ? eq(payouts.orgId, ctx.org.id)
      : eq(payouts.repId, ctx.rep!.id);

  return db
    .select({
      id: payouts.id,
      payee: payouts.payee,
      repName: partnerReps.name,
      amountCents: payouts.amountCents,
      method: payouts.method,
      reference: payouts.reference,
      paidAt: payouts.paidAt,
    })
    .from(payouts)
    .leftJoin(partnerReps, eq(payouts.repId, partnerReps.id))
    .where(scope)
    .orderBy(desc(payouts.paidAt))
    .limit(200);
}

export interface NetworkClinicRow {
  id: number;
  clinicName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  repName: string | null;
  createdAt: Date;
}

/** Clinics linked to the viewer (the "who signed up under us" view). */
export async function listNetworkClinics(
  ctx: PartnerContext,
): Promise<NetworkClinicRow[]> {
  const rows = await db
    .select({
      id: clinics.id,
      clinicName: clinics.clinicName,
      practiceLegalName: clinics.practiceLegalName,
      contactName: clinics.contactName,
      contactEmail: clinics.contactEmail,
      verificationStatus: clinics.verificationStatus,
      repName: partnerReps.name,
      createdAt: clinics.createdAt,
    })
    .from(clinics)
    .leftJoin(partnerReps, eq(clinics.partnerRepId, partnerReps.id))
    .where(clinicScope(ctx))
    .orderBy(desc(clinics.createdAt))
    .limit(500);

  return rows.map((r) => ({
    id: r.id,
    clinicName: r.clinicName || r.practiceLegalName,
    contactName: r.contactName,
    contactEmail: r.contactEmail,
    verificationStatus: r.verificationStatus,
    repName: r.repName,
    createdAt: r.createdAt,
  }));
}

/** Number of clinics linked to the viewer. */
export async function countNetworkClinics(
  ctx: PartnerContext,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(clinics)
    .where(clinicScope(ctx));
  return row?.total ?? 0;
}

export interface RepWithStats {
  id: number;
  name: string;
  email: string;
  status: "pending" | "active" | "suspended";
  commissionRateBps: number;
  activatedAt: Date | null;
  clinicCount: number;
}

/** An org's reps with their attributed-clinic counts. */
export async function listOrgReps(orgId: number): Promise<RepWithStats[]> {
  const rows = await db
    .select({
      id: partnerReps.id,
      name: partnerReps.name,
      email: partnerReps.email,
      status: partnerReps.status,
      commissionRateBps: partnerReps.commissionRateBps,
      activatedAt: partnerReps.activatedAt,
      clinicCount: count(clinics.id),
    })
    .from(partnerReps)
    .leftJoin(clinics, eq(clinics.partnerRepId, partnerReps.id))
    .where(eq(partnerReps.orgId, orgId))
    .groupBy(partnerReps.id)
    .orderBy(partnerReps.name);
  return rows;
}
