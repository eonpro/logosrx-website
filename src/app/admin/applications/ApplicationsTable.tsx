"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmploymentApplication } from "@/lib/db/schema";
import { updateApplicationStatus } from "./actions";
import {
  Badge,
  InitialsAvatar,
  btnPrimary,
  rowClass,
  tableWrapClass,
  theadClass,
  type BadgeTone,
} from "@/components/ui/portal";

const statusTones: Record<string, BadgeTone> = {
  new: "accent",
  reviewed: "neutral",
  archived: "neutral",
};

export function ApplicationsTable({
  applications,
}: {
  applications: EmploymentApplication[];
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className={tableWrapClass}>
      <table className="w-full text-sm">
        <thead className={theadClass}>
          <tr>
            <th className="px-5 py-4 font-semibold">Name</th>
            <th className="px-5 py-4 font-semibold">Position</th>
            <th className="px-5 py-4 font-semibold">Date</th>
            <th className="px-5 py-4 font-semibold">Status</th>
            <th className="px-5 py-4" />
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <Fragment key={app.id}>
              <tr
                className={`${rowClass} cursor-pointer`}
                onClick={() =>
                  setExpandedId(expandedId === app.id ? null : app.id)
                }
              >
                <td className="px-5 py-4 font-medium text-navy">
                  <span className="flex items-center gap-3">
                    <InitialsAvatar name={`${app.firstName} ${app.lastName}`} />
                    {app.firstName} {app.lastName}
                  </span>
                </td>
                <td className="px-5 py-4 text-navy/60">{app.position}</td>
                <td className="px-5 py-4 text-navy/65">
                  {new Date(app.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-4">
                  <Badge tone={statusTones[app.status] ?? "neutral"}>
                    {app.status}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-right">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`text-navy/65 transition-transform ${expandedId === app.id ? "rotate-180" : ""}`}
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
              {expandedId === app.id && (
                <tr className="border-b border-beige/60 last:border-0">
                  <td colSpan={5} className="bg-cream/50 px-5 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                          Email
                        </p>
                        <a
                          href={`mailto:${app.email}`}
                          className="text-navy hover:text-magenta transition-colors"
                        >
                          {app.email}
                        </a>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                          Phone
                        </p>
                        <a
                          href={`tel:${app.phone}`}
                          className="text-navy hover:text-magenta transition-colors"
                        >
                          {app.phone}
                        </a>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                          Referral Source
                        </p>
                        <p className="text-navy">
                          {app.referralSource || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                          Willing to Relocate
                        </p>
                        <p className="text-navy capitalize">
                          {app.willingToRelocate || "—"}
                        </p>
                      </div>
                    </div>

                    {(app.resumePathname || app.resumeUrl) && (
                      <a
                        href={
                          app.resumePathname
                            ? `/api/admin/resumes/${app.id}`
                            : app.resumeUrl!
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${btnPrimary} mb-4`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M7 2v7M4 7l3 3 3-3M2 11h10"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {app.resumeFilename || "Download Resume"}
                      </a>
                    )}

                    <div className="flex gap-2 mt-2">
                      {(["new", "reviewed", "archived"] as const).map(
                        (status) => (
                          <button
                            key={status}
                            onClick={async (e) => {
                              e.stopPropagation();
                              await updateApplicationStatus(app.id, status);
                              // Pull the revalidated status into this client
                              // view — otherwise the badge never updates.
                              router.refresh();
                            }}
                            disabled={app.status === status}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                              app.status === status
                                ? "bg-navy/10 text-navy/65 cursor-not-allowed"
                                : "border border-beige-dark bg-white text-navy/60 hover:border-navy/40 hover:text-navy"
                            }`}
                          >
                            {status}
                          </button>
                        ),
                      )}
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
