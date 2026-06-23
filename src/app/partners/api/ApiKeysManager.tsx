"use client";

import { useState, useTransition } from "react";
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
    <div className="rounded-2xl border border-beige bg-white p-6">
      <h2 className="text-sm font-semibold text-navy">API keys</h2>

      {newKey && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
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
              className="rounded-lg border border-beige px-3 py-2 text-xs font-medium text-navy/70 hover:border-magenta hover:text-magenta"
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
            className="h-10 w-64 rounded-lg border border-beige bg-cream/50 px-3 text-sm text-navy outline-none focus:border-magenta"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-full bg-magenta px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
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
            <thead className="text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Key</th>
                <th className="py-2 pr-4 font-semibold">Last used</th>
                <th className="py-2 pr-4 font-semibold">Status</th>
                <th className="py-2 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {keys.map((k) => (
                <tr key={k.id} className={k.revoked ? "opacity-50" : ""}>
                  <td className="py-2 pr-4">{k.name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{k.keyPrefix}…</td>
                  <td className="py-2 pr-4">{k.lastUsed ?? "Never"}</td>
                  <td className="py-2 pr-4">
                    {k.revoked ? (
                      <span className="text-navy/50">Revoked</span>
                    ) : (
                      <span className="text-emerald-700">Active</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    {!k.revoked && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => revoke(k.id)}
                        className="text-xs font-medium text-navy/60 hover:text-red-600 disabled:opacity-50"
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
