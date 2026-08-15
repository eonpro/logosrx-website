/**
 * Streaming skeleton for clinic dashboard pages. Header/tabs stay up while
 * catalog or account data loads.
 */
export default function DashboardLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6"
    >
      <span className="sr-only">Loading…</span>
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-full bg-beige motion-safe:animate-pulse" />
        <div className="h-3 w-64 rounded-full bg-beige motion-safe:animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-44 rounded-3xl border border-beige bg-white motion-safe:animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
