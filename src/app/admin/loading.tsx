/**
 * Streaming skeleton for any admin page. Matches the admin layout's card
 * spacing so the sidebar/header stay stable while data loads.
 */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading…</span>
      <div className="space-y-2">
        <div className="h-6 w-48 rounded-full bg-beige motion-safe:animate-pulse" />
        <div className="h-3 w-32 rounded-full bg-beige motion-safe:animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl border border-beige bg-white motion-safe:animate-pulse"
          />
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-14 rounded-2xl border border-beige bg-white motion-safe:animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
