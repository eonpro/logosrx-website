"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinics,
  partnerClinicActivity,
  partnerClinicMeta,
} from "@/lib/db/schema";
import { requirePartner, type PartnerContext } from "@/lib/auth/partner";
import { recordPartnerAudit } from "@/lib/audit/log";

export interface CrmActionResult {
  ok: boolean;
  error?: string;
}

const STAGES = ["lead", "active", "at_risk", "dormant"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_LABELS: Record<Stage, string> = {
  lead: "Lead",
  active: "Active",
  at_risk: "At risk",
  dormant: "Dormant",
};

/** Confirms the clinic is in the caller's book (org-wide, or the rep's own). */
async function assertClinicInScope(
  clinicId: number,
  ctx: PartnerContext,
): Promise<boolean> {
  const scope =
    ctx.kind === "rep"
      ? and(eq(clinics.id, clinicId), eq(clinics.partnerRepId, ctx.rep!.id))
      : and(eq(clinics.id, clinicId), eq(clinics.partnerOrgId, ctx.org.id));
  const [row] = await db
    .select({ id: clinics.id })
    .from(clinics)
    .where(scope)
    .limit(1);
  return Boolean(row);
}

function actorFields(ctx: PartnerContext) {
  return {
    orgId: ctx.org.id,
    repId: ctx.kind === "rep" ? ctx.rep!.id : null,
    actorKind: ctx.kind,
    actorName: ctx.kind === "rep" ? ctx.rep!.name : ctx.org.name,
  } as const;
}

/** Adds a note to a company's activity timeline. */
export async function addClinicNote(
  clinicId: number,
  body: string,
): Promise<CrmActionResult> {
  const ctx = await requirePartner();
  if (!Number.isInteger(clinicId) || clinicId <= 0) {
    return { ok: false, error: "Invalid company." };
  }
  const text = body.trim();
  if (!text) return { ok: false, error: "Note can't be empty." };
  if (text.length > 5000) return { ok: false, error: "Note is too long." };
  if (!(await assertClinicInScope(clinicId, ctx))) {
    return { ok: false, error: "Company not found in your book." };
  }

  const actor = actorFields(ctx);
  await db.insert(partnerClinicActivity).values({
    clinicId,
    type: "note",
    body: text,
    ...actor,
  });
  await recordPartnerAudit(ctx, "partner.clinic_note", {
    type: "clinic",
    id: clinicId,
  });

  revalidatePath(`/partners/clinics/${clinicId}`);
  return { ok: true };
}

/** Sets a company's relationship stage and logs the change. */
export async function setClinicStage(
  clinicId: number,
  stage: string,
): Promise<CrmActionResult> {
  const ctx = await requirePartner();
  if (!STAGES.includes(stage as Stage)) {
    return { ok: false, error: "Invalid stage." };
  }
  if (!(await assertClinicInScope(clinicId, ctx))) {
    return { ok: false, error: "Company not found in your book." };
  }
  const next = stage as Stage;
  const actor = actorFields(ctx);

  await db
    .insert(partnerClinicMeta)
    .values({ orgId: ctx.org.id, clinicId, stage: next })
    .onConflictDoUpdate({
      target: [partnerClinicMeta.orgId, partnerClinicMeta.clinicId],
      set: { stage: next, updatedAt: new Date() },
    });
  await db.insert(partnerClinicActivity).values({
    clinicId,
    type: "stage_change",
    body: `Stage set to “${STAGE_LABELS[next]}”`,
    ...actor,
  });
  await recordPartnerAudit(
    ctx,
    "partner.clinic_stage",
    { type: "clinic", id: clinicId },
    { stage: next },
  );

  revalidatePath(`/partners/clinics/${clinicId}`);
  return { ok: true };
}

/** Replaces a company's tag set and logs the change. */
export async function setClinicTags(
  clinicId: number,
  tags: string[],
): Promise<CrmActionResult> {
  const ctx = await requirePartner();
  if (!(await assertClinicInScope(clinicId, ctx))) {
    return { ok: false, error: "Company not found in your book." };
  }

  // Normalize: trim, drop empties, de-dupe (case-insensitive), cap length/count.
  const seen = new Set<string>();
  const clean: string[] = [];
  for (const raw of tags) {
    const t = String(raw).trim().slice(0, 40);
    const key = t.toLowerCase();
    if (t && !seen.has(key)) {
      seen.add(key);
      clean.push(t);
    }
    if (clean.length >= 20) break;
  }

  const actor = actorFields(ctx);
  await db
    .insert(partnerClinicMeta)
    .values({ orgId: ctx.org.id, clinicId, tags: clean })
    .onConflictDoUpdate({
      target: [partnerClinicMeta.orgId, partnerClinicMeta.clinicId],
      set: { tags: clean, updatedAt: new Date() },
    });
  await db.insert(partnerClinicActivity).values({
    clinicId,
    type: "tag_change",
    body: clean.length ? `Tags: ${clean.join(", ")}` : "Tags cleared",
    ...actor,
  });
  await recordPartnerAudit(
    ctx,
    "partner.clinic_tags",
    { type: "clinic", id: clinicId },
    { count: clean.length },
  );

  revalidatePath(`/partners/clinics/${clinicId}`);
  return { ok: true };
}
