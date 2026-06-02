/**
 * Pure pricing helpers for the clinic storefront. NO server-only imports here
 * (this module is shared with client components), so it stays trivially
 * unit-testable and bundle-safe.
 *
 * The clinic's "customer price" for a SKU is resolved in priority order:
 *   1. A per-clinic override (admin-set hard price) — wins outright.
 *   2. The standard catalog price minus the clinic's flat discount %.
 *   3. `null` when no standard price exists ("contact us for pricing").
 *
 * All money is integer cents to avoid floating-point drift.
 */

/**
 * Resolve the effective per-clinic price in cents.
 *
 * @param standardCents Standard catalog price in cents, or `null` if unpriced.
 * @param discountPct   Flat clinic discount, whole percent (clamped 0–100).
 * @param overrideCents Hard per-clinic override in cents, or `null` if none.
 */
export function computeEffectivePriceCents(
  standardCents: number | null,
  discountPct: number,
  overrideCents: number | null,
): number | null {
  if (overrideCents !== null && Number.isFinite(overrideCents)) {
    return Math.max(0, Math.round(overrideCents));
  }
  if (standardCents === null || !Number.isFinite(standardCents)) return null;
  const pct = Math.max(0, Math.min(100, discountPct));
  return Math.max(0, Math.round((standardCents * (100 - pct)) / 100));
}

/** Whole-percent savings of `priceCents` vs `standardCents` (0 when N/A). */
export function discountPercent(
  standardCents: number | null,
  priceCents: number | null,
): number {
  if (
    standardCents === null ||
    priceCents === null ||
    standardCents <= 0 ||
    priceCents >= standardCents
  ) {
    return 0;
  }
  return Math.round(((standardCents - priceCents) / standardCents) * 100);
}

const CENTS_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format integer cents as USD. `null` → "Contact us". */
export function formatCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) {
    return "Contact us";
  }
  return CENTS_FORMATTER.format(cents / 100);
}
