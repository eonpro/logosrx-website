"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createPartnerQuote, type CreatePartnerQuoteResult } from "./actions";

export interface FloorOption {
  productId: string;
  name: string;
  unit: string | null;
  floorDollars: number;
}

interface LineItem {
  key: string;
  productId: string;
  name: string;
  unit: string | null;
  floorDollars: number;
  priceDollars: string;
}

const inputClass =
  "w-full rounded-lg border border-beige bg-white px-3 py-2 text-sm text-navy outline-none focus:border-magenta focus:ring-1 focus:ring-magenta";

let counter = 0;
function nextKey() {
  counter += 1;
  return `pi-${counter}-${Date.now()}`;
}

export default function PartnerQuoteBuilder({
  floorOptions,
}: {
  floorOptions: FloorOption[];
}) {
  const [clinicName, setClinicName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [intro, setIntro] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("14");
  const [items, setItems] = useState<LineItem[]>([]);
  const [picker, setPicker] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatePartnerQuoteResult["quote"] | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  const optionsById = useMemo(() => {
    const m = new Map<string, FloorOption>();
    for (const o of floorOptions) m.set(o.productId, o);
    return m;
  }, [floorOptions]);

  const usedIds = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  function addItem(id: string) {
    const opt = optionsById.get(id);
    if (!opt || usedIds.has(id)) {
      setPicker("");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        productId: opt.productId,
        name: opt.name,
        unit: opt.unit,
        floorDollars: opt.floorDollars,
        priceDollars: opt.floorDollars.toFixed(2),
      },
    ]);
    setPicker("");
  }

  function updatePrice(key: string, value: string) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, priceDollars: value } : it)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side floor guard for fast feedback (server re-validates).
    for (const it of items) {
      if ((Number(it.priceDollars) || 0) < it.floorDollars) {
        setError(`${it.name}: price can't be below your floor of $${it.floorDollars.toFixed(2)}.`);
        return;
      }
    }

    startTransition(async () => {
      const res = await createPartnerQuote({
        clinicName,
        contactName,
        email,
        intro,
        expiresInDays: Number(expiresInDays) || 0,
        items: items.map((it) => ({
          productId: it.productId,
          priceDollars: Number(it.priceDollars) || 0,
        })),
      });
      if (res.ok && res.quote) setCreated(res.quote);
      else setError(res.error ?? "Could not create the quote.");
    });
  }

  if (created) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8">
          <h1 className="text-xl font-bold text-navy">Quote created</h1>
          <p className="mt-2 text-sm text-navy/70">
            Share the link and password with the clinic separately. The password
            gates the link and is shown <strong>only once</strong>.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-navy/55">
                Quote link
              </label>
              <div className="flex items-center gap-2">
                <input readOnly value={created.url} className={inputClass} />
                <button
                  type="button"
                  onClick={() => copy(created.url, "link")}
                  className="shrink-0 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy/90"
                >
                  {copied === "link" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-navy/55">
                Password
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={created.password}
                  className={`${inputClass} font-mono tracking-widest`}
                />
                <button
                  type="button"
                  onClick={() => copy(created.password, "pw")}
                  className="shrink-0 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy/90"
                >
                  {copied === "pw" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              href={`/partners/quotes/${created.id}`}
              className="rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-white hover:bg-magenta/90"
            >
              View quote
            </Link>
            <Link
              href="/partners/quotes"
              className="rounded-full border border-beige px-5 py-2.5 text-sm font-semibold text-navy hover:bg-cream"
            >
              Back to quotes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-2xl">
      <div className="mb-6">
        <Link href="/partners/quotes" className="text-sm text-navy/60 hover:text-navy">
          ← Quotes
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy">New pricing quote</h1>
      </div>

      <section className="rounded-2xl border border-beige bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-navy/55">
          Recipient
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-navy/60">Clinic name</label>
            <input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className={inputClass}
              placeholder="Acme Wellness"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-navy/60">Contact name</label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className={inputClass}
              placeholder="Dr. Jane Smith"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-navy/60">
              Recipient email <span className="text-magenta">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="jane@acmewellness.com"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-navy/60">
              Intro message (optional)
            </label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Thanks for meeting with us — here's the pricing we discussed."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-navy/60">Expires in (days)</label>
            <input
              type="number"
              min={0}
              max={365}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-beige bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-navy/55">
          Products
        </h2>
        <p className="mt-1 text-xs text-navy/50">
          Prices must be at or above your wholesale floor. You earn the spread on
          every sale.
        </p>

        <div className="mt-4">
          <select
            value={picker}
            onChange={(e) => addItem(e.target.value)}
            className={inputClass}
          >
            <option value="">+ Add a product…</option>
            {floorOptions
              .filter((o) => !usedIds.has(o.productId))
              .map((o) => (
                <option key={o.productId} value={o.productId}>
                  {o.name} (floor ${o.floorDollars.toFixed(2)})
                </option>
              ))}
          </select>
        </div>

        {items.length > 0 && (
          <div className="mt-4 space-y-3">
            {items.map((it) => {
              const below = (Number(it.priceDollars) || 0) < it.floorDollars;
              return (
                <div
                  key={it.key}
                  className="grid grid-cols-12 items-end gap-2 rounded-xl border border-beige bg-cream/40 p-3"
                >
                  <div className="col-span-12 sm:col-span-7">
                    <div className="text-sm font-medium text-navy">{it.name}</div>
                    <div className="text-xs text-navy/50">
                      Floor ${it.floorDollars.toFixed(2)}
                      {it.unit ? ` · ${it.unit}` : ""}
                    </div>
                  </div>
                  <div className="col-span-9 sm:col-span-4">
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-navy/45">
                      Your price ($)
                    </label>
                    <input
                      type="number"
                      min={it.floorDollars}
                      step="0.01"
                      value={it.priceDollars}
                      onChange={(e) => updatePrice(it.key, e.target.value)}
                      className={`${inputClass} ${below ? "border-red-400 focus:border-red-500 focus:ring-red-500" : ""}`}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(it.key)}
                      className="rounded-lg px-2 py-2 text-navy/40 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href="/partners/quotes"
          className="rounded-full border border-beige px-5 py-2.5 text-sm font-semibold text-navy hover:bg-cream"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-magenta px-6 py-2.5 text-sm font-semibold text-white hover:bg-magenta/90 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create quote & generate password"}
        </button>
      </div>
    </form>
  );
}
