"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cardAccessLog,
  clinicNotes,
  clinicPayments,
  clinicPricing,
  clinics,
} from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { recordAdminAudit } from "@/lib/audit/log";
import {
  buildActivateUrl,
  clerkErrorMessage,
  setClerkUserPassword,
  validatePasswordInput,
} from "@/lib/auth/clerk-users";
import { decrypt } from "@/lib/onboarding/encryption";
import { sendClinicApprovedEmail } from "@/lib/notifications/email";
import { notifyClinicApproved } from "@/lib/notifications/slack";
import { runAfterResponse } from "@/lib/runtime/after";

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
 * One-time activation link for a clinic's existing Clerk account (shared
 * ticket flow in `@/lib/auth/clerk-users`; lands on the clinic dashboard).
 */
async function buildClinicActivateUrl(
  clerkUserId: string | null,
): Promise<string | null> {
  return buildActivateUrl(clerkUserId);
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

  await recordAdminAudit(
    ctx,
    status === "verified"
      ? "clinic.verify"
      : status === "rejected"
        ? "clinic.reject"
        : "clinic.unverify",
    { type: "clinic", id },
    { status },
  );

  if (status === "verified") {
    // Notifications (and the Clerk activation-link mint) are best-effort and
    // can be slow — run them after the response so the admin's approval click
    // returns as soon as the status write commits.
    runAfterResponse(
      (async () => {
        const [clinic] = await db
          .select()
          .from(clinics)
          .where(eq(clinics.id, id))
          .limit(1);
        if (!clinic) return;
        const clinicName =
          clinic.clinicName || clinic.practiceLegalName || "your clinic";
        try {
          if (clinic.contactEmail) {
            // A one-time link the clinic uses to set their own password.
            // Critical for rep-onboarded clinics who never chose one.
            const activateUrl = await buildClinicActivateUrl(
              clinic.clerkUserId,
            );
            await sendClinicApprovedEmail({
              to: clinic.contactEmail,
              contactName: clinic.contactName ?? "",
              clinicName,
              activateUrl: activateUrl ?? undefined,
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
      })(),
    );
  }

  revalidatePath("/admin/clinics");
  revalidatePath(`/admin/clinics/${id}`);
  revalidatePath("/admin");
}

export interface ResendActivationResult {
  ok: boolean;
  error?: string;
}

/**
 * Re-sends the account-activation email to a clinic without changing their
 * verification status. Mints a fresh one-time sign-in ticket so the link is
 * always valid. Useful when the original approval email was missed, the link
 * expired, or the clinic was onboarded by a rep and never set a password.
 */
export async function resendClinicActivation(
  id: number,
): Promise<ResendActivationResult> {
  await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);

  const [clinic] = await db
    .select()
    .from(clinics)
    .where(eq(clinics.id, id))
    .limit(1);
  if (!clinic) return { ok: false, error: "Clinic not found." };
  if (!clinic.contactEmail) {
    return { ok: false, error: "This clinic has no contact email on file." };
  }
  if (!clinic.clerkUserId) {
    return { ok: false, error: "This clinic has no account to activate." };
  }

  const activateUrl = await buildClinicActivateUrl(clinic.clerkUserId);
  if (!activateUrl) {
    return {
      ok: false,
      error: "Could not generate an activation link. Please try again.",
    };
  }

  const clinicName =
    clinic.clinicName || clinic.practiceLegalName || "your clinic";
  const sent = await sendClinicApprovedEmail({
    to: clinic.contactEmail,
    contactName: clinic.contactName ?? "",
    clinicName,
    activateUrl,
  });
  if (!sent) {
    return {
      ok: false,
      error:
        "The activation email could not be sent. Check email configuration and try again.",
    };
  }

  return { ok: true };
}

/**
 * Directly sets a clinic's sign-in password (no email round-trip) so an admin can
 * hand the clinic working credentials — handy when the clinic was rep-onboarded
 * and never set one, or forgot it. Full admins only; audited.
 */
export async function setClinicPassword(
  id: number,
  password: string,
): Promise<ResendActivationResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(id);

  const pwErr = validatePasswordInput(password ?? "");
  if (pwErr) return { ok: false, error: pwErr };

  const [clinic] = await db
    .select({ id: clinics.id, clerkUserId: clinics.clerkUserId })
    .from(clinics)
    .where(eq(clinics.id, id))
    .limit(1);
  if (!clinic) return { ok: false, error: "Clinic not found." };
  if (!clinic.clerkUserId) {
    return { ok: false, error: "This clinic has no account yet." };
  }

  try {
    await setClerkUserPassword(clinic.clerkUserId, password);
  } catch (err) {
    return { ok: false, error: clerkErrorMessage(err, "Could not set the password.") };
  }

  await recordAdminAudit(ctx, "clinic.set_password", { type: "clinic", id });
  return { ok: true };
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

  // Audit the access before returning the sensitive data. Written to both the
  // dedicated card-access log and the unified audit trail.
  await db.insert(cardAccessLog).values({
    clinicId,
    adminUserId: ctx.userId,
    adminEmail: ctx.email,
    action: "reveal",
  });
  await recordAdminAudit(ctx, "clinic.card_reveal", {
    type: "clinic",
    id: clinicId,
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
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
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

  await recordAdminAudit(ctx, "clinic.pricing_update", {
    type: "clinic",
    id: clinicId,
  }, { tier, discountPct: pct });

  revalidatePath(`/admin/clinics/${clinicId}`);
}

/**
 * Sets (or updates) a clinic's override price for a catalog SKU. Upserts on
 * (clinicId, productId) so re-saving the same product replaces the override.
 */
export async function setProductPrice(
  clinicId: number,
  productId: string,
  productName: string,
  priceDollars: number,
  unit: string,
) {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(clinicId, "clinicId");
  const pid = productId.trim();
  if (!pid) throw new Error("productId required");
  const name = productName.trim() || pid;
  if (!Number.isFinite(priceDollars) || priceDollars < 0) {
    throw new Error("invalid price");
  }
  const cents = Math.round(priceDollars * 100);
  const cleanUnit = unit.trim() || null;

  await db
    .insert(clinicPricing)
    .values({
      clinicId,
      productId: pid,
      productName: name,
      priceCents: cents,
      unit: cleanUnit,
    })
    .onConflictDoUpdate({
      target: [clinicPricing.clinicId, clinicPricing.productId],
      set: {
        priceCents: cents,
        productName: name,
        unit: cleanUnit,
        updatedAt: new Date(),
      },
    });

  await recordAdminAudit(ctx, "clinic.product_price_set", {
    type: "clinic",
    id: clinicId,
  }, { productId: pid, priceCents: cents });

  revalidatePath(`/admin/clinics/${clinicId}`);
}

/** Clears a clinic's override for a catalog SKU, reverting it to standard pricing. */
export async function resetProductPrice(clinicId: number, productId: string) {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(clinicId, "clinicId");
  const pid = productId.trim();
  if (!pid) throw new Error("productId required");

  await db
    .delete(clinicPricing)
    .where(
      and(eq(clinicPricing.clinicId, clinicId), eq(clinicPricing.productId, pid)),
    );

  await recordAdminAudit(ctx, "clinic.product_price_reset", {
    type: "clinic",
    id: clinicId,
  }, { productId: pid });

  revalidatePath(`/admin/clinics/${clinicId}`);
}

/** Adds an ad-hoc custom line item (not tied to a catalog SKU). */
export async function addPriceItem(
  clinicId: number,
  productName: string,
  priceDollars: number,
  unit: string,
) {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(clinicId, "clinicId");
  const name = productName.trim();
  if (!name) throw new Error("product name required");
  if (!Number.isFinite(priceDollars) || priceDollars < 0) {
    throw new Error("invalid price");
  }
  const cents = Math.round(priceDollars * 100);

  await db.insert(clinicPricing).values({
    clinicId,
    productName: name,
    priceCents: cents,
    unit: unit.trim() || null,
  });

  await recordAdminAudit(ctx, "clinic.price_item_add", {
    type: "clinic",
    id: clinicId,
  }, { productName: name, priceCents: cents });

  revalidatePath(`/admin/clinics/${clinicId}`);
}

/** Removes a per-product custom price. */
export async function deletePriceItem(itemId: number) {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  assertId(itemId, "itemId");
  const [row] = await db
    .delete(clinicPricing)
    .where(eq(clinicPricing.id, itemId))
    .returning({ clinicId: clinicPricing.clinicId });
  if (row) {
    await recordAdminAudit(ctx, "clinic.price_item_delete", {
      type: "clinic",
      id: row.clinicId,
    }, { itemId });
    revalidatePath(`/admin/clinics/${row.clinicId}`);
  }
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
