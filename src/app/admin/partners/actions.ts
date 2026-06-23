"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinics,
  commissionEntries,
  partnerOrgs,
  partnerReps,
  payouts,
} from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { recordAdminAudit } from "@/lib/audit/log";
import {
  formatCents,
  percentToBps,
  validateOrgRateBps,
} from "@/lib/partners/commission";
import { parseTransactionsCsv } from "@/lib/partners/csv";
import { deleteOrgFloor, upsertOrgFloor } from "@/lib/partners/pricing";
import {
  buildPartnerActivateUrl,
  createPartnerClerkUser,
  PartnerProvisionError,
} from "@/lib/partners/provision";
import {
  createTransactionWithCommission,
  DuplicateReferenceError,
  TransactionError,
} from "@/lib/partners/transactions";
import { refundTransaction, RefundError } from "@/lib/partners/refunds";
import { dispatchPartnerEvent } from "@/lib/partners/webhooks";
import {
  sendPartnerApprovedEmail,
  sendPayoutRecordedEmail,
} from "@/lib/notifications/email";
import { runAfterResponse } from "@/lib/runtime/after";

export interface AdminPartnerResult {
  ok: boolean;
  error?: string;
}

function assertId(id: number, label = "id") {
  if (!Number.isFinite(id) || id <= 0) throw new Error(`invalid ${label}`);
}

function revalidateOrg(orgId: number) {
  revalidatePath("/admin/partners");
  revalidatePath(`/admin/partners/${orgId}`);
}

/** Sets a partner org's commission rate (future transactions only). */
export async function setPartnerOrgRate(
  orgId: number,
  ratePercent: number,
): Promise<AdminPartnerResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(orgId, "orgId");

  const rateBps = percentToBps(ratePercent);
  const err = validateOrgRateBps(rateBps);
  if (err) return { ok: false, error: err };

  const updated = await db
    .update(partnerOrgs)
    .set({ commissionRateBps: rateBps, updatedAt: new Date() })
    .where(eq(partnerOrgs.id, orgId))
    .returning({ id: partnerOrgs.id });
  if (updated.length === 0) return { ok: false, error: "Org not found." };

  await recordAdminAudit(ctx, "partner_org.set_rate", {
    type: "partner_org",
    id: orgId,
  }, { rateBps });

  revalidateOrg(orgId);
  return { ok: true };
}

/** Switches an org between commission (% of revenue) and margin (wholesale spread). */
export async function setPartnerOrgCompensationModel(
  orgId: number,
  model: "commission" | "margin",
): Promise<AdminPartnerResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(orgId, "orgId");
  if (model !== "commission" && model !== "margin") {
    return { ok: false, error: "Invalid compensation model." };
  }

  const updated = await db
    .update(partnerOrgs)
    .set({ compensationModel: model, updatedAt: new Date() })
    .where(eq(partnerOrgs.id, orgId))
    .returning({ id: partnerOrgs.id });
  if (updated.length === 0) return { ok: false, error: "Org not found." };

  await recordAdminAudit(ctx, "partner_org.set_compensation_model", {
    type: "partner_org",
    id: orgId,
  }, { model });

  revalidateOrg(orgId);
  return { ok: true };
}

/** Sets (upserts) an org's wholesale floor price for a catalog SKU. */
export async function setOrgFloorPrice(input: {
  orgId: number;
  productId: string;
  productName: string;
  floorDollars: number;
  unit: string;
}): Promise<AdminPartnerResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(input.orgId, "orgId");
  const productId = input.productId.trim();
  if (!productId) return { ok: false, error: "Product is required." };
  if (!Number.isFinite(input.floorDollars) || input.floorDollars < 0) {
    return { ok: false, error: "Enter a valid floor price." };
  }

  const floorCents = Math.round(input.floorDollars * 100);
  await upsertOrgFloor({
    orgId: input.orgId,
    productId,
    productName: input.productName.trim() || productId,
    floorCents,
    unit: input.unit.trim() || null,
  });

  await recordAdminAudit(ctx, "partner_org.set_floor", {
    type: "partner_org",
    id: input.orgId,
  }, { productId, floorCents });

  revalidateOrg(input.orgId);
  return { ok: true };
}

/** Clears an org's floor for a SKU. */
export async function resetOrgFloorPrice(
  orgId: number,
  productId: string,
): Promise<AdminPartnerResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(orgId, "orgId");
  const pid = productId.trim();
  if (!pid) return { ok: false, error: "Product is required." };

  await deleteOrgFloor(orgId, pid);

  await recordAdminAudit(ctx, "partner_org.reset_floor", {
    type: "partner_org",
    id: orgId,
  }, { productId: pid });

  revalidateOrg(orgId);
  return { ok: true };
}

/**
 * Approves a pending partner application: provisions the Clerk login (when
 * not already provisioned), flips the org to `active`, and emails the owner
 * a one-time activation link.
 */
export async function approvePartnerOrg(
  orgId: number,
): Promise<AdminPartnerResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(orgId, "orgId");

  const [org] = await db
    .select()
    .from(partnerOrgs)
    .where(eq(partnerOrgs.id, orgId))
    .limit(1);
  if (!org) return { ok: false, error: "Org not found." };

  let clerkUserId = org.clerkUserId;
  if (!clerkUserId) {
    try {
      clerkUserId = await createPartnerClerkUser({
        email: org.contactEmail,
        name: org.contactName || org.name,
        phone: org.contactPhone,
      });
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof PartnerProvisionError
            ? err.message
            : "Could not create the partner's account.",
      };
    }
  }

  await db
    .update(partnerOrgs)
    .set({
      clerkUserId,
      status: "active",
      approvedAt: new Date(),
      approvedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(eq(partnerOrgs.id, orgId));

  await recordAdminAudit(ctx, "partner_org.approve", {
    type: "partner_org",
    id: orgId,
  }, { orgName: org.name });

  // Approval email + activation link are best-effort; "Resend activation"
  // covers failures.
  const userId = clerkUserId;
  runAfterResponse(
    (async () => {
      const activateUrl = await buildPartnerActivateUrl(userId);
      await sendPartnerApprovedEmail({
        to: org.contactEmail,
        contactName: org.contactName ?? "",
        orgName: org.name,
        activateUrl: activateUrl ?? undefined,
      });
    })(),
  );

  revalidateOrg(orgId);
  return { ok: true };
}

/** Suspends (or reactivates) a partner org's portal access. */
export async function setPartnerOrgStatus(
  orgId: number,
  status: "active" | "suspended",
): Promise<AdminPartnerResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(orgId, "orgId");
  if (status !== "active" && status !== "suspended") {
    return { ok: false, error: "Invalid status." };
  }

  const updated = await db
    .update(partnerOrgs)
    .set({ status, updatedAt: new Date() })
    .where(eq(partnerOrgs.id, orgId))
    .returning({ id: partnerOrgs.id });
  if (updated.length === 0) return { ok: false, error: "Org not found." };

  await recordAdminAudit(
    ctx,
    status === "suspended" ? "partner_org.suspend" : "partner_org.reactivate",
    { type: "partner_org", id: orgId },
    { status },
  );

  revalidateOrg(orgId);
  return { ok: true };
}

/** Re-sends a partner org owner's activation email with a fresh ticket. */
export async function resendPartnerActivation(
  orgId: number,
): Promise<AdminPartnerResult> {
  await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(orgId, "orgId");

  const [org] = await db
    .select()
    .from(partnerOrgs)
    .where(eq(partnerOrgs.id, orgId))
    .limit(1);
  if (!org) return { ok: false, error: "Org not found." };
  if (!org.clerkUserId) {
    return { ok: false, error: "This org has no account to activate yet — approve it first." };
  }

  const activateUrl = await buildPartnerActivateUrl(org.clerkUserId);
  if (!activateUrl) {
    return { ok: false, error: "Could not generate an activation link. Please try again." };
  }

  const sent = await sendPartnerApprovedEmail({
    to: org.contactEmail,
    contactName: org.contactName ?? "",
    orgName: org.name,
    activateUrl,
  });
  if (!sent) {
    return { ok: false, error: "The activation email could not be sent. Check email configuration." };
  }
  return { ok: true };
}

/** Records a single transaction for an attributed clinic (+ its ledger entries). */
export async function addPartnerTransaction(input: {
  clinicId: number;
  dateIso: string;
  amountDollars: number;
  /** Wholesale cost (floor total); required for margin-model orgs. */
  costDollars?: number | null;
  description: string;
  reference: string;
}): Promise<AdminPartnerResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(input.clinicId, "clinicId");

  const date = new Date(input.dateIso);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Enter a valid transaction date." };
  }
  if (!Number.isFinite(input.amountDollars) || input.amountDollars < 0) {
    return { ok: false, error: "Enter a valid revenue amount." };
  }
  let costCents: number | null = null;
  if (input.costDollars != null && input.costDollars !== ("" as unknown)) {
    if (!Number.isFinite(input.costDollars) || input.costDollars < 0) {
      return { ok: false, error: "Enter a valid cost amount." };
    }
    costCents = Math.round(input.costDollars * 100);
  }

  try {
    await createTransactionWithCommission({
      clinicId: input.clinicId,
      date,
      revenueCents: Math.round(input.amountDollars * 100),
      costCents,
      description: input.description.trim().slice(0, 300) || null,
      reference: input.reference.trim().slice(0, 120) || null,
      source: "manual",
      createdBy: ctx.userId,
    });
  } catch (err) {
    if (err instanceof DuplicateReferenceError) {
      return {
        ok: false,
        error: "A transaction with this reference already exists.",
      };
    }
    if (err instanceof TransactionError) {
      return { ok: false, error: err.message };
    }
    console.error("[admin/partners] addPartnerTransaction failed");
    return { ok: false, error: "Could not record the transaction." };
  }

  await recordAdminAudit(ctx, "partner.transaction_add", {
    type: "clinic",
    id: input.clinicId,
  }, { revenueCents: Math.round(input.amountDollars * 100), costCents });

  revalidatePath("/admin/partners/transactions");
  return { ok: true };
}

/** Approves all pending earning entries for an org, making them payable. */
export async function approvePartnerCommission(
  orgId: number,
): Promise<AdminPartnerResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(orgId, "orgId");

  const updated = await db
    .update(commissionEntries)
    .set({ status: "approved" })
    .where(
      and(
        eq(commissionEntries.orgId, orgId),
        eq(commissionEntries.status, "pending"),
      ),
    )
    .returning({ id: commissionEntries.id });

  await recordAdminAudit(
    ctx,
    "partner.commission_approve",
    { type: "partner_org", id: orgId },
    { approvedCount: updated.length },
  );

  revalidateOrg(orgId);
  revalidatePath("/admin/partners/transactions");
  return { ok: true };
}

/**
 * Records a refund/chargeback against a transaction, writing the matching
 * commission clawbacks. `refundDollars` null = full refund of the remaining
 * revenue.
 */
export async function refundPartnerTransaction(input: {
  transactionId: number;
  refundDollars: number | null;
}): Promise<AdminPartnerResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(input.transactionId, "transactionId");

  let refundCents: number | null = null;
  if (input.refundDollars != null) {
    if (!Number.isFinite(input.refundDollars) || input.refundDollars <= 0) {
      return { ok: false, error: "Enter a valid refund amount." };
    }
    refundCents = Math.round(input.refundDollars * 100);
  }

  try {
    const result = await refundTransaction({
      transactionId: input.transactionId,
      refundCents,
      recordedBy: ctx.userId,
    });
    await recordAdminAudit(
      ctx,
      "partner.transaction_refund",
      { type: "partner_transaction", id: input.transactionId },
      {
        refundedCents: result.refundedCents,
        reversedCents: result.reversedCents,
      },
    );
  } catch (err) {
    if (err instanceof RefundError) return { ok: false, error: err.message };
    console.error("[admin/partners] refundPartnerTransaction failed");
    return { ok: false, error: "Could not record the refund." };
  }

  revalidatePath("/admin/partners/transactions");
  return { ok: true };
}

export interface CsvImportResult {
  ok: boolean;
  imported: number;
  errors: string[];
}

/**
 * Bulk transaction import. Each CSV row identifies a clinic (by id or
 * contact email), a date, and a revenue amount; each valid row becomes a
 * transaction with its commission entries. Rows that fail (unknown clinic,
 * no attribution, bad data) are reported individually — good rows still land.
 */
export async function importPartnerTransactionsCsv(
  csvText: string,
): Promise<CsvImportResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });

  if (csvText.length > 1024 * 1024) {
    return { ok: false, imported: 0, errors: ["File too large (1 MB max)."] };
  }

  const parsed = parseTransactionsCsv(csvText);
  const errors = [...parsed.errors];
  let imported = 0;

  for (const row of parsed.rows) {
    // Resolve clinic by id first, then by contact email.
    let clinicId = row.clinicId;
    if (!clinicId && row.clinicEmail) {
      const [clinic] = await db
        .select({ id: clinics.id })
        .from(clinics)
        .where(eq(clinics.contactEmail, row.clinicEmail))
        .limit(1);
      clinicId = clinic?.id ?? null;
    }
    if (!clinicId) {
      errors.push(`Line ${row.line}: clinic not found.`);
      continue;
    }

    try {
      await createTransactionWithCommission({
        clinicId,
        date: row.date,
        revenueCents: row.revenueCents,
        costCents: row.costCents,
        description: row.description,
        reference: row.reference,
        source: "csv",
        createdBy: ctx.userId,
      });
      imported++;
    } catch (err) {
      if (err instanceof DuplicateReferenceError) {
        errors.push(
          `Line ${row.line}: duplicate reference "${row.reference}" — skipped.`,
        );
      } else {
        errors.push(
          `Line ${row.line}: ${err instanceof TransactionError ? err.message : "could not record the transaction."}`,
        );
      }
    }
  }

  revalidatePath("/admin/partners/transactions");
  return { ok: imported > 0 || errors.length === 0, imported, errors };
}

/**
 * Records a payout to an org (repId null) or one of its reps. The amount is
 * the payee's full unpaid balance (pending + approved entries); those entries
 * are atomically marked `paid` and stamped with the payout id.
 */
export async function recordPartnerPayout(input: {
  orgId: number;
  repId: number | null;
  method: string;
  reference: string;
  notes: string;
}): Promise<AdminPartnerResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(input.orgId, "orgId");
  if (input.repId != null) assertId(input.repId, "repId");

  const payee = input.repId != null ? ("rep" as const) : ("org" as const);
  // Only APPROVED entries are payable. Reversals (clawbacks) are created
  // approved, so they net against the payable balance here.
  const entryScope = and(
    eq(commissionEntries.orgId, input.orgId),
    eq(commissionEntries.payee, payee),
    ...(input.repId != null ? [eq(commissionEntries.repId, input.repId)] : []),
    eq(commissionEntries.status, "approved"),
  );

  try {
    const result = await db.transaction(async (tx) => {
      // Lock the payable entries so two concurrent payouts can't double-pay.
      const payable = await tx
        .select({
          id: commissionEntries.id,
          amountCents: commissionEntries.amountCents,
        })
        .from(commissionEntries)
        .where(entryScope)
        .for("update");

      if (payable.length === 0) return null;
      const amountCents = payable.reduce((sum, e) => sum + e.amountCents, 0);
      // Net is zero or negative (clawbacks ≥ earnings): nothing to pay. Leave
      // the entries approved so the negative carries into the next payout.
      if (amountCents <= 0) return 0;

      const [payout] = await tx
        .insert(payouts)
        .values({
          orgId: input.orgId,
          repId: input.repId,
          payee,
          amountCents,
          method: input.method.trim().slice(0, 40) || null,
          reference: input.reference.trim().slice(0, 200) || null,
          notes: input.notes.trim().slice(0, 4000) || null,
          recordedBy: ctx.userId,
          recordedByEmail: ctx.email,
        })
        .returning({ id: payouts.id });

      await tx
        .update(commissionEntries)
        .set({ status: "paid", payoutId: payout.id })
        .where(
          inArray(
            commissionEntries.id,
            payable.map((e) => e.id),
          ),
        );

      return amountCents;
    });

    if (result == null || result <= 0) {
      return {
        ok: false,
        error:
          "No payable commission for this payee (nothing approved, or clawbacks offset the balance).",
      };
    }

    await recordAdminAudit(ctx, "partner.payout", {
      type: "partner_org",
      id: input.orgId,
    }, { repId: input.repId, payee, amountCents: result });

    // Notify partner webhooks (best-effort, non-blocking).
    runAfterResponse(
      dispatchPartnerEvent(input.orgId, "payout.recorded", {
        payee,
        repId: input.repId,
        amountCents: result,
      }),
    );

    // Confirmation email (best-effort).
    runAfterResponse(
      (async () => {
        const recipient =
          input.repId != null
            ? await db
                .select({ name: partnerReps.name, email: partnerReps.email })
                .from(partnerReps)
                .where(eq(partnerReps.id, input.repId))
                .limit(1)
                .then((r) => r[0])
            : await db
                .select({
                  name: sql<string>`coalesce(${partnerOrgs.contactName}, ${partnerOrgs.name})`,
                  email: partnerOrgs.contactEmail,
                })
                .from(partnerOrgs)
                .where(eq(partnerOrgs.id, input.orgId))
                .limit(1)
                .then((r) => r[0]);
        if (recipient?.email) {
          await sendPayoutRecordedEmail({
            to: recipient.email,
            name: recipient.name ?? "",
            amountLabel: formatCents(result),
            method: input.method.trim() || null,
            reference: input.reference.trim() || null,
          });
        }
      })(),
    );
  } catch {
    console.error("[admin/partners] recordPartnerPayout failed");
    return { ok: false, error: "Could not record the payout." };
  }

  revalidateOrg(input.orgId);
  return { ok: true };
}
