"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createQuote, type CreateQuoteResult } from "./actions";

export interface ProductOption {
  id: string;
  name: string;
  unit: string | null;
  standardDollars: number | null;
}

interface LineItem {
  key: string;
  productId: string | null;
  productName: string;
  priceDollars: string;
  unit: string;
  standardDollars: number | null;
}

const inputClass =
  "w-full rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-magenta focus:ring-1 focus:ring-magenta";

let counter = 0;
function nextKey() {
  counter += 1;
  return `item-${counter}-${Date.now()}`;
}

export default function QuoteBuilder({
  productOptions,
}: {
  productOptions: ProductOption[];
}) {
  const [clinicName, setClinicName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [intro, setIntro] = useState("");
  const [tier, setTier] = useState<"standard" | "preferred" | "vip">("standard");
  const [discountPct, setDiscountPct] = useState("0");
  const [expiresInDays, setExpiresInDays] = useState("14");
  const [items, setItems] = useState<LineItem[]>([]);
  const [picker, setPicker] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreateQuoteResult["quote"] | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  const optionsById = useMemo(() => {
    const m = new Map<string, ProductOption>();
    for (const o of productOptions) m.set(o.id, o);
    return m;
  }, [productOptions]);

  function addCatalogItem(id: string) {
    const opt = optionsById.get(id);
    if (!opt) return;
    setItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        productId: opt.id,
        productName: opt.name,
        priceDollars: opt.standardDollars !== null ? String(opt.standardDollars) : "",
        unit: opt.unit ?? "",
        standardDollars: opt.standardDollars,
      },
    ]);
    setPicker("");
  }

  function addCustomItem() {
    setItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        productId: null,
        productName: "",
        priceDollars: "",
        unit: "",
        standardDollars: null,
      },
    ]);
  }

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
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
    startTransition(async () => {
      const res = await createQuote({
        clinicName,
        contactName,
        email,
        intro,
        tier,
        discountPct: Number(discountPct) || 0,
        expiresInDays: Number(expiresInDays) || 0,
        items: items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          priceDollars: Number(it.priceDollars) || 0,
          unit: it.unit || null,
        })),
      });
      if (res.ok && res.quote) {
        setCreated(res.quote);
      } else {
        setError(res.error ?? "Could not create the quote.");
      }
    });
  }

  if (created) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8">
          <h1 className="text-xl font-bold text-navy">Quote created</h1>
          <p className="mt-2 text-sm text-navy/70">
            Share the link and password with the clinic separately (the password
            gates the link). The password is shown <strong>only once</strong>.
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
              href={`/admin/quotes/${created.id}`}
              className="rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-white hover:bg-magenta/90"
            >
              View quote
            </Link>
            <Link
              href="/admin/quotes"
              className="rounded-full border border-beige-dark px-5 py-2.5 text-sm font-semibold text-navy hover:bg-beige/50"
            >
              Back to quotes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <Link href="/admin/quotes" className="text-sm text-navy/60 hover:text-navy">
          ← Quotes
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy">New pricing quote</h1>
      </div>

      <section className="rounded-2xl border border-beige-dark bg-white p-6">
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
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-beige-dark bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-navy/55">
          Pricing basis
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-navy/60">Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as typeof tier)}
              className={inputClass}
            >
              <option value="standard">Standard</option>
              <option value="preferred">Preferred</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-navy/60">
              Catalog-wide discount %
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              className={inputClass}
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
        <p className="mt-3 text-xs text-navy/50">
          The discount applies across the whole catalog once claimed. Add specific
          products below to set exact per-product prices on top of it. Set days to
          0 for no expiry.
        </p>
      </section>

      <section className="mt-5 rounded-2xl border border-beige-dark bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy/55">
            Quoted products
          </h2>
          <button
            type="button"
            onClick={addCustomItem}
            className="text-xs font-semibold text-magenta hover:text-magenta/80"
          >
            + Custom line
          </button>
        </div>

        <div className="mt-4">
          <select
            value={picker}
            onChange={(e) => addCatalogItem(e.target.value)}
            className={inputClass}
          >
            <option value="">+ Add a catalog product…</option>
            {productOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
                {o.standardDollars !== null ? ` ($${o.standardDollars.toFixed(2)})` : ""}
              </option>
            ))}
          </select>
        </div>

        {items.length > 0 && (
          <div className="mt-4 space-y-3">
            {items.map((it) => (
              <div
                key={it.key}
                className="grid grid-cols-12 items-end gap-2 rounded-xl border border-beige-dark/70 bg-beige/20 p-3"
              >
                <div className="col-span-12 sm:col-span-5">
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-navy/45">
                    Product
                  </label>
                  <input
                    value={it.productName}
                    onChange={(e) => updateItem(it.key, { productName: e.target.value })}
                    className={inputClass}
                    placeholder="Product name"
                    readOnly={it.productId !== null}
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-navy/45">
                    Price ($){it.standardDollars !== null ? ` · std $${it.standardDollars.toFixed(2)}` : ""}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.priceDollars}
                    onChange={(e) => updateItem(it.key, { priceDollars: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-navy/45">
                    Unit
                  </label>
                  <input
                    value={it.unit}
                    onChange={(e) => updateItem(it.key, { unit: e.target.value })}
                    className={inputClass}
                    placeholder="per vial"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-end">
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
            ))}
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
          href="/admin/quotes"
          className="rounded-full border border-beige-dark px-5 py-2.5 text-sm font-semibold text-navy hover:bg-beige/50"
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
