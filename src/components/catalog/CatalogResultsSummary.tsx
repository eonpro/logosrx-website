interface CatalogResultsSummaryProps {
  total: number;
  page: number;
  pageSize: number;
}

/**
 * "Showing 1–50 of 741 results" line.
 *
 * Rendered as an `aria-live` region so screen-reader users hear the new
 * count after a filter toggle / search keystroke without having to refocus.
 */
export default function CatalogResultsSummary({
  total,
  page,
  pageSize,
}: CatalogResultsSummaryProps) {
  if (total === 0) {
    return (
      <p
        aria-live="polite"
        className="text-sm font-medium text-navy/65"
      >
        0 results
      </p>
    );
  }
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, total);
  const isSingle = start === end;
  return (
    <p aria-live="polite" className="text-sm font-medium text-navy/75">
      Showing{" "}
      <span className="font-bold text-navy tabular-nums">
        {isSingle ? start.toLocaleString() : `${start.toLocaleString()}–${end.toLocaleString()}`}
      </span>{" "}
      of{" "}
      <span className="font-bold text-navy tabular-nums">
        {total.toLocaleString()}
      </span>{" "}
      {total === 1 ? "result" : "results"}
    </p>
  );
}
