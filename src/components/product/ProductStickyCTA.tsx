import { SITE } from "@/lib/constants";

interface ProductStickyCTAProps {
  productName: string;
}

/**
 * Mobile-only (`<lg`) persistent bottom action bar — the e-commerce PDP
 * pattern (think "Add to cart" / Hims "Get started"). Keeps the primary
 * conversion action one thumb-tap away no matter how far the provider has
 * scrolled, instead of forcing them back up to the hero CTA.
 *
 * Server component: ships no JS. Honors the iOS home-indicator inset via
 * `.safe-pb` and frosts over content with a backdrop blur (falls back to an
 * opaque white bar where `backdrop-filter` is unsupported).
 */
export default function ProductStickyCTA({ productName }: ProductStickyCTAProps) {
  return (
    <div
      className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-beige bg-white/90 backdrop-blur-lg lg:hidden"
      role="region"
      aria-label="Prescribe this product"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-navy">
            {productName}
          </p>
          <p className="text-xs leading-tight text-navy/55">
            Provider onboarding portal
          </p>
        </div>
        <a
          href={SITE.onboarding}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-magenta px-6 text-sm font-semibold text-white transition-transform duration-100 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2"
        >
          Prescribe
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M4 10l6-6M5 4h5v5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
