"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cardAccessLog,
  clinicNotes,
  clinicPayments,
  clinicPricing,
  clinics,
} from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { decrypt } from "@/lib/onboarding/encryption";
import { sendClinicApprovedEmail } from "@/lib/notifications/email";
import { notifyClinicApproved } from "@/lib/notifications/slack";

type VerificationStatus = "pending" | "verified" | "rejected";
type PricingTier = "standard" | "preferred" | "vip";

const VALID_STATUS: ReadonlySet<VerificationStatus> =
  new Set<VerificationStatus>(["pending", "verified", "rejected"]);
const VALID_TIER: ReadonlySet<PricingTier> = new Set<PricingTier>([
  "standard",
  "preferred",
  "vip",
]);

function assertId(id: number, label = "id") {
  if (!Number.isFinite(id) || id <= 0) throw new Error(`invalid ${label}`);
}

/**
 * Sets a clinic's admin verification state. Restricted to full admins (viewers
 * are read-only). Records who acted and when. On approval, emails the clinic and
 * posts to Slack (both resilient — a notification failure never blocks the
 * status change).
 */
export async function setClinicVerification(
  id: number,
  status: VerificationStatus,
) {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);
  if (!VALID_STATUS.has(status)) throw new Error("invalid status");

  await db
    .update(clinics)
    .set({
      verificationStatus: status,
      verifiedAt: status === "pending" ? null : new Date(),
      verifiedBy: status === "pending" ? null : ctx.userId,
      updatedAt: new Date(),
    })
    .where(eq(clinics.id, id));

  if (status === "verified") {
    const [clinic] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);
    if (clinic) {
      const clinicName =
        clinic.clinicName || clinic.practiceLegalName || "your clinic";
      // Best-effort; never throw out of the status change.
      try {
        if (clinic.contactEmail) {
          await sendClinicApprovedEmail({
            to: clinic.contactEmail,
            contactName: clinic.contactName ?? "",
            clinicName,
          });
        }
        await notifyClinicApproved({
          clinicName,
          contactEmail: clinic.contactEmail ?? "",
          approvedBy: ctx.email,
        });
      } catch {
        // swallow — notifications are non-critical
      }
    }
  }

  revalidatePath("/admin/clinics");
  revalidatePath(`/admin/clinics/${id}`);
  revalidatePath("/admin");
}

export interface RevealCardResult {
  ok: boolean;
  error?: string;
  card?: {
    cardholderName: string | null;
    cardNumber: string | null;
    cvv: string | null;
    cardType: string | null;
    expiration: string | null;
    billingAddress: string | null;
    billingZip: string | null;
  };
}

/**
 * Reveals a clinic's full (decrypted) card details. Step-up protected: the admin
 * must re-enter their own password, verified against Clerk. Every successful
 * reveal is written to `card_access_log`. Full admins only.
 */
export async function revealCard(
  clinicId: number,
  password: string,
): Promise<RevealCardResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(clinicId, "clinicId");

  if (!password || password.length < 4) {
    return { ok: false, error: "Enter your password to reveal the card." };
  }

  // Step-up: verify the admin's password via Clerk Backend API.
  const verified = await verifyAdminPassword(ctx.userId, password);
  if (!verified) {
    return { ok: false, error: "Incorrect password." };
  }

  const [clinic] = await db
    .select({ clerkUserId: clinics.clerkUserId })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);
  if (!clinic) return { ok: false, error: "Clinic not found." };

  const [payment] = await db
    .select()
    .from(clinicPayments)
    .where(eq(clinicPayments.clerkUserId, clinic.clerkUserId))
    .limit(1);
  if (!payment) {
    return { ok: false, error: "No card on file for this clinic." };
  }

  // Audit the access before returning the sensitive data.
  await db.insert(cardAccessLog).values({
    clinicId,
    adminUserId: ctx.userId,
    adminEmail: ctx.email,
    action: "reveal",
  });

  return {
    ok: true,
    card: {
      cardholderName: payment.cardholderName,
      cardNumber: decrypt(payment.cardNumberEnc),
      cvv: decrypt(payment.cvvEnc),
      cardType: payment.cardType,
      expiration: payment.expiration,
      billingAddress: payment.billingAddress,
      billingZip: payment.billingZip,
    },
  };
}

async function verifyAdminPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) return false;
  try {
    const res = await fetch(
      `https://api.clerk.com/v1/users/${userId}/verify_password`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { verified?: boolean };
    return data.verified === true;
  } catch {
    return false;
  }
}

/** Appends a CRM note to a clinic's timeline. */
export async function addClinicNote(clinicId: number, body: string) {
  const ctx = await requireAdmin();
  assertId(clinicId, "clinicId");
  const trimmed = body.trim();
  if (!trimmed) throw new Error("empty note");
  if (trimmed.length > 5000) throw new Error("note too long");

  await db.insert(clinicNotes).values({
    clinicId,
    authorUserId: ctx.userId,
    authorEmail: ctx.email,
    body: trimmed,
  });

  revalidatePath(`/admin/clinics/${clinicId}`);
}

/** Updates a clinic's pricing tier, flat discount %, and free-form pricing notes. */
export async function setClinicPricing(
  clinicId: number,
  tier: PricingTier,
  discountPct: number,
  notes: string,
) {
  await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(clinicId, "clinicId");
  if (!VALID_TIER.has(tier)) throw new Error("invalid tier");
  const pct = Math.max(0, Math.min(100, Math.round(discountPct)));

  await db
    .update(clinics)
    .set({
      pricingTier: tier,
      pricingDiscountPct: pct,
      pricingNotes: notes.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(clinics.id, clinicId));

  revalidatePath(`/admin/clinics/${clinicId}`);
}

/** Adds a per-product custom price (cents) for a clinic. */
export async function addPriceItem(
  clinicId: number,
  productName: string,
  priceDollars: number,
  unit: string,
) {
  await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(clinicId, "clinicId");
  const name = productName.trim();
  if (!name) throw new Error("product name required");
  if (!Number.isFinite(priceDollars) || priceDollars < 0) {
    throw new Error("invalid price");
  }

  await db.insert(clinicPricing).values({
    clinicId,
    productName: name,
    priceCents: Math.round(priceDollars * 100),
    unit: unit.trim() || null,
  });

  revalidatePath(`/admin/clinics/${clinicId}`);
}

/** Removes a per-product custom price. */
export async function deletePriceItem(itemId: number) {
  await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(itemId, "itemId");
  const [row] = await db
    .delete(clinicPricing)
    .where(eq(clinicPricing.id, itemId))
    .returning({ clinicId: clinicPricing.clinicId });
  if (row) revalidatePath(`/admin/clinics/${row.clinicId}`);
}

/** Returns a clinic's recent card-access audit entries (most recent first). */
export async function getCardAccessLog(clinicId: number) {
  await requireAdmin();
  assertId(clinicId, "clinicId");
  return db
    .select()
    .from(cardAccessLog)
    .where(eq(cardAccessLog.clinicId, clinicId))
    .orderBy(desc(cardAccessLog.createdAt))
    .limit(20);
}
