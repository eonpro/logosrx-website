export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import {
  employmentApplications,
  clinicSignups,
  clinics,
  emailSignups,
  promotions,
  featuredProducts,
} from "@/lib/db/schema";
import { and, count, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";

async function getStats() {
  const [appTotal] = await db
    .select({ count: count() })
    .from(employmentApplications);
  const [appNew] = await db
    .select({ count: count() })
    .from(employmentApplications)
    .where(eq(employmentApplications.status, "new"));
  const [clinicTotal] = await db
    .select({ count: count() })
    .from(clinicSignups);
  const [clinicNew] = await db
    .select({ count: count() })
    .from(clinicSignups)
    .where(eq(clinicSignups.status, "new"));
  const [accountTotal] = await db
    .select({ count: count() })
    .from(clinics)
    .where(eq(clinics.onboardingCompleted, true));
  const [accountPending] = await db
    .select({ count: count() })
    .from(clinics)
    .where(
      and(
        eq(clinics.onboardingCompleted, true),
        eq(clinics.verificationStatus, "pending"),
      ),
    );
  const [emailTotal] = await db
    .select({ count: count() })
    .from(emailSignups);
  const [promoActive] = await db
    .select({ count: count() })
    .from(promotions)
    .where(eq(promotions.active, true));
  const [featuredActive] = await db
    .select({ count: count() })
    .from(featuredProducts)
    .where(eq(featuredProducts.active, true));

  return {
    applications: { total: appTotal.count, new: appNew.count },
    accounts: { total: accountTotal.count, pending: accountPending.count },
    clinics: { total: clinicTotal.count, new: clinicNew.count },
    emails: { total: emailTotal.count },
    merchandising: {
      total: promoActive.count,
      featured: featuredActive.count,
    },
  };
}

const cards = [
  {
    label: "Clinics",
    href: "/admin/clinics",
    color: "bg-green-500",
  },
  {
    label: "Employment Applications",
    href: "/admin/applications",
    color: "bg-magenta",
  },
  {
    label: "Clinic Sign-ups",
    href: "/admin/clinic-signups",
    color: "bg-purple",
  },
  {
    label: "Email Subscribers",
    href: "/admin/email-signups",
    color: "bg-sky",
  },
  {
    label: "Merchandising",
    href: "/admin/merchandising",
    color: "bg-amber-500",
  },
];

export default async function AdminOverview() {
  await requireAdmin();
  const stats = await getStats();

  const data = [
    {
      ...cards[0],
      total: stats.accounts.total,
      badge: stats.accounts.pending,
      badgeLabel: "pending",
      badgeClass: "bg-amber-100 text-amber-700",
    },
    {
      ...cards[1],
      total: stats.applications.total,
      badge: stats.applications.new,
      badgeLabel: "new",
      badgeClass: "bg-magenta/10 text-magenta",
    },
    {
      ...cards[2],
      total: stats.clinics.total,
      badge: stats.clinics.new,
      badgeLabel: "new",
      badgeClass: "bg-magenta/10 text-magenta",
    },
    {
      ...cards[3],
      total: stats.emails.total,
      badge: 0,
      badgeLabel: "new",
      badgeClass: "bg-magenta/10 text-magenta",
    },
    {
      ...cards[4],
      total: stats.merchandising.total,
      badge: stats.merchandising.featured,
      badgeLabel: "featured",
      badgeClass: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-navy/70 text-sm mt-1">
          Overview of all submissions and sign-ups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.map((card) => (
          <a
            key={card.href}
            href={card.href}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-beige hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${card.color}`} />
            <p className="text-sm font-medium text-navy/70 mb-1">
              {card.label}
            </p>
            <p className="text-3xl font-bold text-navy">{card.total}</p>
            {card.badge > 0 && (
              <span
                className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${card.badgeClass}`}
              >
                {card.badge} {card.badgeLabel}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
