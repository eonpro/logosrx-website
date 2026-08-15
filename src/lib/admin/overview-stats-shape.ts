export type AdminOverviewStats = {
  applications: { total: number; new: number };
  accounts: { total: number; pending: number };
  clinics: { total: number; new: number };
  emails: { total: number };
  merchandising: { total: number; featured: number };
  quotes: { total: number; active: number };
  pricingRequests: { pending: number };
};

export type OverviewStatsRow = {
  apps_total: number;
  apps_new: number;
  clinic_leads_total: number;
  clinic_leads_new: number;
  accounts_total: number;
  accounts_pending: number;
  emails_total: number;
  promo_active: number;
  featured_active: number;
  quotes_total: number;
  quotes_active: number;
  pricing_requests_pending: number;
};

function asCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Maps a raw overview SQL row into the tile shape. Pure for unit tests. */
export function toOverviewStats(
  row: Partial<Record<keyof OverviewStatsRow, unknown>>,
): AdminOverviewStats {
  return {
    applications: {
      total: asCount(row.apps_total),
      new: asCount(row.apps_new),
    },
    accounts: {
      total: asCount(row.accounts_total),
      pending: asCount(row.accounts_pending),
    },
    clinics: {
      total: asCount(row.clinic_leads_total),
      new: asCount(row.clinic_leads_new),
    },
    emails: { total: asCount(row.emails_total) },
    merchandising: {
      total: asCount(row.promo_active),
      featured: asCount(row.featured_active),
    },
    quotes: {
      total: asCount(row.quotes_total),
      active: asCount(row.quotes_active),
    },
    pricingRequests: {
      pending: asCount(row.pricing_requests_pending),
    },
  };
}
