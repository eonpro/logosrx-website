"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Badge,
  EmptyState,
  btnAccent,
  btnSecondary,
  inputClass,
  rowClass,
  tableWrapClass,
  theadClass,
  type BadgeTone,
} from "@/components/ui/portal";
import { reviewPricingRequest } from "@/app/admin/pricing-requests/actions";
import { VOLUME_BAND_LABELS, type VolumeBand } from "@/lib/pricing-requests/validate";
import type { PricingRequestListItem } from "@/lib/pricing-requests/data";

function statusBadge(
  status: PricingRequestListItem["status"],
): { text: string; tone: BadgeTone } {
  if (status === "pending") return { text: "Pending", tone: "warning" };
  if (status === "reviewed") return { text: "Reviewed", tone: "accent" };
  return { text: "Closed", tone: "neutral" };
}

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PricingRequestsManagerProps {
  requests: PricingRequestListItem[];
  canEdit: boolean;
  /** Map of catalog product id → display name. */
  productNames: Record<string, string>;
}

export default function PricingRequestsManager({
  requests,
  canEdit,
  productNames,
}: PricingRequestsManagerProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "closed">(
    "pending",
  );
  const [selectedId, setSelectedId] = useState<number | null>(
    () => requests.find((r) => r.status === "pending")?.id ?? requests[0]?.id ?? null,
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const selected = requests.find((r) => r.id === selectedId) ?? null;

  function act(status: "reviewed" | "closed") {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await reviewPricingRequest({
        id: selected.id,
        status,
        adminNote: note,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNote("");
    });
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        title="No pricing requests yet"
        body="When a clinic asks for volume pricing from the portal, it will show up here."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ["pending", "Pending"],
              ["reviewed", "Reviewed"],
              ["closed", "Closed"],
              ["all", "All"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filter === value
                  ? "bg-plum text-white"
                  : "border border-beige bg-white text-navy/55 hover:text-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={`No ${filter === "all" ? "" : filter + " "}requests`}
            body="Try another filter."
          />
        ) : (
          <div className={tableWrapClass}>
            <table className="w-full text-left text-sm">
              <thead className={theadClass}>
                <tr>
                  <th className="px-5 py-4 font-semibold">Clinic</th>
                  <th className="px-5 py-4 font-semibold">Volume</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const badge = statusBadge(r.status);
                  const active = r.id === selectedId;
                  return (
                    <tr
                      key={r.id}
                      className={`${rowClass} cursor-pointer ${
                        active ? "bg-navy/[0.04]" : ""
                      }`}
                      onClick={() => {
                        setSelectedId(r.id);
                        setNote(r.adminNote ?? "");
                        setError(null);
                      }}
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-navy">
                          {r.clinicName?.trim() || "—"}
                        </div>
                        <div className="text-xs text-navy/50">
                          {r.contactEmail || r.contactName || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-navy/70">
                        {VOLUME_BAND_LABELS[r.volumeBand as VolumeBand] ??
                          r.volumeBand}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={badge.tone}>{badge.text}</Badge>
                      </td>
                      <td className="px-5 py-4 text-navy/60">
                        {fmtDate(r.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <aside className="lg:col-span-2">
        {selected ? (
          <div className="rounded-3xl border border-beige/80 bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/40">
                  Request #{selected.id}
                </p>
                <h2 className="mt-1 text-xl font-bold text-navy">
                  {selected.clinicName?.trim() || "Clinic"}
                </h2>
              </div>
              <Badge tone={statusBadge(selected.status).tone}>
                {statusBadge(selected.status).text}
              </Badge>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-navy/40">
                  Contact
                </dt>
                <dd className="mt-0.5 text-navy">
                  {selected.contactName || "—"}
                  {selected.contactEmail && (
                    <span className="block text-navy/55">
                      {selected.contactEmail}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-navy/40">
                  Expected volume
                </dt>
                <dd className="mt-0.5 text-navy">
                  {VOLUME_BAND_LABELS[selected.volumeBand as VolumeBand] ??
                    selected.volumeBand}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-navy/40">
                  Products
                </dt>
                <dd className="mt-0.5 text-navy">
                  {selected.productIds.length === 0
                    ? "Catalog-wide"
                    : selected.productIds
                        .map((id) => productNames[id] ?? id)
                        .join(", ")}
                </dd>
              </div>
              {selected.message && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-navy/40">
                    Clinic notes
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-navy/80">
                    {selected.message}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-navy/40">
                  Submitted
                </dt>
                <dd className="mt-0.5 text-navy">{fmtDate(selected.createdAt)}</dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/admin/clinics/${selected.clinicId}`}
                className={btnSecondary}
              >
                Open clinic
              </Link>
              <Link href="/admin/quotes/new" className={btnSecondary}>
                New quote
              </Link>
            </div>

            {canEdit && (
              <div className="mt-6 border-t border-beige/70 pt-5">
                <label
                  htmlFor="admin-note"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy/40"
                >
                  Admin note
                </label>
                <textarea
                  id="admin-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-y`}
                  placeholder="Internal note (optional)…"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-700">{error}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.status === "pending" && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => act("reviewed")}
                      className={btnAccent}
                    >
                      Mark reviewed
                    </button>
                  )}
                  {selected.status !== "closed" && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => act("closed")}
                      className={btnSecondary}
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState title="Select a request" body="Pick a row to review details." />
        )}
      </aside>
    </div>
  );
}
