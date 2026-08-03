/** Mirrors `pricing_request_status` — kept client-safe (no DB imports). */
export type PricingRequestStatus = "pending" | "reviewed" | "closed";

/** Clinic-facing status labels for pricing requests. */
export const CLINIC_STATUS_LABELS: Record<PricingRequestStatus, string> = {
  pending: "Pending",
  reviewed: "In review",
  closed: "Completed",
};

export function clinicStatusLabel(status: PricingRequestStatus): string {
  return CLINIC_STATUS_LABELS[status] ?? status;
}

/**
 * Show the catalog “pricing updated” banner when the newest closed+notified
 * request is newer than the clinic’s dismiss timestamp.
 */
export function shouldShowPricingUpdatedBanner(args: {
  latestNotifiedAt: Date | string | null | undefined;
  pricingUpdateSeenAt: Date | string | null | undefined;
}): boolean {
  if (!args.latestNotifiedAt) return false;
  const notified = toTime(args.latestNotifiedAt);
  if (notified === null) return false;
  if (!args.pricingUpdateSeenAt) return true;
  const seen = toTime(args.pricingUpdateSeenAt);
  if (seen === null) return true;
  return notified > seen;
}

function toTime(value: Date | string): number | null {
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}
