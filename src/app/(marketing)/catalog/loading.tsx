/**
 * Streaming skeleton for `/catalog`. The hero is statically rendered above
 * (it doesn't depend on the awaited searchParams), so the skeleton only has
 * to stand in for the toolbar + table grid.
 */
export default function Loading() {
  return (
    <>
      <section className="bg-gradient-to-b from-cream to-white pt-16 pb-10 sm:pt-20 sm:pb-12">
        <div
          aria-busy="true"
          aria-live="polite"
          className="mx-auto max-w-7xl px-6 lg:px-8"
        >
          <span className="sr-only">Loading catalog…</span>
          <div className="h-3 w-40 rounded-full bg-beige motion-safe:animate-pulse" />
          <div className="mt-4 h-12 w-72 rounded-2xl bg-beige motion-safe:animate-pulse" />
          <div className="mt-6 h-4 w-56 rounded-full bg-beige motion-safe:animate-pulse" />
        </div>
      </section>

      <section className="bg-white pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col gap-4 border-b border-beige pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="h-10 w-full max-w-md rounded-full bg-beige motion-safe:animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-32 rounded-full bg-beige motion-safe:animate-pulse" />
              <div className="h-9 w-44 rounded-full bg-beige motion-safe:animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 pt-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-28 rounded-full bg-beige motion-safe:animate-pulse" />
                    <div className="h-3 w-40 rounded-full bg-beige motion-safe:animate-pulse" />
                    <div className="h-3 w-36 rounded-full bg-beige motion-safe:animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-beige bg-white p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-6 gap-4 border-b border-beige/70 py-3 last:border-b-0"
                >
                  <div className="col-span-2 h-4 rounded-full bg-beige motion-safe:animate-pulse" />
                  <div className="h-4 rounded-full bg-beige motion-safe:animate-pulse" />
                  <div className="h-4 rounded-full bg-beige motion-safe:animate-pulse" />
                  <div className="h-4 rounded-full bg-beige motion-safe:animate-pulse" />
                  <div className="h-4 rounded-full bg-beige motion-safe:animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
