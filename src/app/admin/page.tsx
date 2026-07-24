export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { StatCard, Badge, type BadgeTone } from "@/components/ui/portal";

/** Server-rendered greeting pinned to pharmacy HQ time (Tampa). */
function greeting(): { hello: string; date: string } {
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    }).format(now),
  );
  const hello =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
  return { hello, date };
}

type OverviewStatsRow = {
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
};

function asCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Single round-trip for every overview tile. Previously this was 7 parallel
 * SELECTs, each competing for a pooled Aurora connection — under serverless
 * that burst was a frequent source of connect-timeout 500s on /admin.
 */
async function getStats() {
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM employment_applications) AS apps_total,
      (SELECT count(*)::int FILTER (WHERE status = 'new')
         FROM employment_applications) AS apps_new,
      (SELECT count(*)::int FROM clinic_signups) AS clinic_leads_total,
      (SELECT count(*)::int FILTER (WHERE status = 'new')
         FROM clinic_signups) AS clinic_leads_new,
      (SELECT count(*)::int FILTER (WHERE onboarding_completed)
         FROM clinics) AS accounts_total,
      (SELECT count(*)::int FILTER (
         WHERE onboarding_completed AND verification_status = 'pending')
         FROM clinics) AS accounts_pending,
      (SELECT count(*)::int FROM email_signups) AS emails_total,
      (SELECT count(*)::int FILTER (WHERE active) FROM promotions) AS promo_active,
      (SELECT count(*)::int FILTER (WHERE active)
         FROM featured_products) AS featured_active,
      (SELECT count(*)::int FROM pricing_quotes) AS quotes_total,
      (SELECT count(*)::int FILTER (
         WHERE status = 'active'
           AND (expires_at IS NULL OR expires_at > now()))
         FROM pricing_quotes) AS quotes_active
  `);

  const row = (result.rows[0] ?? {}) as Partial<OverviewStatsRow>;

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
  };
}

const cards = [
  { label: "Clinics", href: "/admin/clinics" },
  { label: "Employment Applications", href: "/admin/applications" },
  { label: "Clinic Sign-ups", href: "/admin/clinic-signups" },
  { label: "Email Subscribers", href: "/admin/email-signups" },
  { label: "Merchandising", href: "/admin/merchandising" },
  { label: "Pricing Quotes", href: "/admin/quotes" },
];

export default async function AdminOverview() {
  await requireAdmin();
  const stats = await getStats();

  const data: {
    label: string;
    href: string;
    total: number;
    badge: number;
    badgeLabel: string;
    badgeTone: BadgeTone;
    accent?: boolean;
  }[] = [
    {
      ...cards[0],
      total: stats.accounts.total,
      badge: stats.accounts.pending,
      badgeLabel: "pending",
      badgeTone: "warning",
      accent: true,
    },
    {
      ...cards[1],
      total: stats.applications.total,
      badge: stats.applications.new,
      badgeLabel: "new",
      badgeTone: "accent",
    },
    {
      ...cards[2],
      total: stats.clinics.total,
      badge: stats.clinics.new,
      badgeLabel: "new",
      badgeTone: "accent",
    },
    {
      ...cards[3],
      total: stats.emails.total,
      badge: 0,
      badgeLabel: "new",
      badgeTone: "accent",
    },
    {
      ...cards[4],
      total: stats.merchandising.total,
      badge: stats.merchandising.featured,
      badgeLabel: "featured",
      badgeTone: "warning",
    },
    {
      ...cards[5],
      total: stats.quotes.total,
      badge: stats.quotes.active,
      badgeLabel: "active",
      badgeTone: "danger",
    },
  ];

  const { hello, date } = greeting();

  const attention = [
    {
      label: "Clinics awaiting verification",
      count: stats.accounts.pending,
      href: "/admin/clinics",
    },
    {
      label: "New clinic sign-ups",
      count: stats.clinics.new,
      href: "/admin/clinic-signups",
    },
    {
      label: "New employment applications",
      count: stats.applications.new,
      href: "/admin/applications",
    },
    {
      label: "Active pricing quotes",
      count: stats.quotes.active,
      href: "/admin/quotes",
    },
  ].filter((a) => a.count > 0);

  return (
    <div>
      <header className="mb-9">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy/40">
          Admin · {date}
        </p>
        <h1 className="font-display text-4xl font-medium text-navy sm:text-[2.85rem] sm:leading-[1.05]">
          {hello}.
        </h1>
        <p className="mt-2 text-[15px] text-navy/55">
          Here&rsquo;s what&rsquo;s happening across the pharmacy today.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Work queue — the reason an admin opens this page */}
        <aside className="rounded-3xl bg-plum p-6 text-white shadow-soft-lg sm:p-7 lg:order-last">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
            Needs attention
          </p>
          {attention.length === 0 ? (
            <p className="mt-5 text-sm text-white/60">
              All clear — nothing is waiting on you right now.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {attention.map((a) => (
                <li key={a.href}>
                  <Link
                    href={a.href}
                    className="group flex items-center justify-between gap-3 py-3.5"
                  >
                    <span className="text-sm text-white/80 transition-colors group-hover:text-white">
                      {a.label}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 font-display text-sm font-semibold text-plum">
                        {a.count}
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
                      >
                        <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Stat tiles */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-2">
          {data.map((card) => (
            <StatCard
              key={card.href}
              href={card.href}
              label={card.label}
              value={card.total}
              sub={
                card.badge > 0 ? (
                  <Badge tone={card.badgeTone}>
                    {card.badge} {card.badgeLabel}
                  </Badge>
                ) : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
