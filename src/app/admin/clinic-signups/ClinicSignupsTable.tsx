"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClinicSignup } from "@/lib/db/schema";
import { updateClinicStatus } from "./actions";
import {
  Badge,
  InitialsAvatar,
  rowClass,
  tableWrapClass,
  theadClass,
  type BadgeTone,
} from "@/components/ui/portal";

const statusTones: Record<string, BadgeTone> = {
  new: "accent",
  contacted: "neutral",
  onboarded: "success",
  archived: "neutral",
};

export function ClinicSignupsTable({
  signups,
}: {
  signups: ClinicSignup[];
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className={tableWrapClass}>
      <table className="w-full text-sm">
        <thead className={theadClass}>
          <tr>
            <th className="px-5 py-4 font-semibold">Clinic</th>
            <th className="px-5 py-4 font-semibold">Contact</th>
            <th className="px-5 py-4 font-semibold">State</th>
            <th className="px-5 py-4 font-semibold">Date</th>
            <th className="px-5 py-4 font-semibold">Status</th>
            <th className="px-5 py-4" />
          </tr>
        </thead>
        <tbody>
          {signups.map((signup) => (
            <Fragment key={signup.id}>
              <tr
                className={`${rowClass} cursor-pointer`}
                onClick={() =>
                  setExpandedId(expandedId === signup.id ? null : signup.id)
                }
              >
                <td className="px-5 py-4 font-medium text-navy">
                  <span className="flex items-center gap-3">
                    <InitialsAvatar name={signup.clinicName} />
                    {signup.clinicName}
                  </span>
                </td>
                <td className="px-5 py-4 text-navy/60">{signup.contactName}</td>
                <td className="px-5 py-4 text-navy/60">{signup.state || "—"}</td>
                <td className="px-5 py-4 text-navy/65">
                  {new Date(signup.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-4">
                  <Badge tone={statusTones[signup.status] ?? "neutral"}>
                    {signup.status}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-right">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`text-navy/65 transition-transform ${expandedId === signup.id ? "rotate-180" : ""}`}
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </td>
              </tr>
              {expandedId === signup.id && (
                <tr className="border-b border-beige/60 last:border-0">
                  <td colSpan={6} className="bg-cream/50 px-5 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                          Email
                        </p>
                        <a
                          href={`mailto:${signup.email}`}
                          className="text-navy hover:text-magenta transition-colors"
                        >
                          {signup.email}
                        </a>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                          Phone
                        </p>
                        <a
                          href={`tel:${signup.phone}`}
                          className="text-navy hover:text-magenta transition-colors"
                        >
                          {signup.phone}
                        </a>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                          NPI Number
                        </p>
                        <p className="text-navy">{signup.npiNumber || "—"}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                          Specialty
                        </p>
                        <p className="text-navy">{signup.specialty || "—"}</p>
                      </div>
                    </div>

                    {signup.message && (
                      <div className="mb-4">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                          Message
                        </p>
                        <p className="rounded-2xl border border-beige/70 bg-white p-4 text-sm leading-relaxed text-navy">
                          {signup.message}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      {(
                        ["new", "contacted", "onboarded", "archived"] as const
                      ).map((status) => (
                        <button
                          key={status}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await updateClinicStatus(signup.id, status);
                            // Pull the revalidated status into this client
                            // view — otherwise the badge never updates.
                            router.refresh();
                          }}
                          disabled={signup.status === status}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                            signup.status === status
                              ? "bg-navy/10 text-navy/65 cursor-not-allowed"
                              : "border border-beige-dark bg-white text-navy/60 hover:border-navy/40 hover:text-navy"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
