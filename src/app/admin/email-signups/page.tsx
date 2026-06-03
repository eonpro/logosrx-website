export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { emailSignups } from "@/lib/db/schema";
import { count, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { ADMIN_LIST_LIMIT } from "@/lib/constants";

export default async function EmailSignupsPage() {
  await requireAdmin();
  // Render the most recent N; header shows the true total via a separate COUNT.
  const [signups, [{ total }]] = await Promise.all([
    db
      .select()
      .from(emailSignups)
      .orderBy(desc(emailSignups.createdAt))
      .limit(ADMIN_LIST_LIMIT),
    db.select({ total: count() }).from(emailSignups),
  ]);
  const overflow = total > signups.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Email Subscribers</h1>
        <p className="text-navy/70 text-sm mt-1">
          {total} total subscriber{total !== 1 ? "s" : ""}
        </p>
        {overflow && (
          <p className="mt-1 text-xs text-navy/55">
            Showing the {signups.length} most recent of {total}.
          </p>
        )}
      </div>

      {signups.length === 0 ? (
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/65 text-sm">No email subscribers yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-beige overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-beige bg-cream/50">
                <th className="text-left px-6 py-3.5 font-semibold text-navy/60 text-xs uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3.5 font-semibold text-navy/60 text-xs uppercase tracking-wider">
                  Subscribed
                </th>
                <th className="text-left px-6 py-3.5 font-semibold text-navy/60 text-xs uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige">
              {signups.map((signup) => (
                <tr
                  key={signup.id}
                  className="hover:bg-cream/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-navy">
                    {signup.email}
                  </td>
                  <td className="px-6 py-4 text-navy/65">
                    {new Date(signup.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        signup.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-beige-dark/50 text-navy/65"
                      }`}
                    >
                      {signup.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
