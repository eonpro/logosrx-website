"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createCardUpdateLink,
  revokeCardUpdateLink,
} from "../clinics/actions";
import {
  Badge,
  Card,
  EmptyState,
  btnAccent,
  btnSecondary,
  inputClass,
  rowClass,
  selectClass,
  tableWrapClass,
  theadClass,
  type BadgeTone,
} from "@/components/ui/portal";

export interface CardLinkRow {
  id: number;
  clinicId: number;
  clinicName: string;
  contactEmail: string | null;
  status: "active" | "used" | "revoked" | "expired";
  /** Public URL — only set while the link is still openable. */
  url: string | null;
  /** Last 4 of the submitted card (used rows only). */
  cardLast4: string | null;
  createdAt: string;
  createdByEmail: string | null;
  expiresAt: string | null;
  viewedAt: string | null;
  usedAt: string | null;
}

const STATUS_BADGE: Record<
  CardLinkRow["status"],
  { text: string; tone: BadgeTone }
> = {
  active: { text: "Active", tone: "accent" },
  used: { text: "Submitted", tone: "success" },
  expired: { text: "Expired", tone: "warning" },
  revoked: { text: "Revoked", tone: "neutral" },
};

function fmtDate(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
}

export default function CardLinksManager({
  rows,
  clinicOptions,
  canEdit,
}: {
  rows: CardLinkRow[];
  clinicOptions: { id: number; name: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [clinicId, setClinicId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Freshly minted link, shown prominently until the admin dismisses it.
  const [fresh, setFresh] = useState<{ clinicName: string; url: string } | null>(
    null,
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const clinicNameById = useMemo(
    () => new Map(clinicOptions.map((c) => [String(c.id), c.name])),
    [clinicOptions],
  );

  async function generate() {
    const id = Number(clinicId);
    if (!id) {
      setError("Pick a clinic first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await createCardUpdateLink(id);
      if (res.ok && res.url) {
        setFresh({
          clinicName: clinicNameById.get(clinicId) ?? "Clinic",
          url: res.url,
        });
        router.refresh();
      } else {
        setError(res.error ?? "Could not create the link.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(row: CardLinkRow) {
    setBusy(true);
    setError("");
    try {
      await revokeCardUpdateLink(row.clinicId);
      if (fresh?.url === row.url) setFresh(null);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(key: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setError("Could not copy — select and copy the link manually.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {canEdit && (
        <Card>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Generate a link
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              className={`${selectClass} sm:max-w-sm ${
                clinicId ? "text-navy" : "text-navy/40"
              }`}
            >
              <option value="" disabled>
                Choose a clinic…
              </option>
              {clinicOptions.map((c) => (
                <option key={c.id} value={c.id} className="text-navy">
                  {c.name}
                </option>
              ))}
            </select>
            <button
              disabled={busy || !clinicId}
              onClick={generate}
              className={btnAccent}
            >
              {busy ? "Generating…" : "Generate link"}
            </button>
          </div>
          <p className="mt-2 text-xs text-navy/50">
            Single-use, valid 7 days. Generating a new link for a clinic
            revokes their previous one.
          </p>

          {fresh && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-2 text-xs font-semibold text-emerald-800">
                Link ready for {fresh.clinicName} — copy and send it:
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={fresh.url}
                  onFocus={(e) => e.currentTarget.select()}
                  className={`${inputClass} flex-1 font-mono text-xs`}
                />
                <button
                  onClick={() => copy("fresh", fresh.url)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98] ${
                    copiedKey === "fresh"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-plum hover:bg-plum-deep"
                  }`}
                >
                  {copiedKey === "fresh" ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>
          )}
          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </Card>
      )}

      {rows.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            title="No card update links yet"
            body="Generate one above to send a clinic a secure link for entering a new payment card."
          />
        </Card>
      ) : (
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Clinic</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Created</th>
                <th className="px-5 py-4 font-semibold">Expires</th>
                <th className="px-5 py-4 font-semibold">Opened</th>
                <th className="px-5 py-4 font-semibold">Submitted</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const badge = STATUS_BADGE[row.status];
                const key = String(row.id);
                return (
                  <tr key={row.id} className={rowClass}>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/clinics/${row.clinicId}`}
                        className="block"
                      >
                        <div className="font-medium text-navy">
                          {row.clinicName}
                        </div>
                        {row.contactEmail && (
                          <div className="text-xs text-navy/50">
                            {row.contactEmail}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={badge.tone}>{badge.text}</Badge>
                      {row.cardLast4 && (
                        <div className="mt-1 text-xs text-navy/55">
                          New card •••• {row.cardLast4}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-navy/60">
                      <div>{fmtDate(row.createdAt)}</div>
                      {row.createdByEmail && (
                        <div className="text-xs text-navy/45">
                          {row.createdByEmail}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-navy/60">
                      {fmtDate(row.expiresAt)}
                    </td>
                    <td className="px-5 py-4 text-navy/60">
                      {fmtDate(row.viewedAt)}
                    </td>
                    <td className="px-5 py-4 text-navy/60">
                      {fmtDate(row.usedAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      {row.status === "used" && (
                        <Link
                          href={`/admin/clinics/${row.clinicId}`}
                          className={`${btnSecondary} !px-4 !py-1.5 !text-xs`}
                        >
                          View card
                        </Link>
                      )}
                      {row.status === "active" && row.url && canEdit && (
                        <span className="inline-flex items-center gap-2">
                          <button
                            onClick={() => copy(key, row.url!)}
                            className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-all active:scale-[0.98] ${
                              copiedKey === key
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-plum hover:bg-plum-deep"
                            }`}
                          >
                            {copiedKey === key ? "Copied ✓" : "Copy link"}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => revoke(row)}
                            className="text-xs font-medium text-navy/40 transition-colors hover:text-red-600 disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
