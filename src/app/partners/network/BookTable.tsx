"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatCents } from "@/lib/partners/commission";
import { EmptyState, InitialsAvatar, tableWrapClass, theadClass, rowClass } from "@/components/ui/portal";
import { StageBadge, StatusBadge } from "../Kpi";

export interface BookTableRow {
  id: number;
  clinicName: string | null;
  contactName: string | null;
  repName: string | null;
  stage: string;
  verificationStatus: string;
  revenueCents: number;
  commissionCents: number;
  lastActivityLabel: string | null;
}

const STAGE_OPTIONS = [
  { id: "all", label: "All stages" },
  { id: "lead", label: "Lead" },
  { id: "active", label: "Active" },
  { id: "at_risk", label: "At risk" },
  { id: "dormant", label: "Dormant" },
];

const inputClass =
  "h-10 rounded-full border border-beige-dark bg-white px-4 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-navy focus:ring-2 focus:ring-navy/10";

export default function BookTable({
  rows,
  kind,
}: {
  rows: BookTableRow[];
  kind: "org" | "rep";
}) {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [rep, setRep] = useState("all");

  const repNames = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.repName).filter((n): n is string => !!n)),
      ).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (stage !== "all" && r.stage !== stage) return false;
      if (kind === "org" && rep !== "all") {
        const name = r.repName ?? "Organization";
        if (name !== rep) return false;
      }
      if (needle) {
        const hay = `${r.clinicName ?? ""} ${r.contactName ?? ""} ${r.repName ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, q, stage, rep, kind]);

  return (
    <div className={tableWrapClass}>
      <div className="flex flex-wrap items-center gap-2 border-b border-beige px-5 py-4">
        <h2 className="mr-auto text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Companies ({filtered.length})
        </h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company, contact, rep…"
          aria-label="Search companies"
          className={`${inputClass} w-56`}
        />
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          aria-label="Filter by stage"
          className={inputClass}
        >
          {STAGE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {kind === "org" && repNames.length > 0 && (
          <select
            value={rep}
            onChange={(e) => setRep(e.target.value)}
            aria-label="Filter by rep"
            className={inputClass}
          >
            <option value="all">All reps</option>
            <option value="Organization">Organization (direct)</option>
            {repNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState
            title="No companies match your filters"
            body="Try clearing the search or choosing a different stage."
          />
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Company</th>
                {kind === "org" && (
                  <th className="px-5 py-4 font-semibold">Rep</th>
                )}
                <th className="px-5 py-4 font-semibold">Stage</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold text-right">Revenue</th>
                <th className="px-5 py-4 font-semibold text-right">Commission</th>
                <th className="px-5 py-4 font-semibold">Last activity</th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {filtered.map((c) => (
                <tr key={c.id} className={rowClass}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={c.clinicName ?? `Clinic ${c.id}`} />
                      <div>
                        <Link
                          href={`/partners/clinics/${c.id}`}
                          className="font-medium text-navy hover:text-magenta"
                        >
                          {c.clinicName ?? `Clinic #${c.id}`}
                        </Link>
                        {c.contactName && (
                          <span className="block text-xs text-navy/55">
                            {c.contactName}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  {kind === "org" && (
                    <td className="px-5 py-4">{c.repName ?? "Organization"}</td>
                  )}
                  <td className="px-5 py-4">
                    <StageBadge stage={c.stage} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={c.verificationStatus} />
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatCents(c.revenueCents)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums font-semibold">
                    {formatCents(c.commissionCents)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-navy/70">
                    {c.lastActivityLabel ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
