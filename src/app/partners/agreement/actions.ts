"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerAgreements, partnerOrgs, partnerReps } from "@/lib/db/schema";
import { getPartnerContext } from "@/lib/auth/partner";
import { recordPartnerAudit } from "@/lib/audit/log";
import { clientKeyFromHeaders } from "@/lib/security/rate-limit";
import { runAfterResponse } from "@/lib/runtime/after";
import {
  MSA_TITLE,
  MSA_VERSION,
  renderMsaText,
  type MsaFieldValues,
} from "@/lib/partners/msa";
import {
  sendPartnerMsaSignedEmail,
  sendPharmacyMsaSignedNotification,
} from "@/lib/notifications/email";

export interface SignMsaInput {
  legalEntityName: string;
  entityAddress: string;
  entityState: string;
  signerName: string;
  signerTitle: string;
  /** PNG data URL from the signature pad. */
  signatureImage: string;
  /** Must be true — the explicit "I have read and agree" checkbox. */
  agreed: boolean;
}

export interface SignMsaResult {
  ok: boolean;
  error?: string;
}

const MAX_SIGNATURE_BYTES = 600_000; // ~600 KB data URL ceiling.

function isPngDataUrl(s: string): boolean {
  return /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s);
}

/**
 * Records the current partner's execution of the Marketing Services Agreement.
 * Snapshots the exact rendered text + a SHA-256 of it, captures the signature
 * image and request metadata, stamps the gate flag, and (best-effort) emails a
 * copy to the partner and a notification to the pharmacy.
 *
 * Idempotent: a partner who already signed the current version gets `ok` back
 * without writing a duplicate row.
 */
export async function signPartnerMsa(
  input: SignMsaInput,
): Promise<SignMsaResult> {
  const ctx = await getPartnerContext();
  if (!ctx) {
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }

  if (!input.agreed) {
    return { ok: false, error: "You must confirm that you have read and agree to the Agreement." };
  }
  const signerName = input.signerName.trim();
  if (signerName.length < 2) {
    return { ok: false, error: "Please enter the full name of the signer." };
  }
  const signerTitle = input.signerTitle.trim();
  if (!signerTitle) {
    return { ok: false, error: "Please enter the signer's title." };
  }
  if (!isPngDataUrl(input.signatureImage)) {
    return { ok: false, error: "Please draw your signature before submitting." };
  }
  if (input.signatureImage.length > MAX_SIGNATURE_BYTES) {
    return { ok: false, error: "The signature image is too large. Please clear and sign again." };
  }

  const isOrgSigner = ctx.kind === "org";

  // Idempotency: already signed the current version → no-op success.
  const alreadySigned = isOrgSigner
    ? ctx.org.msaSignedAt
    : ctx.rep?.msaSignedAt;
  if (alreadySigned) return { ok: true };

  // Org owners supply the entity blanks; reps acknowledge the same agreement
  // and inherit the org's executed entity details (or the org name as a
  // fallback), so a rep doesn't re-key the company's legal information.
  let fieldValues: MsaFieldValues;
  if (isOrgSigner) {
    const legalEntityName = input.legalEntityName.trim();
    if (legalEntityName.length < 2) {
      return { ok: false, error: "Please enter your legal entity name." };
    }
    fieldValues = {
      effectiveDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      legalEntityName,
      entityAddress: input.entityAddress.trim(),
      entityState: input.entityState.trim(),
    };
  } else {
    const [orgAgreement] = await db
      .select({
        legalEntityName: partnerAgreements.legalEntityName,
        documentText: partnerAgreements.documentText,
      })
      .from(partnerAgreements)
      .where(
        and(
          eq(partnerAgreements.orgId, ctx.org.id),
          isNull(partnerAgreements.repId),
          eq(partnerAgreements.documentVersion, MSA_VERSION),
        ),
      )
      .orderBy(desc(partnerAgreements.signedAt))
      .limit(1);
    fieldValues = {
      effectiveDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      legalEntityName: orgAgreement?.legalEntityName ?? ctx.org.name,
      entityAddress: "",
      entityState: "",
    };
  }

  const documentText = renderMsaText(fieldValues);
  const documentHash = createHash("sha256").update(documentText, "utf8").digest("hex");

  const h = await headers();
  const ipKey = clientKeyFromHeaders(h);
  const signedIp = ipKey === "unknown" ? null : ipKey.slice(0, 64);
  const signedUserAgent = h.get("user-agent")?.slice(0, 400) ?? null;

  const signerEmail = isOrgSigner ? ctx.org.contactEmail : ctx.rep?.email ?? null;
  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(partnerAgreements).values({
        orgId: ctx.org.id,
        repId: isOrgSigner ? null : ctx.rep!.id,
        signerKind: isOrgSigner ? "org" : "rep",
        clerkUserId: ctx.userId,
        documentVersion: MSA_VERSION,
        documentTitle: MSA_TITLE,
        documentHash,
        documentText,
        legalEntityName: fieldValues.legalEntityName,
        signerName,
        signerTitle,
        signerEmail,
        signatureImage: input.signatureImage,
        signedIp,
        signedUserAgent,
        signedAt: now,
      });

      if (isOrgSigner) {
        await tx
          .update(partnerOrgs)
          .set({ msaSignedAt: now, updatedAt: now })
          .where(eq(partnerOrgs.id, ctx.org.id));
      } else {
        await tx
          .update(partnerReps)
          .set({ msaSignedAt: now, updatedAt: now })
          .where(eq(partnerReps.id, ctx.rep!.id));
      }
    });
  } catch (err) {
    console.error("[partners] signPartnerMsa failed");
    // Unique-constraint violation means a concurrent submit already recorded
    // it — treat as success rather than surfacing a scary error.
    if (err instanceof Error && /unique|duplicate/i.test(err.message)) {
      return { ok: true };
    }
    return { ok: false, error: "Could not record your signature. Please try again." };
  }

  await recordPartnerAudit(ctx, "partner.msa_sign", {
    type: isOrgSigner ? "partner_org" : "partner_rep",
    id: isOrgSigner ? ctx.org.id : ctx.rep!.id,
  }, { documentVersion: MSA_VERSION, documentHash, signerName, signerTitle });

  // Best-effort: a copy to the signer + a record notification to the pharmacy.
  const recipientEmail = signerEmail;
  const orgName = ctx.org.name;
  runAfterResponse(
    (async () => {
      if (recipientEmail) {
        await sendPartnerMsaSignedEmail({
          to: recipientEmail,
          signerName,
          orgName,
        });
      }
      await sendPharmacyMsaSignedNotification({
        orgName,
        signerName,
        signerTitle,
        signerKind: isOrgSigner ? "org" : "rep",
        orgId: ctx.org.id,
      });
    })(),
  );

  revalidatePath("/partners");
  revalidatePath("/partners/agreement");
  return { ok: true };
}
