"use client";

import { useState, useTransition } from "react";
import {
  createWebhook,
  deleteWebhook,
  redeliverWebhook,
  setWebhookActive,
} from "./actions";

interface DeliveryRow {
  id: number;
  event: string;
  delivered: boolean;
  attempts: number;
  lastStatus: number | null;
  lastError: string | null;
  at: string;
}

interface WebhookRow {
  id: number;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  lastStatus: number | null;
  lastDelivery: string | null;
  failedCount: number;
  deliveries: DeliveryRow[];
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
  const [expanded, setExpanded] = useState<number | null>(null);
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
                  <div className="flex items-center gap-2">
                    <p className="truncate font-mono text-xs text-navy">
                      {w.url}
                    </p>
                    {w.failedCount > 0 && (
                      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        {w.failedCount} failed
                      </span>
                    )}
                  </div>
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
                  {w.deliveries.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded(expanded === w.id ? null : w.id)
                      }
                      className="text-navy/60 hover:text-magenta"
                    >
                      {expanded === w.id ? "Hide history" : "History"}
                    </button>
                  )}
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
              {expanded === w.id && w.deliveries.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-beige pt-3">
                  {w.deliveries.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                            d.delivered ? "bg-green-500" : "bg-red-500"
                          }`}
                          aria-hidden
                        />
                        <span className="font-mono text-navy/80">{d.event}</span>
                        <span className="text-navy/45">{d.at}</span>
                        <span className="text-navy/45">
                          {d.delivered
                            ? `HTTP ${d.lastStatus ?? "—"}`
                            : `failed (${
                                d.lastStatus
                                  ? `HTTP ${d.lastStatus}`
                                  : "network"
                              }, ${d.attempts}×)`}
                        </span>
                      </div>
                      {!d.delivered && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => redeliverWebhook(d.id))}
                          className="font-medium text-magenta hover:underline disabled:opacity-50"
                        >
                          Redeliver
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
