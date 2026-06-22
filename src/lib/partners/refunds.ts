import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { commissionEntries, partnerTransactions } from "@/lib/db/schema";
import { reversalDelta } from "@/lib/partners/commission";

export class RefundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RefundError";
  }
}

export interface RefundResult {
  /** Revenue refunded by this operation (cents). */
  refundedCents: number;
  /** New cumulative refunded total on the transaction. */
  totalRefundedCents: number;
  /** Total commission clawed back by this operation (cents, positive). */
  reversedCents: number;
}

/**
 * Records a refund/chargeback against a partner transaction and writes the
 * matching commission clawback entries.
 *
 * Reversals are computed per payee against the CUMULATIVE refunded total:
 * `targetReversed = round(earning × totalRefunded / revenue)`, and we write the
 * delta since the last reversal. This makes a full refund claw back exactly the
 * original earning (nets to zero) and keeps repeated partial refunds exact.
 *
 * Reversal entries are created `approved` so they immediately reduce the
 * payee's payable balance (carrying forward as a negative if already paid out).
 *
 * @param refundCents pass `null` to refund the full remaining revenue.
 */
export async function refundTransaction(input: {
  transactionId: number;
  refundCents: number | null;
  recordedBy: string;
}): Promise<RefundResult> {
  const [tx] = await db
    .select({
      id: partnerTransactions.id,
      revenueCents: partnerTransactions.revenueCents,
      refundedCents: partnerTransactions.refundedCents,
    })
    .from(partnerTransactions)
    .where(eq(partnerTransactions.id, input.transactionId))
    .limit(1);
  if (!tx) throw new RefundError("Transaction not found.");

  const remaining = tx.revenueCents - tx.refundedCents;
  if (remaining <= 0) {
    throw new RefundError("This transaction is already fully refunded.");
  }

  const r = input.refundCents == null ? remaining : input.refundCents;
  if (!Number.isInteger(r) || r <= 0) {
    throw new RefundError("Enter a valid refund amount.");
  }
  if (r > remaining) {
    throw new RefundError(
      "Refund exceeds the un-refunded revenue on this transaction.",
    );
  }
  const newRefundedTotal = tx.refundedCents + r;

  const entries = await db
    .select({
      orgId: commissionEntries.orgId,
      repId: commissionEntries.repId,
      payee: commissionEntries.payee,
      kind: commissionEntries.kind,
      rateBps: commissionEntries.rateBps,
      amountCents: commissionEntries.amountCents,
    })
    .from(commissionEntries)
    .where(eq(commissionEntries.transactionId, input.transactionId));

  // Aggregate per payee: original earning total, already-reversed total, and
  // the metadata needed to write a new reversal row.
  interface PayeeAgg {
    orgId: number;
    repId: number | null;
    rateBps: number;
    earningCents: number;
    reversedCents: number; // positive magnitude already reversed
  }
  const byPayee = new Map<"org" | "rep", PayeeAgg>();
  for (const e of entries) {
    const agg =
      byPayee.get(e.payee) ??
      ({
        orgId: e.orgId,
        repId: e.repId,
        rateBps: e.rateBps,
        earningCents: 0,
        reversedCents: 0,
      } satisfies PayeeAgg);
    if (e.kind === "earning") {
      agg.earningCents += e.amountCents;
      agg.rateBps = e.rateBps;
      agg.repId = e.repId;
      agg.orgId = e.orgId;
    } else {
      agg.reversedCents += -e.amountCents; // reversals are negative
    }
    byPayee.set(e.payee, agg);
  }

  const rows: (typeof commissionEntries.$inferInsert)[] = [];
  let reversedCents = 0;
  for (const [payee, agg] of byPayee) {
    if (agg.earningCents <= 0) continue;
    const delta = reversalDelta({
      earningCents: agg.earningCents,
      alreadyReversedCents: agg.reversedCents,
      revenueCents: tx.revenueCents,
      refundedTotalCents: newRefundedTotal,
    });
    if (delta <= 0) continue;
    reversedCents += delta;
    rows.push({
      transactionId: input.transactionId,
      orgId: agg.orgId,
      repId: payee === "rep" ? agg.repId : null,
      payee,
      kind: "reversal",
      rateBps: agg.rateBps,
      amountCents: -delta,
      status: "approved",
    });
  }

  await db.transaction(async (txn) => {
    if (rows.length > 0) {
      await txn.insert(commissionEntries).values(rows);
    }
    await txn
      .update(partnerTransactions)
      .set({ refundedCents: newRefundedTotal })
      .where(eq(partnerTransactions.id, input.transactionId));
  });

  return {
    refundedCents: r,
    totalRefundedCents: newRefundedTotal,
    reversedCents,
  };
}
