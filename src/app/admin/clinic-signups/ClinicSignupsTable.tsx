"use client";

import { useState } from "react";
import type { ClinicSignup } from "@/lib/db/schema";
import { updateClinicStatus } from "./actions";

const statusStyles: Record<string, string> = {
  new: "bg-magenta/10 text-magenta",
  contacted: "bg-sky/10 text-sky",
  onboarded: "bg-green-100 text-green-700",
  archived: "bg-beige-dark/50 text-navy/40",
};

export function ClinicSignupsTable({
  signups,
}: {
  signups: ClinicSignup[];
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="rounded-2xl bg-white border border-beige overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-beige bg-cream/50">
            <th className="text-left px-6 py-3.5 font-semibold text-navy/60 text-xs uppercase tracking-wider">
              Clinic
            </th>
            <th className="text-left px-6 py-3.5 font-semibold text-navy/60 text-xs uppercase tracking-wider">
              Contact
            </th>
            <th className="text-left px-6 py-3.5 font-semibold text-navy/60 text-xs uppercase tracking-wider">
              State
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
          {signups.map((signup) => (
            <>
              <tr
                key={signup.id}
                className="hover:bg-cream/30 transition-colors cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === signup.id ? null : signup.id)
                }
              >
                <td className="px-6 py-4 font-medium text-navy">
                  {signup.clinicName}
                </td>
                <td className="px-6 py-4 text-navy/60">{signup.contactName}</td>
                <td className="px-6 py-4 text-navy/60">{signup.state || "—"}</td>
                <td className="px-6 py-4 text-navy/40">
                  {new Date(signup.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[signup.status]}`}
                  >
                    {signup.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`text-navy/30 transition-transform ${expandedId === signup.id ? "rotate-180" : ""}`}
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
                <tr key={`${signup.id}-detail`}>
                  <td colSpan={6} className="px-6 py-5 bg-cream/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-navy/40 text-xs uppercase tracking-wider mb-1">
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
                        <p className="text-navy/40 text-xs uppercase tracking-wider mb-1">
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
                        <p className="text-navy/40 text-xs uppercase tracking-wider mb-1">
                          NPI Number
                        </p>
                        <p className="text-navy">{signup.npiNumber || "—"}</p>
                      </div>
                      <div>
                        <p className="text-navy/40 text-xs uppercase tracking-wider mb-1">
                          Specialty
                        </p>
                        <p className="text-navy">{signup.specialty || "—"}</p>
                      </div>
                    </div>

                    {signup.message && (
                      <div className="mb-4">
                        <p className="text-navy/40 text-xs uppercase tracking-wider mb-1">
                          Message
                        </p>
                        <p className="text-navy text-sm leading-relaxed bg-white rounded-lg p-3 border border-beige">
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
                          }}
                          disabled={signup.status === status}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                            signup.status === status
                              ? "bg-navy/10 text-navy/30 cursor-not-allowed"
                              : "bg-white border border-beige hover:border-magenta hover:text-magenta text-navy/60"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
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
