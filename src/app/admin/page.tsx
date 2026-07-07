export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import {
  employmentApplications,
  clinicSignups,
  clinics,
  emailSignups,
  promotions,
  featuredProducts,
  pricingQuotes,
} from "@/lib/db/schema";
import Link from "next/link";
import { count, sql } from "drizzle-orm";
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

/**
 * One aggregate query per table (5 total), all issued in parallel. This
 * replaces 9 sequential round-trips: each table now returns its total and any
 * filtered sub-count in a single pass using conditional aggregation.
 */
async function getStats() {
  const [apps, clinicLeads, accounts, emails, merch, featured, quotes] =
    await Promise.all([
    db
      .select({
        total: count(),
        new: sql<number>`count(*) filter (where ${employmentApplications.status} = 'new')`.mapWith(
          Number,
        ),
      })
      .from(employmentApplications),
    db
      .select({
        total: count(),
        new: sql<number>`count(*) filter (where ${clinicSignups.status} = 'new')`.mapWith(
          Number,
        ),
      })
      .from(clinicSignups),
    db
      .select({
        total: sql<number>`count(*) filter (where ${clinics.onboardingCompleted})`.mapWith(
          Number,
        ),
        pending: sql<number>`count(*) filter (where ${clinics.onboardingCompleted} and ${clinics.verificationStatus} = 'pending')`.mapWith(
          Number,
        ),
      })
      .from(clinics),
    db.select({ total: count() }).from(emailSignups),
    db
      .select({
        promoActive: sql<number>`count(*) filter (where ${promotions.active})`.mapWith(
          Number,
        ),
      })
      .from(promotions),
    db
      .select({
        featuredActive: sql<number>`count(*) filter (where ${featuredProducts.active})`.mapWith(
          Number,
        ),
      })
      .from(featuredProducts),
    db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where ${pricingQuotes.status} = 'active' and (${pricingQuotes.expiresAt} is null or ${pricingQuotes.expiresAt} > now()))`.mapWith(
          Number,
        ),
      })
      .from(pricingQuotes),
  ]);

  return {
    applications: { total: apps[0].total, new: apps[0].new },
    accounts: { total: accounts[0].total, pending: accounts[0].pending },
    clinics: { total: clinicLeads[0].total, new: clinicLeads[0].new },
    emails: { total: emails[0].total },
    merchandising: {
      total: merch[0].promoActive,
      featured: featured[0].featuredActive,
    },
    quotes: { total: quotes[0].total, active: quotes[0].active },
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
