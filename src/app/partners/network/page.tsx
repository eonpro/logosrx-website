export const dynamic = "force-dynamic";

import Link from "next/link";
import { getPartnerContext } from "@/lib/auth/partner";
import { formatBps } from "@/lib/partners/commission";
import {
  listNetworkClinics,
  listOrgReps,
} from "@/lib/partners/queries";
import PartnerNoAccess from "../PartnerNoAccess";

const STATUS_BADGE: Record<string, string> = {
  verified: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function PartnerNetworkPage() {
  const ctx = await getPartnerContext();
  if (!ctx) return <PartnerNoAccess />;

  const [clinicList, reps] = await Promise.all([
    listNetworkClinics(ctx),
    ctx.kind === "org" ? listOrgReps(ctx.org.id) : Promise.resolve([]),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Network</h1>
        <p className="text-navy/70 text-sm mt-1">
          {clinicList.length} clinic{clinicList.length === 1 ? "" : "s"}
          {ctx.kind === "org" && (
            <>
              {" "}
              and {reps.length} rep{reps.length === 1 ? "" : "s"}
            </>
          )}{" "}
          linked to {ctx.kind === "rep" ? "you" : "your organization"}.
        </p>
      </div>

      {ctx.kind === "org" && reps.length > 0 && (
        <div className="mb-8 overflow-x-auto rounded-2xl border border-beige bg-white">
          <div className="flex items-center justify-between border-b border-beige px-5 py-4">
            <h2 className="text-sm font-semibold text-navy">Your reps</h2>
            <Link
              href="/partners/reps"
              className="text-xs font-medium text-magenta hover:underline"
            >
              Manage reps →
            </Link>
          </div>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Rep</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Rate</th>
                <th className="px-5 py-3 font-semibold text-right">Clinics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {reps.map((rep) => (
                <tr key={rep.id}>
                  <td className="px-5 py-3">
                    <span className="font-medium">{rep.name}</span>
                    <span className="block text-xs text-navy/55">
                      {rep.email}
                    </span>
                  </td>
                  <td className="px-5 py-3 capitalize">{rep.status}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatBps(rep.commissionRateBps)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {rep.clinicCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {clinicList.length === 0 ? (
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/65 text-sm">
            No clinics linked yet. Share your{" "}
            <Link href="/partners/links" className="text-magenta hover:underline">
              referral links
            </Link>{" "}
            with providers to grow your network.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige bg-white">
          <div className="border-b border-beige px-5 py-4">
            <h2 className="text-sm font-semibold text-navy">Linked clinics</h2>
          </div>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Clinic</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                {ctx.kind === "org" && (
                  <th className="px-5 py-3 font-semibold">Referred by</th>
                )}
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {clinicList.map((clinic) => (
                <tr key={clinic.id}>
                  <td className="px-5 py-3 font-medium">
                    {clinic.clinicName ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    {clinic.contactName ?? "—"}
                    {clinic.contactEmail && (
                      <span className="block text-xs text-navy/55">
                        {clinic.contactEmail}
                      </span>
                    )}
                  </td>
                  {ctx.kind === "org" && (
                    <td className="px-5 py-3">
                      {clinic.repName ?? "Organization"}
                    </td>
                  )}
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[clinic.verificationStatus] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {clinic.verificationStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {clinic.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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
