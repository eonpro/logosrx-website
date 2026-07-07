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
import { count, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader, StatCard, Badge, type BadgeTone } from "@/components/ui/portal";

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

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Dashboard"
        description="Overview of all submissions and sign-ups."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {data.map((card) => (
          <StatCard
            key={card.href}
            href={card.href}
            accent={card.accent}
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
  );
}
