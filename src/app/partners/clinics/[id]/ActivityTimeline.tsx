import type { TimelineEvent, TimelineKind } from "@/lib/partners/crm";

const DOT: Record<TimelineKind, string> = {
  note: "bg-sky-500",
  stage_change: "bg-magenta",
  tag_change: "bg-amber-500",
  transaction: "bg-emerald-500",
  joined: "bg-navy",
};

function when(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Read-only company activity feed (notes, stage/tag changes, sales, join). */
export default function ActivityTimeline({
  events,
}: {
  events: TimelineEvent[];
}) {
  return (
    <div className="rounded-2xl border border-beige bg-white p-6">
      <h2 className="text-sm font-semibold text-navy">Activity</h2>
      {events.length === 0 ? (
        <p className="mt-4 text-sm text-navy/60">No activity yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {events.map((e) => (
            <li key={e.id} className="flex gap-3">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[e.kind]}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-medium text-navy">{e.title}</p>
                  <span className="text-xs text-navy/50">{when(e.date)}</span>
                </div>
                {e.detail && (
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-navy/75">
                    {e.detail}
                  </p>
                )}
                {e.actor && (
                  <p className="mt-0.5 text-xs text-navy/45">— {e.actor}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
