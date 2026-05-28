import Link from "next/link";
import {
  FILTER_GROUPS,
  serializeCatalogSearchParams,
  toggleFilterValue,
  type CatalogFilters,
  type FilterGroupKey,
} from "@/data/catalog";

interface CatalogActiveFiltersProps {
  filters: CatalogFilters;
}

interface ActivePill {
  group: FilterGroupKey;
  label: string;
  value: string;
}

/**
 * Renders one removable pill per active multi-select filter. Each pill is a
 * Link to `/catalog?…` with that value toggled off, so the pill works without
 * any client JS and is keyboard-accessible by default.
 */
export default function CatalogActiveFilters({
  filters,
}: CatalogActiveFiltersProps) {
  const pills: ActivePill[] = FILTER_GROUPS.flatMap((g) =>
    (filters[g.key] as readonly string[]).map((value) => ({
      group: g.key,
      label: g.label,
      value,
    })),
  );

  if (pills.length === 0) return null;

  return (
    <ul
      role="list"
      aria-label="Active filters"
      className="flex flex-wrap items-center gap-2"
    >
      {pills.map(({ group, label, value }) => {
        const next = toggleFilterValue(filters, group, value);
        const href = `/catalog${serializeCatalogSearchParams(next)}`;
        return (
          <li key={`${group}:${value}`}>
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 rounded-full bg-magenta/10 px-3 py-1 text-xs font-semibold text-magenta hover:bg-magenta hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-65">
                {label}:
              </span>
              <span>{value}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
                className="ml-0.5"
              >
                <path
                  d="M2 2l6 6M8 2l-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="sr-only">Remove filter</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
