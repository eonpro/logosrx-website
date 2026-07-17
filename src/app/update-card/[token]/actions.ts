"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cardUpdateLinks,
  clinicPayments,
  clinicSignatures,
  clinics,
} from "@/lib/db/schema";
import { encrypt } from "@/lib/onboarding/encryption";
import {
  getCardUpdateLinkByToken,
  isCardLinkOpenable,
} from "@/lib/payment-links/data";
import {
  validateCardUpdateForm,
  type CardUpdateForm,
} from "@/lib/payment-links/validate";
import { recordAudit } from "@/lib/audit/log";
import { clientKeyFromHeaders, rateLimitKey } from "@/lib/security/rate-limit";
import { log } from "@/lib/observability/logger";

export interface SubmitCardUpdateResult {
  ok: boolean;
  error?: string;
}

const GENERIC_UNAVAILABLE =
  "This link is no longer available. Please contact Logos RX for a new one.";

/**
 * Public submission for an admin-generated card-update link. The unguessable
 * token is the credential: the link must be `active` and unexpired. On success
 * the new card is encrypted into `clinic_payments` (same write shape as
 * onboarding), the payment authorization + signature are refreshed, and the
 * link is marked `used` so it can never be submitted twice.
 */
export async function submitCardUpdate(
  token: string,
  form: CardUpdateForm,
): Promise<SubmitCardUpdateResult> {
  const clean = (token ?? "").trim().toLowerCase();
  if (!clean) return { ok: false, error: "Invalid link." };

  try {
    const h = await headers();
    const limit = await rateLimitKey(
      "form",
      `card-update:${clean}:${clientKeyFromHeaders(h)}`,
    );
    if (!limit.success) {
      return {
        ok: false,
        error: "Too many attempts. Please wait a minute and try again.",
      };
    }
  } catch {
    // Fail open: a limiter hiccup must not block a legitimate submission.
  }

  const data = await getCardUpdateLinkByToken(clean);
  if (!data || !isCardLinkOpenable(data.link)) {
    return { ok: false, error: GENERIC_UNAVAILABLE };
  }

  const err = validateCardUpdateForm(form);
  if (err) return { ok: false, error: err };

  const { link, clinic } = data;
  const number = form.payment.cardNumber.replace(/\s/g, "");
  const cvv = form.payment.cvv.trim();
  const now = new Date();

  const cardFields = {
    cardholderName: form.payment.cardholderName.trim() || null,
    cardType: form.payment.cardType || null,
    expiration: form.payment.expiration.trim() || null,
    billingAddress: form.payment.billingAddress.trim() || null,
    billingZip: form.payment.billingZip.trim() || null,
    cardNumberEnc: encrypt(number),
    cardLast4: number.slice(-4),
    cvvEnc: encrypt(cvv),
  };

  try {
    if (clinic) {
      // Portal clinic: the card lands in clinic_payments like onboarding.
      const paymentValues = {
        clerkUserId: clinic.clerkUserId,
        ...cardFields,
        updatedAt: now,
      };
      await db.transaction(async (tx) => {
        // Guard against a concurrent double-submit: only one transaction can
        // flip the link from `active` to `used`; the loser writes nothing.
        const [claimed] = await tx
          .update(cardUpdateLinks)
          .set({ status: "used", usedAt: now, updatedAt: now })
          .where(eq(cardUpdateLinks.token, clean))
          .returning({ status: cardUpdateLinks.status });
        if (!claimed) throw new Error("link vanished");

        const { clerkUserId: _target, ...set } = paymentValues;
        void _target;
        await tx
          .insert(clinicPayments)
          .values(paymentValues)
          .onConflictDoUpdate({ target: clinicPayments.clerkUserId, set });

        // Refresh the payment authorization signature only — the shipping and
        // provider-agreement signatures on file are untouched.
        await tx
          .insert(clinicSignatures)
          .values({
            clerkUserId: clinic.clerkUserId,
            paymentSignature: form.paymentSignature,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: clinicSignatures.clerkUserId,
            set: { paymentSignature: form.paymentSignature, updatedAt: now },
          });

        await tx
          .update(clinics)
          .set({ paymentAuthAccepted: true, updatedAt: now })
          .where(eq(clinics.id, clinic.id));
      });
    } else {
      // External (non-portal) clinic: the card is stored on the link row
      // itself, encrypted the same way. The single UPDATE is also the
      // single-use claim (status must still be `active`).
      const [claimed] = await db
        .update(cardUpdateLinks)
        .set({
          status: "used",
          usedAt: now,
          updatedAt: now,
          ...cardFields,
          paymentSignature: form.paymentSignature,
        })
        .where(
          and(
            eq(cardUpdateLinks.token, clean),
            eq(cardUpdateLinks.status, "active"),
          ),
        )
        .returning({ id: cardUpdateLinks.id });
      if (!claimed) {
        return { ok: false, error: GENERIC_UNAVAILABLE };
      }
    }
  } catch (error) {
    log.error("card update link submit failed", { error, linkId: link.id });
    return {
      ok: false,
      error: "Could not save your card. Please try again.",
    };
  }

  await recordAudit({
    actorType: "system",
    action: "clinic.card_update_link_used",
    targetType: clinic ? "clinic" : "card_update_link",
    targetId: clinic ? clinic.id : link.id,
    metadata: { linkId: link.id, cardLast4: number.slice(-4) },
  });

  if (clinic) {
    revalidatePath(`/admin/clinics/${clinic.id}`);
    revalidatePath("/admin/clinics");
  }
  revalidatePath("/admin/card-updates");

  return { ok: true };
}
