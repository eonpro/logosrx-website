import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinics,
  commissionEntries,
  partnerOrgs,
  partnerReps,
  partnerTransactions,
} from "@/lib/db/schema";
import {
  computeCommissionSplit,
  computeMarginSplit,
} from "@/lib/partners/commission";
import { dispatchPartnerEvent } from "@/lib/partners/webhooks";
import { runAfterResponse } from "@/lib/runtime/after";

/** Postgres `unique_violation` SQLSTATE — a row hit a UNIQUE constraint/index. */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "23505"
  );
}

export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionError";
  }
}

/** Thrown when a transaction with the same external reference already exists. */
export class DuplicateReferenceError extends Error {
  constructor(public readonly reference: string) {
    super(`A transaction with reference "${reference}" already exists.`);
    this.name = "DuplicateReferenceError";
  }
}

export interface CreateTransactionInput {
  clinicId: number;
  date: Date;
  revenueCents: number;
  /** Wholesale cost (floor total). Required for margin-model orgs. */
  costCents?: number | null;
  description: string | null;
  reference: string | null;
  source: "manual" | "csv" | "lifefile";
  createdBy: string;
}

/**
 * Records a revenue transaction for an attributed clinic and writes its
 * commission ledger entries atomically. Rates are snapshotted at this moment:
 * the org's current rate and (when the clinic was rep-referred) the rep's
 * current rate — later rate changes never rewrite history.
 *
 * Throws `TransactionError` with a user-facing message when the clinic is
 * missing or has no partner attribution (no one to pay commission to).
 */
export async function createTransactionWithCommission(
  input: CreateTransactionInput,
): Promise<number> {
  if (!Number.isInteger(input.revenueCents) || input.revenueCents < 0) {
    throw new TransactionError("Revenue must be a non-negative amount.");
  }

  // Idempotency: a non-null external reference (e.g. a LifeFile order id) is
  // unique, so re-importing the same file can't double-record a sale. This
  // pre-check is only a fast path for the common case — the authoritative guard
  // is the `partner_transactions_reference_uniq` index, enforced on insert
  // below. (A bare pre-check is racy: two concurrent imports of the same file
  // both pass it, so we must also handle the unique violation.)
  const reference = input.reference?.trim() || null;
  if (reference) {
    const [dup] = await db
      .select({ id: partnerTransactions.id })
      .from(partnerTransactions)
      .where(eq(partnerTransactions.reference, reference))
      .limit(1);
    if (dup) throw new DuplicateReferenceError(reference);
  }

  const [clinic] = await db
    .select({
      id: clinics.id,
      partnerOrgId: clinics.partnerOrgId,
      partnerRepId: clinics.partnerRepId,
    })
    .from(clinics)
    .where(eq(clinics.id, input.clinicId))
    .limit(1);
  if (!clinic) throw new TransactionError("Clinic not found.");
  if (!clinic.partnerOrgId) {
    throw new TransactionError(
      "This clinic isn't attributed to a partner — no commission to record.",
    );
  }

  const [org] = await db
    .select({
      id: partnerOrgs.id,
      compensationModel: partnerOrgs.compensationModel,
      commissionRateBps: partnerOrgs.commissionRateBps,
    })
    .from(partnerOrgs)
    .where(eq(partnerOrgs.id, clinic.partnerOrgId))
    .limit(1);
  if (!org) throw new TransactionError("The clinic's partner org no longer exists.");

  let repRateBps = 0;
  if (clinic.partnerRepId) {
    const [rep] = await db
      .select({ commissionRateBps: partnerReps.commissionRateBps })
      .from(partnerReps)
      .where(eq(partnerReps.id, clinic.partnerRepId))
      .limit(1);
    repRateBps = rep?.commissionRateBps ?? 0;
  }

  // Margin-model orgs earn the spread (revenue − cost); commission-model orgs
  // earn a % of revenue. The rep's rate carves out of whichever base applies.
  let costCents: number | null = null;
  let split;
  if (org.compensationModel === "margin") {
    if (input.costCents == null) {
      throw new TransactionError(
        "This partner is on the wholesale/margin model — enter the cost (floor) for this sale.",
      );
    }
    if (!Number.isInteger(input.costCents) || input.costCents < 0) {
      throw new TransactionError("Cost must be a non-negative amount.");
    }
    if (input.costCents > input.revenueCents) {
      throw new TransactionError("Cost can't exceed revenue (negative margin).");
    }
    costCents = input.costCents;
    split = computeMarginSplit({
      marginCents: input.revenueCents - costCents,
      repRateBps,
    });
  } else {
    split = computeCommissionSplit({
      revenueCents: input.revenueCents,
      orgRateBps: org.commissionRateBps,
      repRateBps,
    });
  }

  let transactionId: number;
  try {
    transactionId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(partnerTransactions)
        .values({
          clinicId: clinic.id,
          transactionDate: input.date,
          description: input.description,
          reference,
          revenueCents: input.revenueCents,
          costCents,
          source: input.source,
          createdBy: input.createdBy,
        })
        .returning({ id: partnerTransactions.id });

      if (split.length > 0) {
        await tx.insert(commissionEntries).values(
          split.map((entry) => ({
            transactionId: created.id,
            orgId: org.id,
            repId: entry.payee === "rep" ? clinic.partnerRepId : null,
            payee: entry.payee,
            rateBps: entry.rateBps,
            amountCents: entry.amountCents,
          })),
        );
      }

      return created.id;
    });
  } catch (err) {
    // Lost the race with a concurrent import of the same reference: the unique
    // index rejected the insert. Convert to the typed error so callers surface
    // the friendly "already exists" message instead of a generic failure.
    if (reference && isUniqueViolation(err)) {
      throw new DuplicateReferenceError(reference);
    }
    throw err;
  }

  // Notify partner webhooks (best-effort, non-blocking).
  runAfterResponse(
    dispatchPartnerEvent(org.id, "transaction.recorded", {
      transactionId,
      clinicId: clinic.id,
      revenueCents: input.revenueCents,
      reference,
    }),
  );

  return transactionId;
}
