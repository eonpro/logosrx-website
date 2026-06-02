"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  createPromotion,
  updatePromotion,
  deletePromotion,
  setPromotionActive,
  addFeatured,
  removeFeatured,
  type PromotionInput,
} from "./actions";

export interface PromotionVM extends PromotionInput {
  id: number;
}

export interface FeaturedVM {
  id: number;
  productId: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

export interface ProductOption {
  id: string;
  name: string;
}

const EMPTY_PROMO: PromotionInput = {
  kind: "promo",
  layout: "card",
  title: "",
  body: "",
  imageUrl: "",
  bgColor: "",
  badge: "",
  ctaLabel: "",
  ctaHref: "",
  productId: "",
  audienceTier: "",
  pinned: false,
  active: true,
  sortOrder: 0,
  startsAt: "",
  endsAt: "",
};

/** Reads the category out of a `#category=<area>` CTA href. */
function categoryFromHref(href: string): string {
  const m = /^#category=(.+)$/.exec(href);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function MerchandisingManager({
  promotions,
  featured,
  productOptions,
  categoryOptions,
}: {
  promotions: PromotionVM[];
  featured: FeaturedVM[];
  productOptions: ProductOption[];
  categoryOptions: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Promotion form: null editingId = creating a new one.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PromotionInput>(EMPTY_PROMO);
  const [showForm, setShowForm] = useState(false);

  // Featured add form
  const [featProduct, setFeatProduct] = useState("");
  const [featLabel, setFeatLabel] = useState("");
  const [featOrder, setFeatOrder] = useState(0);

  const productName = (id: string) =>
    productOptions.find((p) => p.id === id)?.name ?? id;

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_PROMO);
    setShowForm(true);
  }

  function startEdit(p: PromotionVM) {
    const { id: _id, ...rest } = p;
    void _id;
    setEditingId(p.id);
    setForm(rest);
    setShowForm(true);
  }

  function submitForm() {
    if (!form.title.trim()) return;
    run(async () => {
      if (editingId === null) await createPromotion(form);
      else await updatePromotion(editingId, form);
      setShowForm(false);
      setForm(EMPTY_PROMO);
      setEditingId(null);
    });
  }

  function set<K extends keyof PromotionInput>(key: K, value: PromotionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Merchandising</h1>
        <p className="mt-1 text-sm text-navy/70">
          Feature products and publish promotions &amp; news to the clinic
          storefront.
        </p>
      </div>

      {/* ───────── Featured products ───────── */}
      <section className="mb-10 rounded-2xl border border-beige bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-navy">Featured products</h2>

        {featured.length === 0 ? (
          <p className="text-sm text-navy/50">No featured products yet.</p>
        ) : (
          <ul className="mb-5 divide-y divide-beige">
            {featured.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">
                    {productName(f.productId)}
                  </p>
                  <p className="text-xs text-navy/50">
                    Order {f.sortOrder}
                    {f.label ? ` · “${f.label}”` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => removeFeatured(f.id))}
                  className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 rounded-xl bg-cream p-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-medium text-navy/60">
            Product
            <select
              value={featProduct}
              onChange={(e) => setFeatProduct(e.target.value)}
              className="mt-1 w-full rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy"
            >
              <option value="">Select a product…</option>
              {productOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-navy/60 sm:w-36">
            Badge label
            <input
              type="text"
              value={featLabel}
              onChange={(e) => setFeatLabel(e.target.value)}
              placeholder="New"
              className="mt-1 w-full rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy"
            />
          </label>
          <label className="text-xs font-medium text-navy/60 sm:w-24">
            Order
            <input
              type="number"
              value={featOrder}
              onChange={(e) => setFeatOrder(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy"
            />
          </label>
          <button
            type="button"
            disabled={pending || !featProduct}
            onClick={() =>
              run(async () => {
                await addFeatured(featProduct, featLabel, featOrder);
                setFeatProduct("");
                setFeatLabel("");
                setFeatOrder(0);
              })
            }
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-deep disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </section>

      {/* ───────── Promotions & news ───────── */}
      <section className="rounded-2xl border border-beige bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Promotions &amp; news</h2>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-magenta-dark"
          >
            + New
          </button>
        </div>

        {promotions.length === 0 ? (
          <p className="text-sm text-navy/50">No promotions or news yet.</p>
        ) : (
          <ul className="divide-y divide-beige">
            {promotions.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        p.kind === "news"
                          ? "bg-navy/10 text-navy"
                          : "bg-magenta/10 text-magenta"
                      }`}
                    >
                      {p.kind}
                    </span>
                    <p className="truncate text-sm font-semibold text-navy">
                      {p.title}
                    </p>
                    {!p.active && (
                      <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-semibold text-navy/50">
                        inactive
                      </span>
                    )}
                    {p.pinned && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        pinned
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-navy/50">
                    {p.audienceTier ? `${p.audienceTier} tier` : "all tiers"}
                    {p.productId ? ` · ${productName(p.productId)}` : ""}
                    {p.startsAt || p.endsAt
                      ? ` · ${p.startsAt || "…"} → ${p.endsAt || "…"}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => setPromotionActive(p.id, !p.active))}
                    className="rounded-lg border border-beige-dark px-2.5 py-1.5 text-xs font-semibold text-navy/70 hover:bg-beige disabled:opacity-50"
                  >
                    {p.active ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="rounded-lg border border-beige-dark px-2.5 py-1.5 text-xs font-semibold text-navy/70 hover:bg-beige"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => deletePromotion(p.id))}
                    className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {showForm && (
          <div className="mt-6 rounded-xl border border-beige-dark bg-cream p-5">
            <h3 className="mb-4 text-sm font-bold text-navy">
              {editingId === null ? "New entry" : "Edit entry"}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Layout">
                <select
                  value={form.layout}
                  onChange={(e) =>
                    set("layout", e.target.value as PromotionInput["layout"])
                  }
                  className="input"
                >
                  <option value="card">Card (promo/news feed)</option>
                  <option value="hero">Hero banner (top spotlight)</option>
                  <option value="tile">Category tile</option>
                </select>
              </Field>
              <Field label="Type">
                <select
                  value={form.kind}
                  onChange={(e) =>
                    set("kind", e.target.value as PromotionInput["kind"])
                  }
                  className="input"
                >
                  <option value="promo">Promotion</option>
                  <option value="news">News</option>
                </select>
              </Field>
              <Field label="Audience">
                <select
                  value={form.audienceTier}
                  onChange={(e) =>
                    set(
                      "audienceTier",
                      e.target.value as PromotionInput["audienceTier"],
                    )
                  }
                  className="input"
                >
                  <option value="">All tiers</option>
                  <option value="standard">Standard</option>
                  <option value="preferred">Preferred</option>
                  <option value="vip">VIP</option>
                </select>
              </Field>
              <Field label="Title" full>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Body" full>
                <textarea
                  value={form.body}
                  onChange={(e) => set("body", e.target.value)}
                  rows={3}
                  className="input"
                />
              </Field>
              <Field label="Badge">
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => set("badge", e.target.value)}
                  placeholder="Limited time"
                  className="input"
                />
              </Field>
              <Field label="Linked product (optional)">
                <select
                  value={form.productId}
                  onChange={(e) => set("productId", e.target.value)}
                  className="input"
                >
                  <option value="">None</option>
                  {productOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="CTA label">
                <input
                  type="text"
                  value={form.ctaLabel}
                  onChange={(e) => set("ctaLabel", e.target.value)}
                  placeholder="Learn more"
                  className="input"
                />
              </Field>
              <Field label="CTA link">
                <input
                  type="text"
                  value={form.ctaHref}
                  onChange={(e) => set("ctaHref", e.target.value)}
                  placeholder="/products/nad-plus"
                  className="input"
                />
              </Field>
              <Field label="…or filter to a category (overrides link)" full>
                <select
                  value={categoryFromHref(form.ctaHref)}
                  onChange={(e) =>
                    set(
                      "ctaHref",
                      e.target.value
                        ? `#category=${encodeURIComponent(e.target.value)}`
                        : "",
                    )
                  }
                  className="input"
                >
                  <option value="">No category filter</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <ImageUpload
                  label="Image (hero / tile / promo)"
                  value={form.imageUrl}
                  onChange={(url) => set("imageUrl", url)}
                />
              </div>
              <Field label="Background color (hero/tile)">
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={form.bgColor || "#26225f"}
                    onChange={(e) => set("bgColor", e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-beige-dark bg-white"
                    aria-label="Background color"
                  />
                  <input
                    type="text"
                    value={form.bgColor}
                    onChange={(e) => set("bgColor", e.target.value)}
                    placeholder="#bcd4ea"
                    className="input"
                  />
                </div>
              </Field>
              <Field label="Starts">
                <input
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => set("startsAt", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Ends">
                <input
                  type="date"
                  value={form.endsAt}
                  onChange={(e) => set("endsAt", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Sort order">
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", Number(e.target.value))}
                  className="input"
                />
              </Field>
              <div className="flex items-center gap-5 pt-6">
                <label className="flex items-center gap-2 text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => set("active", e.target.checked)}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={(e) => set("pinned", e.target.checked)}
                  />
                  Pinned
                </label>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                disabled={pending || !form.title.trim()}
                onClick={submitForm}
                className="rounded-lg bg-magenta px-5 py-2 text-sm font-semibold text-white hover:bg-magenta-dark disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(EMPTY_PROMO);
                }}
                className="rounded-lg border border-beige-dark px-5 py-2 text-sm font-semibold text-navy/70 hover:bg-beige"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <style>{`
        .input {
          margin-top: 0.25rem;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2d9c8;
          background: #fff;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #1a1a4b;
        }
        .input:focus { outline: 2px solid rgba(196,30,108,0.2); border-color: #c41e6c; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label
      className={`text-xs font-medium text-navy/60 ${full ? "sm:col-span-2" : ""}`}
    >
      {label}
      {children}
    </label>
  );
}
