/**
 * Date-range presets for the partner dashboard / transaction filters
 * ("filterable by day, week, month, year, etc").
 */

export const DATE_RANGE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "week", label: "Last 7 days" },
  { id: "month", label: "Last 30 days" },
  { id: "year", label: "Last 12 months" },
  { id: "all", label: "All time" },
] as const;

export type DateRangeId = (typeof DATE_RANGE_PRESETS)[number]["id"];

export const DEFAULT_RANGE: DateRangeId = "month";

export interface ResolvedDateRange {
  id: DateRangeId;
  label: string;
  /** Inclusive lower bound; undefined = unbounded (all time). */
  from?: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Resolves a `?range=` query param to a concrete lower bound. */
export function resolveDateRange(
  raw: string | undefined,
  now: Date = new Date(),
): ResolvedDateRange {
  const preset =
    DATE_RANGE_PRESETS.find((p) => p.id === raw) ??
    DATE_RANGE_PRESETS.find((p) => p.id === DEFAULT_RANGE)!;

  switch (preset.id) {
    case "today": {
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      return { id: preset.id, label: preset.label, from };
    }
    case "week":
      return {
        id: preset.id,
        label: preset.label,
        from: new Date(now.getTime() - 7 * DAY_MS),
      };
    case "month":
      return {
        id: preset.id,
        label: preset.label,
        from: new Date(now.getTime() - 30 * DAY_MS),
      };
    case "year":
      return {
        id: preset.id,
        label: preset.label,
        from: new Date(now.getTime() - 365 * DAY_MS),
      };
    case "all":
      return { id: preset.id, label: preset.label };
  }
}
