export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { emailSignups } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export default async function EmailSignupsPage() {
  const signups = await db
    .select()
    .from(emailSignups)
    .orderBy(desc(emailSignups.createdAt));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Email Subscribers</h1>
        <p className="text-navy/50 text-sm mt-1">
          {signups.length} total subscriber{signups.length !== 1 ? "s" : ""}
        </p>
      </div>

      {signups.length === 0 ? (
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/40 text-sm">No email subscribers yet.</p>
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
                  <td className="px-6 py-4 text-navy/40">
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
                          : "bg-beige-dark/50 text-navy/40"
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
