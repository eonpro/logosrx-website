import "server-only";

import { unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ADMIN_OVERVIEW_TAG } from "./cache-tags";
import {
  toOverviewStats,
  type AdminOverviewStats,
  type OverviewStatsRow,
} from "./overview-stats-shape";

export type { AdminOverviewStats } from "./overview-stats-shape";
export { toOverviewStats } from "./overview-stats-shape";

/**
 * Single round-trip for every overview tile. Previously this was 7 parallel
 * SELECTs, each competing for a pooled Aurora connection — under serverless
 * that burst was a frequent source of connect-timeout 500s on /admin.
 */
async function queryOverviewStats(): Promise<AdminOverviewStats> {
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM employment_applications) AS apps_total,
      (SELECT (count(*) FILTER (WHERE status = 'new'))::int
         FROM employment_applications) AS apps_new,
      (SELECT count(*)::int FROM clinic_signups) AS clinic_leads_total,
      (SELECT (count(*) FILTER (WHERE status = 'new'))::int
         FROM clinic_signups) AS clinic_leads_new,
      (SELECT (count(*) FILTER (WHERE onboarding_completed))::int
         FROM clinics) AS accounts_total,
      (SELECT (count(*) FILTER (
         WHERE onboarding_completed AND verification_status = 'pending'))::int
         FROM clinics) AS accounts_pending,
      (SELECT count(*)::int FROM email_signups) AS emails_total,
      (SELECT (count(*) FILTER (WHERE active))::int
         FROM promotions) AS promo_active,
      (SELECT (count(*) FILTER (WHERE active))::int
         FROM featured_products) AS featured_active,
      (SELECT count(*)::int FROM pricing_quotes) AS quotes_total,
      (SELECT (count(*) FILTER (
         WHERE status = 'active'
           AND (expires_at IS NULL OR expires_at > now())))::int
         FROM pricing_quotes) AS quotes_active,
      (SELECT (count(*) FILTER (WHERE status = 'pending'))::int
         FROM pricing_requests) AS pricing_requests_pending
  `);

  const row = (result.rows[0] ?? {}) as Partial<
    Record<keyof OverviewStatsRow, unknown>
  >;
  return toOverviewStats(row);
}

/**
 * Overview tiles are counts, so a 30s cache is plenty. Mutations that change
 * these numbers call `updateTag(ADMIN_OVERVIEW_TAG)` for immediate freshness.
 */
export const getAdminOverviewStats = unstable_cache(
  queryOverviewStats,
  ["admin-overview-stats"],
  { tags: [ADMIN_OVERVIEW_TAG], revalidate: 30 },
);
