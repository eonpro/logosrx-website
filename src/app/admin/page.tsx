export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { employmentApplications, clinicSignups, emailSignups } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";

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
  const [emailTotal] = await db
    .select({ count: count() })
    .from(emailSignups);

  return {
    applications: { total: appTotal.count, new: appNew.count },
    clinics: { total: clinicTotal.count, new: clinicNew.count },
    emails: { total: emailTotal.count },
  };
}

const cards = [
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
];

export default async function AdminOverview() {
  const stats = await getStats();

  const data = [
    { ...cards[0], total: stats.applications.total, badge: stats.applications.new },
    { ...cards[1], total: stats.clinics.total, badge: stats.clinics.new },
    { ...cards[2], total: stats.emails.total, badge: 0 },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-navy/50 text-sm mt-1">
          Overview of all submissions and sign-ups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.map((card) => (
          <a
            key={card.href}
            href={card.href}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-beige hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${card.color}`} />
            <p className="text-sm font-medium text-navy/50 mb-1">
              {card.label}
            </p>
            <p className="text-3xl font-bold text-navy">{card.total}</p>
            {card.badge > 0 && (
              <span className="mt-3 inline-flex items-center rounded-full bg-magenta/10 px-2.5 py-0.5 text-xs font-semibold text-magenta">
                {card.badge} new
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
