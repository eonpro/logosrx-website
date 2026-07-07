import Link from "next/link";
import { DATE_RANGE_PRESETS, type DateRangeId } from "@/lib/partners/dates";

/** Preset date-range pills (day/week/month/year/all) as query-param links. */
export default function RangeFilter({
  current,
  basePath,
}: {
  current: DateRangeId;
  basePath: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {DATE_RANGE_PRESETS.map((preset) => {
        const isActive = preset.id === current;
        return (
          <Link
            key={preset.id}
            href={`${basePath}?range=${preset.id}`}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? "bg-plum text-white"
                : "border border-beige bg-white text-navy/70 hover:border-navy/30"
            }`}
          >
            {preset.label}
          </Link>
        );
      })}
    </div>
  );
}
