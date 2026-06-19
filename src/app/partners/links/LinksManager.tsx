"use client";

import { useState, useTransition } from "react";
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
      <div className="rounded-2xl border border-beige bg-white p-6">
        <h2 className="text-sm font-semibold text-navy">Create a new link</h2>
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
              className="h-10 w-64 rounded-lg border border-beige bg-cream/50 px-3 text-sm text-navy outline-none focus:border-magenta"
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
                className="h-10 w-56 rounded-lg border border-beige bg-cream/50 px-3 text-sm text-navy outline-none focus:border-magenta"
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

          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-full bg-magenta px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
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
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/65 text-sm">
            No referral links yet. Generate your first one above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Link</th>
                <th className="px-5 py-3 font-semibold">Label</th>
                {kind === "org" && (
                  <th className="px-5 py-3 font-semibold">Scope</th>
                )}
                <th className="px-5 py-3 font-semibold text-right">Clicks</th>
                <th className="px-5 py-3 font-semibold text-right">Sign-ups</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {links.map((link) => (
                <tr key={link.id} className={link.active ? "" : "opacity-50"}>
                  <td className="px-5 py-3 font-mono text-xs">
                    {siteUrl.replace(/^https?:\/\//, "")}/join/{link.code}
                    <button
                      type="button"
                      onClick={() => void copy(link)}
                      className="ml-2 rounded-md border border-beige px-2 py-0.5 text-[11px] font-sans font-medium text-navy/70 hover:border-magenta hover:text-magenta"
                    >
                      {copiedId === link.id ? "Copied!" : "Copy"}
                    </button>
                  </td>
                  <td className="px-5 py-3">{link.label || "—"}</td>
                  {kind === "org" && (
                    <td className="px-5 py-3">
                      {link.repName ?? "Organization"}
                    </td>
                  )}
                  <td className="px-5 py-3 text-right tabular-nums">
                    {link.clickCount}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {link.signupCount}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        link.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {link.active ? "Active" : "Off"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggle(link.id, !link.active)}
                      className="text-xs font-medium text-navy/60 hover:text-magenta disabled:opacity-50"
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
