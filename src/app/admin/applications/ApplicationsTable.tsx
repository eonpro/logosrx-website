"use client";

import { useState } from "react";
import type { EmploymentApplication } from "@/lib/db/schema";
import { updateApplicationStatus } from "./actions";

const statusStyles: Record<string, string> = {
  new: "bg-magenta/10 text-magenta",
  reviewed: "bg-sky/10 text-sky",
  archived: "bg-beige-dark/50 text-navy/40",
};

export function ApplicationsTable({
  applications,
}: {
  applications: EmploymentApplication[];
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="rounded-2xl bg-white border border-beige overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-beige bg-cream/50">
            <th className="text-left px-6 py-3.5 font-semibold text-navy/60 text-xs uppercase tracking-wider">
              Name
            </th>
            <th className="text-left px-6 py-3.5 font-semibold text-navy/60 text-xs uppercase tracking-wider">
              Position
            </th>
            <th className="text-left px-6 py-3.5 font-semibold text-navy/60 text-xs uppercase tracking-wider">
              Date
            </th>
            <th className="text-left px-6 py-3.5 font-semibold text-navy/60 text-xs uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-beige">
          {applications.map((app) => (
            <>
              <tr
                key={app.id}
                className="hover:bg-cream/30 transition-colors cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === app.id ? null : app.id)
                }
              >
                <td className="px-6 py-4 font-medium text-navy">
                  {app.firstName} {app.lastName}
                </td>
                <td className="px-6 py-4 text-navy/60">{app.position}</td>
                <td className="px-6 py-4 text-navy/40">
                  {new Date(app.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[app.status]}`}
                  >
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`text-navy/30 transition-transform ${expandedId === app.id ? "rotate-180" : ""}`}
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
                <tr key={`${app.id}-detail`}>
                  <td colSpan={5} className="px-6 py-5 bg-cream/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-navy/40 text-xs uppercase tracking-wider mb-1">
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
                        <p className="text-navy/40 text-xs uppercase tracking-wider mb-1">
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
                        <p className="text-navy/40 text-xs uppercase tracking-wider mb-1">
                          Referral Source
                        </p>
                        <p className="text-navy">
                          {app.referralSource || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-navy/40 text-xs uppercase tracking-wider mb-1">
                          Willing to Relocate
                        </p>
                        <p className="text-navy capitalize">
                          {app.willingToRelocate || "—"}
                        </p>
                      </div>
                    </div>

                    {app.resumeUrl && (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light transition-colors mb-4"
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
                            }}
                            disabled={app.status === status}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                              app.status === status
                                ? "bg-navy/10 text-navy/30 cursor-not-allowed"
                                : "bg-white border border-beige hover:border-magenta hover:text-magenta text-navy/60"
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
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
