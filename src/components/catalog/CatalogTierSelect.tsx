"use client";

import { useId, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CATALOG_CONFIG,
  CATALOG_TIERS,
  parseCatalogSearchParams,
  serializeCatalogSearchParams,
  type CatalogTier,
} from "@/data/catalog";

interface CatalogTierSelectProps {
  value: CatalogTier;
}

/**
 * Segmented toggle that switches which tier is "primary" — i.e. highlighted
 * in the table and used as the comparison basis for price sorting. The
 * primary tier persists in the URL via `?tier=`.
 */
export default function CatalogTierSelect({ value }: CatalogTierSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  // Unique per instance — the page renders this control twice (a mobile
  // segmented control + the desktop toolbar), so a hardcoded id would
  // produce duplicate DOM ids and break the radiogroup label association.
  const labelId = useId();

  function setTier(nextTier: CatalogTier) {
    if (nextTier === value) return;
    const current = parseCatalogSearchParams(
      Object.fromEntries(new URLSearchParams(window.location.search).entries()),
    );
    const qs = serializeCatalogSearchParams({
      ...current,
      tier: nextTier,
      page: 1,
    });
    startTransition(() => {
      router.replace(`${pathname}${qs}`, { scroll: false });
    });
  }

  return (
    <div className="flex w-full items-center gap-2 lg:w-auto">
      <span
        id={labelId}
        className="shrink-0 text-xs font-semibold uppercase tracking-wider text-navy/65 whitespace-nowrap"
      >
        <span className="lg:hidden">Show price</span>
        <span className="hidden lg:inline">Highlight</span>
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="flex w-full items-center rounded-full border border-beige bg-white p-0.5 lg:inline-flex lg:w-auto"
      >
        {CATALOG_TIERS.map((tier) => {
          const isActive = tier === value;
          return (
            <button
              key={tier}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setTier(tier)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta lg:flex-none lg:py-1.5 lg:text-xs ${
                isActive
                  ? "bg-navy text-white"
                  : "text-navy/65 hover:text-navy"
              }`}
            >
              {CATALOG_CONFIG.priceTierLabels[tier]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
