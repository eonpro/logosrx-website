/**
 * Streaming skeleton shown while a server component is fetching data.
 *
 * Kept intentionally minimal: a centered shimmer that matches the marketing
 * type scale so the layout doesn't jump when content resolves. The pulse
 * respects `prefers-reduced-motion` via Tailwind's `motion-safe:` modifier.
 */
export default function Loading() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <span className="sr-only">Loading…</span>
      <div className="h-3 w-40 rounded-full bg-beige motion-safe:animate-pulse" />
      <div className="h-10 w-72 rounded-2xl bg-beige motion-safe:animate-pulse" />
      <div className="h-3 w-60 rounded-full bg-beige motion-safe:animate-pulse" />
      <div className="h-3 w-48 rounded-full bg-beige motion-safe:animate-pulse" />
    </section>
  );
}
