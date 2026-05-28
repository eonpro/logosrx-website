"use client";

import { useId, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CATALOG_CONFIG,
  parseCatalogSearchParams,
  serializeCatalogSearchParams,
  type CatalogSort,
  type CatalogTier,
} from "@/data/catalog";

interface CatalogSortSelectProps {
  value: CatalogSort;
  tier: CatalogTier;
}

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "name", label: "Name (A → Z)" },
  { value: "price-asc", label: "Price (low → high)" },
  { value: "price-desc", label: "Price (high → low)" },
];

/**
 * Native `<select>` for sorting. Native because:
 *   - it's keyboard- and screen-reader-friendly with zero work
 *   - mobile gets the platform-native picker (much better UX on iOS/Android)
 *   - no need for a JS popover library
 */
export default function CatalogSortSelect({ value, tier }: CatalogSortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const id = useId();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextSort = event.target.value as CatalogSort;
    const current = parseCatalogSearchParams(
      Object.fromEntries(new URLSearchParams(window.location.search).entries()),
    );
    const qs = serializeCatalogSearchParams({
      ...current,
      sort: nextSort,
      page: 1,
    });
    startTransition(() => {
      router.replace(`${pathname}${qs}`, { scroll: false });
    });
  }

  const tierLabel = CATALOG_CONFIG.priceTierLabels[tier];

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wider text-navy/65 whitespace-nowrap"
      >
        Sort by
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={handleChange}
          aria-label={`Sort catalog by ${tierLabel} price or name`}
          className="appearance-none rounded-full border border-beige bg-white py-2 pl-3.5 pr-9 text-sm font-medium text-navy hover:border-navy/30 focus:border-magenta focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value === "name"
                ? opt.label
                : `${opt.label} — ${tierLabel}`}
            </option>
          ))}
        </select>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-navy/55"
        >
          <path
            d="M2 4l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
