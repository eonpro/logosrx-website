export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { count, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { ADMIN_LIST_LIMIT } from "@/lib/constants";

function actorBadgeClass(actorType: string): string {
  switch (actorType) {
    case "admin":
      return "bg-magenta/10 text-magenta";
    case "partner":
      return "bg-navy/10 text-navy";
    default:
      return "bg-beige-dark/50 text-navy/65";
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Audit Log</h1>
        <p className="mt-1 text-sm text-navy/70">
          Immutable record of privileged changes — approvals, suspensions,
          pricing/commission edits, payouts, quotes, and card reveals.
        </p>
        {overflow && (
          <p className="mt-1 text-xs text-navy/55">
            Showing the {events.length} most recent of {total}.
          </p>
        )}
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-beige bg-white p-12 text-center">
          <p className="text-sm text-navy/65">No audit events recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-beige bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-beige bg-cream/50 text-xs uppercase tracking-wider text-navy/60">
                <th className="px-5 py-3.5 text-left font-semibold">When</th>
                <th className="px-5 py-3.5 text-left font-semibold">Actor</th>
                <th className="px-5 py-3.5 text-left font-semibold">Action</th>
                <th className="px-5 py-3.5 text-left font-semibold">Target</th>
                <th className="px-5 py-3.5 text-left font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige">
              {events.map((e) => {
                const meta = formatMetadata(e.metadata);
                return (
                  <tr key={e.id} className="align-top transition-colors hover:bg-cream/30">
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
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${actorBadgeClass(e.actorType)}`}
                      >
                        {e.actorType}
                      </span>
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
