"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createQuote, type CreateQuoteResult } from "./actions";
import {
  btnAccent,
  btnGhost,
  btnSecondary,
  cardClass,
  inputClass as portalInputClass,
  selectClass,
} from "@/components/ui/portal";

export interface ProductOption {
  id: string;
  name: string;
  unit: string | null;
  standardDollars: number | null;
}

export interface ReferrerOrg {
  id: number;
  name: string;
  reps: { id: number; name: string }[];
}

interface LineItem {
  key: string;
  productId: string | null;
  productName: string;
  priceDollars: string;
  unit: string;
  standardDollars: number | null;
}

export interface QuotePrefill {
  intro: string;
  tier: "standard" | "preferred" | "vip";
  discountPct: number;
  partnerOrgId: number | null;
  partnerRepId: number | null;
  items: {
    productId: string | null;
    productName: string;
    priceDollars: number;
    unit: string | null;
  }[];
}

const inputClass = portalInputClass;

const labelClass =
  "mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45";

let counter = 0;
function nextKey() {
  counter += 1;
  return `item-${counter}-${Date.now()}`;
}

export default function QuoteBuilder({
  productOptions,
  referrerOrgs = [],
  prefill = null,
}: {
  productOptions: ProductOption[];
  referrerOrgs?: ReferrerOrg[];
  prefill?: QuotePrefill | null;
}) {
  const [clinicName, setClinicName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [intro, setIntro] = useState(prefill?.intro ?? "");
  const [tier, setTier] = useState<"standard" | "preferred" | "vip">(
    prefill?.tier ?? "standard",
  );
  const [discountPct, setDiscountPct] = useState(
    prefill ? String(prefill.discountPct) : "0",
  );
  const [expiresInDays, setExpiresInDays] = useState("14");
  const [items, setItems] = useState<LineItem[]>(() =>
    (prefill?.items ?? []).map((it) => ({
      key: nextKey(),
      productId: it.productId,
      productName: it.productName,
      priceDollars: it.priceDollars ? String(it.priceDollars) : "",
      unit: it.unit ?? "",
      standardDollars:
        productOptions.find((o) => o.id === it.productId)?.standardDollars ??
        null,
    })),
  );
  const [picker, setPicker] = useState("");
  const [partnerOrgId, setPartnerOrgId] = useState(
    prefill?.partnerOrgId ? String(prefill.partnerOrgId) : "",
  );
  const [partnerRepId, setPartnerRepId] = useState(
    prefill?.partnerRepId ? String(prefill.partnerRepId) : "",
  );
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreateQuoteResult["quote"] | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  const optionsById = useMemo(() => {
    const m = new Map<string, ProductOption>();
    for (const o of productOptions) m.set(o.id, o);
    return m;
  }, [productOptions]);

  const selectedOrg = useMemo(
    () => referrerOrgs.find((o) => String(o.id) === partnerOrgId) ?? null,
    [referrerOrgs, partnerOrgId],
  );

  function changeReferrerOrg(value: string) {
    setPartnerOrgId(value);
    // Reset rep when the org changes — a rep only belongs to one org.
    setPartnerRepId("");
  }

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
        partnerOrgId: partnerOrgId ? Number(partnerOrgId) : null,
        partnerRepId: partnerRepId ? Number(partnerRepId) : null,
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
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-soft-lg">
          <h1 className="text-2xl font-bold tracking-tight text-navy">Quote created</h1>
          <p className="mt-2 text-sm text-navy/70">
            Share the link and password with the clinic separately (the password
            gates the link). The password is shown <strong>only once</strong>.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                Quote link
              </label>
              <div className="flex items-center gap-2">
                <input readOnly value={created.url} className={inputClass} />
                <button
                  type="button"
                  onClick={() => copy(created.url, "link")}
                  className="shrink-0 rounded-full bg-plum px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-plum-deep active:scale-[0.98]"
                >
                  {copied === "link" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
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
                  className="shrink-0 rounded-full bg-plum px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-plum-deep active:scale-[0.98]"
                >
                  {copied === "pw" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              href={`/admin/quotes/${created.id}`}
              className={btnAccent}
            >
              View quote
            </Link>
            <Link
              href="/admin/quotes"
              className={btnSecondary}
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
        <Link href="/admin/quotes" className={`${btnGhost} -ml-4`}>
          ← Quotes
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          {prefill ? "Duplicate quote" : "New pricing quote"}
        </h1>
        {prefill && (
          <p className="mt-1 text-sm text-navy/60">
            Products, pricing and referrer were copied from the original quote.
            Enter the new recipient below — a fresh link and password will be
            generated.
          </p>
        )}
      </div>

      <section className={`${cardClass} p-6 sm:p-7`}>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Recipient
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Clinic name</label>
            <input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className={inputClass}
              placeholder="Acme Wellness"
            />
          </div>
          <div>
            <label className={labelClass}>Contact name</label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className={inputClass}
              placeholder="Dr. Jane Smith"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>
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
            <label className={labelClass}>
              Intro message (optional)
            </label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Thanks for meeting with us — here's the pricing we discussed."
            />
          </div>
        </div>
      </section>

      <section className={`${cardClass} mt-5 p-6 sm:p-7`}>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Pricing basis
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as typeof tier)}
              className={selectClass}
            >
              <option value="standard">Standard</option>
              <option value="preferred">Preferred</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>
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
            <label className={labelClass}>Expires in (days)</label>
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

      {referrerOrgs.length > 0 && (
        <section className={`${cardClass} mt-5 p-6 sm:p-7`}>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Referrer (optional)
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Partner org</label>
              <select
                value={partnerOrgId}
                onChange={(e) => changeReferrerOrg(e.target.value)}
                className={selectClass}
              >
                <option value="">No referrer</option>
                {referrerOrgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Sales rep</label>
              <select
                value={partnerRepId}
                onChange={(e) => setPartnerRepId(e.target.value)}
                className={selectClass}
                disabled={!selectedOrg || selectedOrg.reps.length === 0}
              >
                <option value="">
                  {selectedOrg && selectedOrg.reps.length > 0
                    ? "Org only (no rep)"
                    : "—"}
                </option>
                {selectedOrg?.reps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-3 text-xs text-navy/50">
            Credits the partner (and rep, if chosen) for this relationship. When
            the clinic claims the quote, it&apos;s added to their network and
            earns them commission. The quote also appears on their partner portal.
          </p>
        </section>
      )}

      <section className={`${cardClass} mt-5 p-6 sm:p-7`}>
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Quoted products
          </h2>
          <button
            type="button"
            onClick={addCustomItem}
            className={`${btnGhost} !px-3 !py-1.5 text-xs`}
          >
            + Custom line
          </button>
        </div>

        <div className="mt-4">
          <select
            value={picker}
            onChange={(e) => addCatalogItem(e.target.value)}
            className={selectClass}
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
                className="grid grid-cols-12 items-end gap-2 rounded-2xl border border-beige/70 bg-cream/50 p-4"
              >
                <div className="col-span-12 sm:col-span-5">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-navy/45">
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
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-navy/45">
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
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-navy/45">
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
                    className="rounded-full px-2 py-2 text-navy/40 transition-colors hover:bg-red-50 hover:text-red-600"
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
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href="/admin/quotes"
          className={btnSecondary}
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className={btnAccent}
        >
          {pending ? "Creating…" : "Create quote & generate password"}
        </button>
      </div>
    </form>
  );
}
