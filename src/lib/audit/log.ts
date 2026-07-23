import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { clientKeyFromHeaders } from "@/lib/security/rate-limit";
import { log } from "@/lib/observability/logger";
import type { AdminContext } from "@/lib/auth/admin";
import type { PartnerContext } from "@/lib/auth/partner";

/**
 * Append-only audit trail for privileged mutations.
 *
 * Recording is best-effort: an audit write must never block or fail the
 * business mutation it describes (the mutation has already committed by the
 * time we record). Failures are logged loudly to `console.error` (and thus to
 * Sentry via the server logger pipeline) so a broken trail is detectable.
 *
 * For the strongest compliance posture, grant the app's DB role only
 * INSERT/SELECT on `audit_events` so rows can never be updated or deleted.
 */

export type AuditActorType = "admin" | "partner" | "clinic" | "system";

export interface AuditInput {
  actorType: AuditActorType;
  actorId?: string | null;
  actorEmail?: string | null;
  /** Dotted action name, e.g. "clinic.verify", "partner_org.suspend". */
  action: string;
  targetType?: string | null;
  targetId?: string | number | null;
  /** Structured, non-sensitive context. Never include PHI/PII or card data. */
  metadata?: Record<string, unknown> | null;
}

async function bestEffortIp(): Promise<string | null> {
  try {
    const h = await headers();
    const key = clientKeyFromHeaders(h);
    return key === "unknown" ? null : key.slice(0, 64);
  } catch {
    return null;
  }
}

/** Records a single audit event. Swallows (but logs) its own errors. */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const ip = await bestEffortIp();
    await db.insert(auditEvents).values({
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId != null ? String(input.targetId) : null,
      metadata: input.metadata ?? null,
      ip,
    });
  } catch (err) {
    log.error("audit record failed", { action: input.action, error: err });
  }
}

/** Convenience wrapper for admin-initiated actions. */
export async function recordAdminAudit(
  ctx: Pick<AdminContext, "userId" | "email">,
  action: string,
  target: { type: string; id: string | number | null },
  metadata?: Record<string, unknown> | null,
): Promise<void> {
  await recordAudit({
    actorType: "admin",
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action,
    targetType: target.type,
    targetId: target.id,
    metadata,
  });
}

/** Convenience wrapper for partner-initiated actions. */
export async function recordPartnerAudit(
  ctx: Pick<PartnerContext, "userId" | "kind" | "org"> & {
    rep?: PartnerContext["rep"];
  },
  action: string,
  target: { type: string; id: string | number | null },
  metadata?: Record<string, unknown> | null,
): Promise<void> {
  await recordAudit({
    actorType: "partner",
    actorId: ctx.userId,
    actorEmail: ctx.rep?.email ?? ctx.org.contactEmail ?? null,
    action,
    targetType: target.type,
    targetId: target.id,
    metadata: {
      orgId: ctx.org.id,
      partnerKind: ctx.kind,
      ...(ctx.rep ? { repId: ctx.rep.id } : {}),
      ...(metadata ?? {}),
    },
  });
}
