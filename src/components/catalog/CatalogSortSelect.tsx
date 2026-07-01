"use client";

import { useId, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  parseCatalogSearchParams,
  serializeCatalogSearchParams,
  type CatalogSort,
} from "@/data/catalog";

interface CatalogSortSelectProps {
  value: CatalogSort;
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
export default function CatalogSortSelect({ value }: CatalogSortSelectProps) {
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

  return (
    <div className="flex w-full items-center gap-2 lg:w-auto">
      <label
        htmlFor={id}
        className="hidden text-xs font-semibold uppercase tracking-wider text-navy/65 whitespace-nowrap lg:block"
      >
        Sort by
      </label>
      <div className="relative w-full lg:w-auto">
        {/* Leading sort glyph — only needed on mobile where the label is hidden. */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/45 lg:hidden"
        >
          <path
            d="M2.5 3.5h9M4 7h6M5.5 10.5h3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <select
          id={id}
          value={value}
          onChange={handleChange}
          aria-label="Sort catalog by price or name"
          className="min-h-11 w-full appearance-none rounded-full border border-beige bg-white py-2 pl-10 pr-9 text-sm font-medium text-navy hover:border-navy/30 focus:border-magenta focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta cursor-pointer lg:min-h-0 lg:w-auto lg:pl-3.5"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
