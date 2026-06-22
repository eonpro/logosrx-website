"use client";

import { useState, useTransition } from "react";
import { createWebhook, deleteWebhook, setWebhookActive } from "./actions";

interface WebhookRow {
  id: number;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  lastStatus: number | null;
  lastDelivery: string | null;
}

const EVENTS = [
  { id: "clinic.attributed", label: "Clinic attributed" },
  { id: "transaction.recorded", label: "Transaction recorded" },
  { id: "payout.recorded", label: "Payout recorded" },
];

export default function WebhooksManager({
  webhooks,
}: {
  webhooks: WebhookRow[];
}) {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleEvent(id: string) {
    setEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  function create() {
    setError("");
    startTransition(async () => {
      const res = await createWebhook({ url, events });
      if (!res.ok) {
        setError(res.error ?? "Could not create the webhook.");
        return;
      }
      setUrl("");
      setEvents([]);
    });
  }

  function run(work: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    startTransition(async () => {
      const res = await work();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="rounded-2xl border border-beige bg-white p-6">
      <h2 className="text-sm font-semibold text-navy">Webhooks</h2>
      <p className="mt-1 text-xs text-navy/60">
        We POST signed JSON to your HTTPS endpoint. Verify the{" "}
        <code className="rounded bg-cream px-1 py-0.5">X-Logos-Signature</code>{" "}
        header (HMAC-SHA256 of <code>&quot;{`{t}.{body}`}&quot;</code>) with the
        webhook secret.
      </p>

      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-navy/60">Endpoint URL</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhooks/logos"
            maxLength={500}
            className="h-10 w-full max-w-lg rounded-lg border border-beige bg-cream/50 px-3 text-sm text-navy outline-none focus:border-magenta"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          {EVENTS.map((ev) => (
            <label key={ev.id} className="flex items-center gap-1.5 text-sm text-navy/80">
              <input
                type="checkbox"
                checked={events.includes(ev.id)}
                onChange={() => toggleEvent(ev.id)}
              />
              {ev.label}
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-10 w-fit rounded-full bg-magenta px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Working…" : "Add webhook"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {webhooks.length > 0 && (
        <div className="mt-5 space-y-3">
          {webhooks.map((w) => (
            <div
              key={w.id}
              className={`rounded-xl border border-beige p-4 ${w.active ? "" : "opacity-60"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-navy">{w.url}</p>
                  <p className="mt-1 text-xs text-navy/55">
                    {w.events.join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-navy/45">
                    {w.lastDelivery
                      ? `Last delivery ${w.lastDelivery} · HTTP ${w.lastStatus ?? "—"}`
                      : "No deliveries yet"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setRevealed(revealed === w.id ? null : w.id)}
                    className="text-navy/60 hover:text-magenta"
                  >
                    {revealed === w.id ? "Hide secret" : "Show secret"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => setWebhookActive(w.id, !w.active))}
                    className="text-navy/60 hover:text-magenta disabled:opacity-50"
                  >
                    {w.active ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => deleteWebhook(w.id))}
                    className="text-navy/60 hover:text-red-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {revealed === w.id && (
                <code className="mt-2 block overflow-x-auto rounded-lg bg-cream px-3 py-2 font-mono text-xs text-navy">
                  {w.secret}
                </code>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
