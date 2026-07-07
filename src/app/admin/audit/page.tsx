export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { count, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { ADMIN_LIST_LIMIT } from "@/lib/constants";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  rowClass,
  tableWrapClass,
  theadClass,
  type BadgeTone,
} from "@/components/ui/portal";

function actorBadgeTone(actorType: string): BadgeTone {
  switch (actorType) {
    case "admin":
      return "accent";
    case "partner":
      return "neutral";
    default:
      return "neutral";
  }
}

function formatMetadata(metadata: unknown): string | null {
  if (metadata == null || typeof metadata !== "object") return null;
  const entries = Object.entries(metadata as Record<string, unknown>);
  if (entries.length === 0) return null;
  return entries
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
}

export default async function AuditLogPage() {
  await requireAdmin();

  const [events, [{ total }]] = await Promise.all([
    db
      .select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.createdAt))
      .limit(ADMIN_LIST_LIMIT),
    db.select({ total: count() }).from(auditEvents),
  ]);
  const overflow = total > events.length;

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Audit Log"
        description={
          <>
            Immutable record of privileged changes — approvals, suspensions,
            pricing/commission edits, payouts, quotes, and card reveals.
            {overflow && (
              <span className="block text-xs text-navy/45">
                Showing the {events.length} most recent of {total}.
              </span>
            )}
          </>
        }
      />

      {events.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            title="No audit events yet"
            body="Privileged changes will be recorded here as they happen."
          />
        </Card>
      ) : (
        <div className={tableWrapClass}>
          <table className="w-full text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">When</th>
                <th className="px-5 py-4 font-semibold">Actor</th>
                <th className="px-5 py-4 font-semibold">Action</th>
                <th className="px-5 py-4 font-semibold">Target</th>
                <th className="px-5 py-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const meta = formatMetadata(e.metadata);
                return (
                  <tr key={e.id} className={`${rowClass} align-top`}>
                    <td className="whitespace-nowrap px-5 py-4 text-navy/65">
                      {new Date(e.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={actorBadgeTone(e.actorType)}>
                        {e.actorType}
                      </Badge>
                      {e.actorEmail && (
                        <div className="mt-1 text-xs text-navy/55">{e.actorEmail}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-medium text-navy">
                      {e.action}
                    </td>
                    <td className="px-5 py-4 text-navy/65">
                      {e.targetType ? (
                        <span>
                          {e.targetType}
                          {e.targetId ? ` #${e.targetId}` : ""}
                        </span>
                      ) : (
                        <span className="text-navy/35">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-navy/55">
                      {meta ?? <span className="text-navy/35">—</span>}
                      {e.ip && <div className="mt-1 text-navy/35">IP {e.ip}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
