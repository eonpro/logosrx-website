export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { emailSignups } from "@/lib/db/schema";
import { count, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { ADMIN_LIST_LIMIT } from "@/lib/constants";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  rowClass,
  tableWrapClass,
  theadClass,
} from "@/components/ui/portal";

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
      <PageHeader
        eyebrow="Admin"
        title="Email Subscribers"
        description={
          <>
            {total} total subscriber{total !== 1 ? "s" : ""}
            {overflow && (
              <span className="block text-xs text-navy/45">
                Showing the {signups.length} most recent of {total}.
              </span>
            )}
          </>
        }
      />

      {signups.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            title="No email subscribers yet"
            body="Newsletter sign-ups from the marketing site will show up here."
          />
        </Card>
      ) : (
        <div className={tableWrapClass}>
          <table className="w-full text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Email</th>
                <th className="px-5 py-4 font-semibold">Subscribed</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((signup) => (
                <tr key={signup.id} className={rowClass}>
                  <td className="px-5 py-4 font-medium text-navy">
                    {signup.email}
                  </td>
                  <td className="px-5 py-4 text-navy/65">
                    {new Date(signup.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      tone={signup.status === "active" ? "success" : "neutral"}
                    >
                      {signup.status}
                    </Badge>
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
