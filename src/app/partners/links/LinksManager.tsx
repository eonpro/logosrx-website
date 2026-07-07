"use client";

import { useState, useTransition } from "react";
import {
  Badge,
  EmptyState,
  btnAccent,
  btnGhost,
  tableWrapClass,
  theadClass,
  rowClass,
} from "@/components/ui/portal";
import { createReferralLink, setReferralLinkActive } from "./actions";

interface LinkRow {
  id: number;
  code: string;
  label: string | null;
  repId: number | null;
  repName: string | null;
  active: boolean;
  clickCount: number;
  signupCount: number;
  createdAt: string;
}

export default function LinksManager({
  links,
  reps,
  kind,
  siteUrl,
}: {
  links: LinkRow[];
  reps: { id: number; name: string }[];
  kind: "org" | "rep";
  siteUrl: string;
}) {
  const [label, setLabel] = useState("");
  const [repId, setRepId] = useState<string>("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function create() {
    setError("");
    startTransition(async () => {
      const res = await createReferralLink({
        label,
        repId: repId ? Number(repId) : null,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not create the link.");
        return;
      }
      setLabel("");
      setRepId("");
    });
  }

  function toggle(id: number, active: boolean) {
    startTransition(async () => {
      await setReferralLinkActive(id, active);
    });
  }

  async function copy(link: LinkRow) {
    try {
      await navigator.clipboard.writeText(`${siteUrl}/join/${link.code}`);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard can be unavailable (permissions); the URL is still visible.
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Create a new link
        </h2>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">
              Label (optional)
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Spring conference"
              maxLength={120}
              className="h-10 w-64 rounded-full border border-beige-dark bg-white px-4 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-navy focus:ring-2 focus:ring-navy/10"
            />
          </label>

          {kind === "org" && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-navy/60">
                Assign to rep (optional)
              </span>
              <select
                value={repId}
                onChange={(e) => setRepId(e.target.value)}
                className="h-10 w-56 rounded-full border border-beige-dark bg-white px-4 text-sm text-navy outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
              >
                <option value="">Organization-level</option>
                {reps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button type="submit" disabled={pending} className={btnAccent}>
            {pending ? "Creating…" : "Generate link"}
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      {links.length === 0 ? (
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="No referral links yet"
            body="Generate your first one above."
          />
        </div>
      ) : (
        <div className={`overflow-x-auto ${tableWrapClass}`}>
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Link</th>
                <th className="px-5 py-4 font-semibold">Label</th>
                {kind === "org" && (
                  <th className="px-5 py-4 font-semibold">Scope</th>
                )}
                <th className="px-5 py-4 font-semibold text-right">Clicks</th>
                <th className="px-5 py-4 font-semibold text-right">Sign-ups</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold" />
              </tr>
            </thead>
            <tbody className="text-navy">
              {links.map((link) => (
                <tr
                  key={link.id}
                  className={`${rowClass} ${link.active ? "" : "opacity-50"}`}
                >
                  <td className="px-5 py-4 font-mono text-xs">
                    {siteUrl.replace(/^https?:\/\//, "")}/join/{link.code}
                    <button
                      type="button"
                      onClick={() => void copy(link)}
                      className="ml-2 rounded-full border border-beige-dark bg-white px-2.5 py-0.5 text-[11px] font-sans font-semibold text-navy/70 transition-all hover:border-navy/40 hover:text-navy"
                    >
                      {copiedId === link.id ? "Copied!" : "Copy"}
                    </button>
                  </td>
                  <td className="px-5 py-4">{link.label || "—"}</td>
                  {kind === "org" && (
                    <td className="px-5 py-4">
                      {link.repName ?? "Organization"}
                    </td>
                  )}
                  <td className="px-5 py-4 text-right tabular-nums">
                    {link.clickCount}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {link.signupCount}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={link.active ? "success" : "neutral"}>
                      {link.active ? "Active" : "Off"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggle(link.id, !link.active)}
                      className={btnGhost}
                    >
                      {link.active ? "Deactivate" : "Reactivate"}
                    </button>
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
