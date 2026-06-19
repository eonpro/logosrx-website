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
import { computeCommissionSplit } from "@/lib/partners/commission";

export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionError";
  }
}

export interface CreateTransactionInput {
  clinicId: number;
  date: Date;
  revenueCents: number;
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

  const split = computeCommissionSplit({
    revenueCents: input.revenueCents,
    orgRateBps: org.commissionRateBps,
    repRateBps,
  });

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(partnerTransactions)
      .values({
        clinicId: clinic.id,
        transactionDate: input.date,
        description: input.description,
        reference: input.reference,
        revenueCents: input.revenueCents,
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
}
