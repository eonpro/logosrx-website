import "server-only";
import { and, desc, eq, gte, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinics,
  commissionEntries,
  partnerReps,
  partnerTransactions,
} from "@/lib/db/schema";
import type { PartnerContext } from "@/lib/auth/partner";

/**
 * CRM read models for the partner portal: per-company (clinic) and per-rep
 * production, book-of-business rollups, and month-by-month trends. Everything
 * is scoped to the caller's partner identity (org owners see the whole org;
 * reps see only their own book). Pure read layer — no writes.
 *
 * Money is integer cents. "Commission" here is the VIEWER's own commission
 * (org share for owners, rep share for reps); reversal entries are stored as
 * negative amounts, so plain SUMs already net out refunds/clawbacks.
 */

/** Limits clinics to the caller's attribution scope. */
function clinicScope(ctx: PartnerContext): SQL {
  return ctx.kind === "org"
    ? eq(clinics.partnerOrgId, ctx.org.id)
    : eq(clinics.partnerRepId, ctx.rep!.id);
}

/** Conditions selecting the VIEWER's own commission entries. */
function viewerCommissionConditions(ctx: PartnerContext): SQL[] {
  return ctx.kind === "org"
    ? [
        eq(commissionEntries.orgId, ctx.org.id),
        eq(commissionEntries.payee, "org" as const),
      ]
    : [
        eq(commissionEntries.repId, ctx.rep!.id),
        eq(commissionEntries.payee, "rep" as const),
      ];
}

const sumCents = (col: typeof commissionEntries.amountCents) =>
  sql<number>`coalesce(sum(${col}), 0)`.mapWith(Number);

// ---------------------------------------------------------------------------
// Book of business — per-company rollup
// ---------------------------------------------------------------------------

export interface BookRow {
  id: number;
  clinicName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  repName: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  revenueCents: number;
  commissionCents: number;
  txCount: number;
  lastTransactionDate: Date | null;
  createdAt: Date;
}

/**
 * Every company in the caller's book with lifetime revenue, the viewer's
 * commission generated, transaction count, and last activity. `from` optionally
 * limits the revenue/commission/activity to a date window (the company still
 * appears even with no activity in-window).
 */
export async function listBookOfBusiness(
  ctx: PartnerContext,
  from?: Date,
): Promise<BookRow[]> {
  const base = await db
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
    .limit(1000);

  if (base.length === 0) return [];

  // Revenue / count / last activity per clinic.
  const revConds = [clinicScope(ctx)!];
  if (from) revConds.push(gte(partnerTransactions.transactionDate, from));
  const revRows = await db
    .select({
      clinicId: partnerTransactions.clinicId,
      revenueCents:
        sql<number>`coalesce(sum(${partnerTransactions.revenueCents}), 0)`.mapWith(
          Number,
        ),
      txCount: sql<number>`count(*)`.mapWith(Number),
      lastDate: sql<Date | null>`max(${partnerTransactions.transactionDate})`,
    })
    .from(partnerTransactions)
    .innerJoin(clinics, eq(partnerTransactions.clinicId, clinics.id))
    .where(and(...revConds))
    .groupBy(partnerTransactions.clinicId);
  const revByClinic = new Map(revRows.map((r) => [r.clinicId, r]));

  // Viewer commission per clinic.
  const commConds = [...viewerCommissionConditions(ctx)];
  if (from) commConds.push(gte(partnerTransactions.transactionDate, from));
  const commRows = await db
    .select({
      clinicId: partnerTransactions.clinicId,
      commissionCents: sumCents(commissionEntries.amountCents),
    })
    .from(commissionEntries)
    .innerJoin(
      partnerTransactions,
      eq(commissionEntries.transactionId, partnerTransactions.id),
    )
    .where(and(...commConds))
    .groupBy(partnerTransactions.clinicId);
  const commByClinic = new Map(
    commRows.map((r) => [r.clinicId, r.commissionCents]),
  );

  return base.map((c) => {
    const rev = revByClinic.get(c.id);
    return {
      id: c.id,
      clinicName: c.clinicName || c.practiceLegalName,
      contactName: c.contactName,
      contactEmail: c.contactEmail,
      repName: c.repName,
      verificationStatus: c.verificationStatus,
      revenueCents: rev?.revenueCents ?? 0,
      commissionCents: commByClinic.get(c.id) ?? 0,
      txCount: rev?.txCount ?? 0,
      lastTransactionDate: rev?.lastDate ?? null,
      createdAt: c.createdAt,
    };
  });
}

// ---------------------------------------------------------------------------
// Monthly trend (revenue + viewer commission), zero-filled
// ---------------------------------------------------------------------------

export interface MonthPoint {
  month: string; // "YYYY-MM"
  revenueCents: number;
  commissionCents: number;
}

function lastNMonthKeys(n: number, now = new Date()): string[] {
  const keys: string[] = [];
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d);
    m.setUTCMonth(d.getUTCMonth() - i);
    keys.push(
      `${m.getUTCFullYear()}-${String(m.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }
  return keys;
}

async function monthlyTrend(
  ctx: PartnerContext,
  extraClinic: SQL | undefined,
  months = 12,
): Promise<MonthPoint[]> {
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - (months - 1));
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);

  const monthExpr = sql<string>`to_char(date_trunc('month', ${partnerTransactions.transactionDate}), 'YYYY-MM')`;

  const revConds = [clinicScope(ctx)!, gte(partnerTransactions.transactionDate, since)];
  if (extraClinic) revConds.push(extraClinic);
  const revRows = await db
    .select({
      month: monthExpr,
      cents: sql<number>`coalesce(sum(${partnerTransactions.revenueCents}), 0)`.mapWith(
        Number,
      ),
    })
    .from(partnerTransactions)
    .innerJoin(clinics, eq(partnerTransactions.clinicId, clinics.id))
    .where(and(...revConds))
    .groupBy(monthExpr);
  const revByMonth = new Map(revRows.map((r) => [r.month, r.cents]));

  const commConds = [
    ...viewerCommissionConditions(ctx),
    gte(partnerTransactions.transactionDate, since),
  ];
  if (extraClinic) commConds.push(extraClinic);
  const commRows = await db
    .select({
      month: monthExpr,
      cents: sumCents(commissionEntries.amountCents),
    })
    .from(commissionEntries)
    .innerJoin(
      partnerTransactions,
      eq(commissionEntries.transactionId, partnerTransactions.id),
    )
    .innerJoin(clinics, eq(partnerTransactions.clinicId, clinics.id))
    .where(and(...commConds))
    .groupBy(monthExpr);
  const commByMonth = new Map(commRows.map((r) => [r.month, r.cents]));

  return lastNMonthKeys(months).map((month) => ({
    month,
    revenueCents: revByMonth.get(month) ?? 0,
    commissionCents: commByMonth.get(month) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Company (clinic) detail
// ---------------------------------------------------------------------------

export interface CommissionBreakdown {
  earnedCents: number; // net of all entries (earnings − reversals)
  payableCents: number; // approved
  awaitingCents: number; // pending
  paidCents: number; // paid
}

export interface ClinicTxRow {
  id: number;
  transactionDate: Date;
  description: string | null;
  reference: string | null;
  revenueCents: number;
  commissionCents: number;
}

export interface ClinicDetail {
  id: number;
  clinicName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  practiceType: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  repId: number | null;
  repName: string | null;
  createdAt: Date;
  revenueCents: number;
  txCount: number;
  commission: CommissionBreakdown;
  transactions: ClinicTxRow[];
  trend: MonthPoint[];
}

/** Full company detail, or null if the clinic isn't in the caller's scope. */
export async function getClinicDetail(
  ctx: PartnerContext,
  clinicId: number,
): Promise<ClinicDetail | null> {
  const [c] = await db
    .select({
      id: clinics.id,
      clinicName: clinics.clinicName,
      practiceLegalName: clinics.practiceLegalName,
      contactName: clinics.contactName,
      contactEmail: clinics.contactEmail,
      contactPhone: clinics.contactPhone,
      practiceType: clinics.practiceType,
      verificationStatus: clinics.verificationStatus,
      repId: clinics.partnerRepId,
      repName: partnerReps.name,
      createdAt: clinics.createdAt,
    })
    .from(clinics)
    .leftJoin(partnerReps, eq(clinics.partnerRepId, partnerReps.id))
    .where(and(clinicScope(ctx), eq(clinics.id, clinicId)))
    .limit(1);
  if (!c) return null;

  const [rev] = await db
    .select({
      revenueCents:
        sql<number>`coalesce(sum(${partnerTransactions.revenueCents}), 0)`.mapWith(
          Number,
        ),
      txCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(partnerTransactions)
    .where(eq(partnerTransactions.clinicId, clinicId));

  const commission = await commissionBreakdown(ctx, [
    eq(partnerTransactions.clinicId, clinicId),
  ]);

  const txRows = await db
    .select({
      id: partnerTransactions.id,
      transactionDate: partnerTransactions.transactionDate,
      description: partnerTransactions.description,
      reference: partnerTransactions.reference,
      revenueCents: partnerTransactions.revenueCents,
      commissionCents: sumCents(commissionEntries.amountCents),
    })
    .from(partnerTransactions)
    .leftJoin(
      commissionEntries,
      and(
        eq(commissionEntries.transactionId, partnerTransactions.id),
        ...viewerCommissionConditions(ctx),
      ),
    )
    .where(eq(partnerTransactions.clinicId, clinicId))
    .groupBy(partnerTransactions.id)
    .orderBy(desc(partnerTransactions.transactionDate))
    .limit(200);

  const trend = await monthlyTrend(ctx, eq(partnerTransactions.clinicId, clinicId));

  return {
    id: c.id,
    clinicName: c.clinicName || c.practiceLegalName,
    contactName: c.contactName,
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone,
    practiceType: c.practiceType,
    verificationStatus: c.verificationStatus,
    repId: c.repId,
    repName: c.repName,
    createdAt: c.createdAt,
    revenueCents: rev?.revenueCents ?? 0,
    txCount: rev?.txCount ?? 0,
    commission,
    transactions: txRows,
    trend,
  };
}

/**
 * Net commission for the viewer, split by status, optionally further scoped
 * (e.g. to one clinic). Joins entries → transactions so the extra conditions
 * can reference `partner_transactions`.
 */
async function commissionBreakdown(
  ctx: PartnerContext,
  extra: SQL[] = [],
): Promise<CommissionBreakdown> {
  const rows = await db
    .select({
      status: commissionEntries.status,
      cents: sumCents(commissionEntries.amountCents),
    })
    .from(commissionEntries)
    .innerJoin(
      partnerTransactions,
      eq(commissionEntries.transactionId, partnerTransactions.id),
    )
    .where(and(...viewerCommissionConditions(ctx), ...extra))
    .groupBy(commissionEntries.status);

  const out: CommissionBreakdown = {
    earnedCents: 0,
    payableCents: 0,
    awaitingCents: 0,
    paidCents: 0,
  };
  for (const r of rows) {
    out.earnedCents += r.cents;
    if (r.status === "approved") out.payableCents += r.cents;
    else if (r.status === "pending") out.awaitingCents += r.cents;
    else if (r.status === "paid") out.paidCents += r.cents;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Rep production (leaderboard) + rep detail
// ---------------------------------------------------------------------------

export interface RepProductionRow {
  id: number;
  name: string;
  email: string;
  status: "pending" | "active" | "suspended";
  commissionRateBps: number;
  activated: boolean;
  clinicCount: number;
  revenueCents: number;
  commissionCents: number;
  paidCents: number;
  payableCents: number;
}

/**
 * Per-rep production for an org, ranked by revenue. Revenue = sum of the rep's
 * clinics' transactions; commission = the rep's own earnings (net, by status).
 */
export async function getRepProduction(
  orgId: number,
  from?: Date,
): Promise<RepProductionRow[]> {
  const reps = await db
    .select({
      id: partnerReps.id,
      name: partnerReps.name,
      email: partnerReps.email,
      status: partnerReps.status,
      commissionRateBps: partnerReps.commissionRateBps,
      activatedAt: partnerReps.activatedAt,
      clinicCount: sql<number>`count(distinct ${clinics.id})`.mapWith(Number),
    })
    .from(partnerReps)
    .leftJoin(clinics, eq(clinics.partnerRepId, partnerReps.id))
    .where(eq(partnerReps.orgId, orgId))
    .groupBy(partnerReps.id);

  if (reps.length === 0) return [];

  // Revenue per rep (rep's clinics' transactions).
  const revConds = [eq(clinics.partnerRepId, partnerReps.id)];
  if (from) revConds.push(gte(partnerTransactions.transactionDate, from));
  const revRows = await db
    .select({
      repId: clinics.partnerRepId,
      revenueCents:
        sql<number>`coalesce(sum(${partnerTransactions.revenueCents}), 0)`.mapWith(
          Number,
        ),
    })
    .from(partnerTransactions)
    .innerJoin(clinics, eq(partnerTransactions.clinicId, clinics.id))
    .where(
      and(
        eq(clinics.partnerOrgId, orgId),
        from ? gte(partnerTransactions.transactionDate, from) : undefined,
      ),
    )
    .groupBy(clinics.partnerRepId);
  const revByRep = new Map(revRows.map((r) => [r.repId, r.revenueCents]));

  // Rep commission by status.
  const commRows = await db
    .select({
      repId: commissionEntries.repId,
      status: commissionEntries.status,
      cents: sumCents(commissionEntries.amountCents),
    })
    .from(commissionEntries)
    .innerJoin(
      partnerTransactions,
      eq(commissionEntries.transactionId, partnerTransactions.id),
    )
    .where(
      and(
        eq(commissionEntries.orgId, orgId),
        eq(commissionEntries.payee, "rep" as const),
        from ? gte(partnerTransactions.transactionDate, from) : undefined,
      ),
    )
    .groupBy(commissionEntries.repId, commissionEntries.status);

  const commByRep = new Map<
    number,
    { total: number; paid: number; payable: number }
  >();
  for (const r of commRows) {
    if (r.repId == null) continue;
    const agg = commByRep.get(r.repId) ?? { total: 0, paid: 0, payable: 0 };
    agg.total += r.cents;
    if (r.status === "paid") agg.paid += r.cents;
    else if (r.status === "approved") agg.payable += r.cents;
    commByRep.set(r.repId, agg);
  }

  return reps
    .map((r) => {
      const comm = commByRep.get(r.id);
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        status: r.status,
        commissionRateBps: r.commissionRateBps,
        activated: r.activatedAt != null,
        clinicCount: r.clinicCount,
        revenueCents: revByRep.get(r.id) ?? 0,
        commissionCents: comm?.total ?? 0,
        paidCents: comm?.paid ?? 0,
        payableCents: comm?.payable ?? 0,
      };
    })
    .sort((a, b) => b.revenueCents - a.revenueCents);
}

export interface RepDetail {
  id: number;
  name: string;
  email: string;
  status: "pending" | "active" | "suspended";
  commissionRateBps: number;
  activated: boolean;
  revenueCents: number;
  clinicCount: number;
  commission: CommissionBreakdown;
  clinics: BookRow[];
  trend: MonthPoint[];
}

/** Full rep detail for an org owner, or null if the rep isn't in the org. */
export async function getRepDetail(
  orgId: number,
  repId: number,
  ctx: PartnerContext,
): Promise<RepDetail | null> {
  const [rep] = await db
    .select({
      id: partnerReps.id,
      name: partnerReps.name,
      email: partnerReps.email,
      status: partnerReps.status,
      commissionRateBps: partnerReps.commissionRateBps,
      activatedAt: partnerReps.activatedAt,
    })
    .from(partnerReps)
    .where(and(eq(partnerReps.id, repId), eq(partnerReps.orgId, orgId)))
    .limit(1);
  if (!rep) return null;

  // Reuse the rep-scoped book + breakdown by constructing a rep-scoped context.
  // The shared helpers only read `ctx.kind`, `ctx.org.id`, and `ctx.rep.id`.
  const repCtx = {
    userId: ctx.userId,
    kind: "rep" as const,
    org: ctx.org,
    rep: { id: rep.id } as unknown as PartnerContext["rep"],
  } as unknown as PartnerContext;

  const [book, commission, trend, rev] = await Promise.all([
    listBookOfBusiness(repCtx),
    commissionBreakdown(repCtx),
    monthlyTrend(repCtx, undefined),
    db
      .select({
        revenueCents:
          sql<number>`coalesce(sum(${partnerTransactions.revenueCents}), 0)`.mapWith(
            Number,
          ),
      })
      .from(partnerTransactions)
      .innerJoin(clinics, eq(partnerTransactions.clinicId, clinics.id))
      .where(eq(clinics.partnerRepId, repId)),
  ]);

  return {
    id: rep.id,
    name: rep.name,
    email: rep.email,
    status: rep.status,
    commissionRateBps: rep.commissionRateBps,
    activated: rep.activatedAt != null,
    revenueCents: rev[0]?.revenueCents ?? 0,
    clinicCount: book.length,
    commission,
    clinics: book,
    trend,
  };
}
