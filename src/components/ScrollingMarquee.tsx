export default function ScrollingMarquee() {
  const items = Array.from({ length: 8 });

  return (
    <section className="bg-white py-6 overflow-hidden border-y border-beige">
      <div className="relative flex">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap">
          {items.map((_, i) => (
            <span key={`a-${i}`} className="flex items-center gap-8">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-navy tracking-tight">
                Excellence, Personalized
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-magenta flex-shrink-0">
                <path d="M4 2L12 8L4 14V2Z" fill="currentColor" />
              </svg>
            </span>
          ))}
        </div>
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap" aria-hidden="true">
          {items.map((_, i) => (
            <span key={`b-${i}`} className="flex items-center gap-8">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-navy tracking-tight">
                Excellence, Personalized
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-magenta flex-shrink-0">
                <path d="M4 2L12 8L4 14V2Z" fill="currentColor" />
              </svg>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
