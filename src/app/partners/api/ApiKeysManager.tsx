"use client";

import { useState, useTransition } from "react";
import { Badge, btnAccent, btnDanger } from "@/components/ui/portal";
import { createApiKey, revokeApiKey } from "./actions";

interface KeyRow {
  id: number;
  name: string;
  keyPrefix: string;
  lastUsed: string | null;
  revoked: boolean;
}

export default function ApiKeysManager({ keys }: { keys: KeyRow[] }) {
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function create() {
    setError("");
    setNewKey(null);
    startTransition(async () => {
      const res = await createApiKey(name);
      if (!res.ok || !res.key) {
        setError(res.error ?? "Could not create the key.");
        return;
      }
      setNewKey(res.key);
      setName("");
    });
  }

  function revoke(id: number) {
    setError("");
    startTransition(async () => {
      const res = await revokeApiKey(id);
      if (!res.ok) setError(res.error ?? "Could not revoke the key.");
    });
  }

  async function copyKey() {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        API keys
      </h2>

      {newKey && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold text-emerald-800">
            Copy your new key now — it won&rsquo;t be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-xs text-navy">
              {newKey}
            </code>
            <button
              type="button"
              onClick={() => void copyKey()}
              className="rounded-full border border-beige-dark bg-white px-4 py-2 text-xs font-semibold text-navy/70 transition-all hover:border-navy/40 hover:text-navy active:scale-[0.98]"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-navy/60">Key name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Production integration"
            maxLength={120}
            className="h-10 w-64 rounded-full border border-beige-dark bg-white px-4 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-navy focus:ring-2 focus:ring-navy/10"
          />
        </label>
        <button type="submit" disabled={pending} className={btnAccent}>
          {pending ? "Working…" : "Create key"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {keys.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/45">
              <tr>
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Key</th>
                <th className="py-2 pr-4 font-semibold">Last used</th>
                <th className="py-2 pr-4 font-semibold">Status</th>
                <th className="py-2 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/60 text-navy">
              {keys.map((k) => (
                <tr key={k.id} className={k.revoked ? "opacity-50" : ""}>
                  <td className="py-3 pr-4">{k.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{k.keyPrefix}…</td>
                  <td className="py-3 pr-4">{k.lastUsed ?? "Never"}</td>
                  <td className="py-3 pr-4">
                    {k.revoked ? (
                      <Badge tone="neutral">Revoked</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {!k.revoked && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => revoke(k.id)}
                        className={`${btnDanger} !px-4 !py-1.5 !text-xs`}
                      >
                        Revoke
                      </button>
                    )}
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
