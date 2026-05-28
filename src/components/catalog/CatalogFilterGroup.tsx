import Link from "next/link";
import {
  serializeCatalogSearchParams,
  toggleFilterValue,
  type CatalogFilters,
  type FilterGroupKey,
} from "@/data/catalog";

interface CatalogFilterGroupProps {
  groupKey: FilterGroupKey;
  label: string;
  options: readonly string[];
  filters: CatalogFilters;
  counts: Record<string, number>;
  /** Defaults open for desktop sidebar; mobile drawer can open all. */
  defaultOpen?: boolean;
  /** Suffix appended to ids so mobile + desktop copies don't collide. */
  idSuffix?: string;
}

/**
 * One filter group rendered as a native `<details>` element so the collapse
 * behavior costs zero JS. Each option is a link that toggles itself in the
 * current `CatalogFilters` and rebuilds the URL via
 * `serializeCatalogSearchParams` — meaning the entire filter UI is
 * server-rendered and crawl-friendly on desktop.
 */
export default function CatalogFilterGroup({
  groupKey,
  label,
  options,
  filters,
  counts,
  defaultOpen = true,
  idSuffix = "",
}: CatalogFilterGroupProps) {
  const selected = new Set<string>(filters[groupKey] as readonly string[]);
  const id = `catalog-filter-${groupKey}${idSuffix ? `-${idSuffix}` : ""}`;

  return (
    <details
      id={id}
      open={defaultOpen}
      className="group border-b border-beige py-4 last:border-b-0"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.15em] text-navy/65 hover:text-navy">
        <span>{label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className="shrink-0 text-navy/40 transition-transform duration-200 group-open:rotate-180"
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>

      <ul role="list" className="mt-3 flex flex-col gap-1">
        {options.map((option) => {
          const isSelected = selected.has(option);
          const toggled = toggleFilterValue(filters, groupKey, option);
          const href = `/catalog${serializeCatalogSearchParams(toggled)}`;
          const count = counts[option] ?? 0;
          const disabled = !isSelected && count === 0;

          return (
            <li key={option}>
              <Link
                href={href}
                aria-pressed={isSelected}
                aria-disabled={disabled || undefined}
                tabIndex={disabled ? -1 : undefined}
                className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta ${
                  isSelected
                    ? "bg-magenta/10 text-navy font-semibold"
                    : disabled
                    ? "pointer-events-none text-navy/30"
                    : "text-navy/80 hover:bg-cream hover:text-navy"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      isSelected
                        ? "border-magenta bg-magenta text-white"
                        : "border-navy/25 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 5l2 2 4-4"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{option}</span>
                </span>
                <span
                  className={`shrink-0 text-[11px] tabular-nums ${
                    isSelected ? "text-navy/65" : "text-navy/40"
                  }`}
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
