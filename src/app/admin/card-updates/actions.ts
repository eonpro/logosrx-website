"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cardUpdateLinks } from "@/lib/db/schema";
import { ADMIN_ROLE, requireAdmin } from "@/lib/auth/admin";
import { verifyAdminPassword } from "@/lib/auth/step-up";
import { recordAdminAudit } from "@/lib/audit/log";
import { decrypt } from "@/lib/onboarding/encryption";
import { generateCardUpdateToken } from "@/lib/payment-links/data";
import { SITE_URL } from "@/lib/constants";
import type { CardUpdateLinkResult } from "../clinics/actions";

const DEFAULT_DAYS = 7;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Generates a card-update link for an EXTERNAL clinic — one that isn't on the
 * portal. The admin names the recipient; the submitted card is stored
 * (encrypted) on the link row and revealed from `/admin/card-updates`.
 * External links are independent of each other: creating one never revokes
 * another. Full admins only; audited.
 */
export async function createExternalCardUpdateLink(
  clinicName: string,
  contactEmail: string,
): Promise<CardUpdateLinkResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });

  const name = clinicName.trim();
  if (!name) return { ok: false, error: "Enter the clinic's name." };
  if (name.length > 200) return { ok: false, error: "Clinic name is too long." };
  const email = contactEmail.trim().toLowerCase();
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid contact email (or leave it blank)." };
  }

  const token = generateCardUpdateToken();
  const expiresAt = new Date(Date.now() + DEFAULT_DAYS * 24 * 60 * 60 * 1000);

  let linkId: number;
  try {
    const [row] = await db
      .insert(cardUpdateLinks)
      .values({
        token,
        clinicId: null,
        clinicName: name,
        contactEmail: email || null,
        expiresAt,
        createdBy: ctx.userId,
        createdByEmail: ctx.email,
      })
      .returning({ id: cardUpdateLinks.id });
    linkId = row.id;
  } catch {
    return { ok: false, error: "Could not create the link. Please try again." };
  }

  await recordAdminAudit(ctx, "clinic.card_update_link_create", {
    type: "card_update_link",
    id: linkId,
  }, { external: true, clinicName: name });

  revalidatePath("/admin/card-updates");
  return {
    ok: true,
    url: `${SITE_URL}/update-card/${token}`,
    expiresAt: expiresAt.toISOString(),
  };
}

/** Revokes a single link by id (works for portal and external links alike). */
export async function revokeCardUpdateLinkById(
  linkId: number,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  if (!Number.isFinite(linkId) || linkId <= 0) {
    return { ok: false, error: "Invalid link." };
  }

  const [row] = await db
    .update(cardUpdateLinks)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(cardUpdateLinks.id, linkId))
    .returning({ clinicId: cardUpdateLinks.clinicId });
  if (!row) return { ok: false, error: "Link not found." };

  await recordAdminAudit(ctx, "clinic.card_update_link_revoke", {
    type: "card_update_link",
    id: linkId,
  });

  revalidatePath("/admin/card-updates");
  if (row.clinicId) revalidatePath(`/admin/clinics/${row.clinicId}`);
  return { ok: true };
}

export interface RevealExternalCardResult {
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
 * Reveals the card submitted through an external link. Step-up protected
 * (admin re-enters their own password) and audited — mirrors the portal
 * clinic card reveal in `../clinics/actions.ts`.
 */
export async function revealExternalCard(
  linkId: number,
  password: string,
): Promise<RevealExternalCardResult> {
  const ctx = await requireAdmin({ minRole: ADMIN_ROLE });
  if (!Number.isFinite(linkId) || linkId <= 0) {
    return { ok: false, error: "Invalid link." };
  }
  if (!password || password.length < 4) {
    return { ok: false, error: "Enter your password to reveal the card." };
  }

  const verified = await verifyAdminPassword(ctx.userId, password);
  if (!verified) {
    return { ok: false, error: "Incorrect password." };
  }

  const [link] = await db
    .select()
    .from(cardUpdateLinks)
    .where(eq(cardUpdateLinks.id, linkId))
    .limit(1);
  if (!link) return { ok: false, error: "Link not found." };
  if (link.clinicId) {
    return {
      ok: false,
      error: "This clinic is on the portal — reveal their card from the clinic's page.",
    };
  }
  if (!link.cardNumberEnc) {
    return { ok: false, error: "No card was submitted through this link yet." };
  }

  await recordAdminAudit(ctx, "clinic.card_reveal", {
    type: "card_update_link",
    id: linkId,
  }, { external: true, clinicName: link.clinicName });

  return {
    ok: true,
    card: {
      cardholderName: link.cardholderName,
      cardNumber: decrypt(link.cardNumberEnc),
      cvv: decrypt(link.cvvEnc),
      cardType: link.cardType,
      expiration: link.expiration,
      billingAddress: link.billingAddress,
      billingZip: link.billingZip,
    },
  };
}
