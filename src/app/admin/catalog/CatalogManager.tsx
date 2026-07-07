"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCatalogProduct,
  updateCatalogProduct,
  setCatalogProductActive,
  deleteCatalogProduct,
  type ActionResult,
  type CatalogProductInput,
  type TierInput,
  type TierState,
} from "./actions";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  btnAccent,
  cardClass,
  inputClass,
  selectClass,
} from "@/components/ui/portal";

export interface CatalogProductVM extends CatalogProductInput {
  id: string;
}

export interface CatalogTaxonomy {
  forms: string[];
  families: string[];
  brands: string[];
  areas: string[];
}

const TIER_META: { key: "retail" | "provider" | "volume"; label: string }[] = [
  { key: "retail", label: "Retail" },
  { key: "provider", label: "Provider (Standard)" },
  { key: "volume", label: "Volume" },
];

function emptyInput(taxonomy: CatalogTaxonomy): CatalogProductInput {
  return {
    name: "",
    strength: "",
    form: taxonomy.forms[0] ?? "Injectable",
    unit: "Each",
    retail: { state: "hidden", dollars: 0 },
    provider: { state: "price", dollars: 0 },
    volume: { state: "hidden", dollars: 0 },
    productFamily: [],
    brand: "",
    therapeuticAreas: [],
    details: "",
    badge: "",
    active: true,
    sortOrder: 0,
  };
}

const inputStyle = inputClass;

/* ─────────────────────────── Tier field ─────────────────────────── */

function TierField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: TierInput;
  onChange: (v: TierInput) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <select
          aria-label={`${label} pricing mode`}
          value={value.state}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...value, state: e.target.value as TierState })
          }
          className="appearance-none rounded-2xl border border-beige-dark bg-white px-2.5 py-2 text-xs text-navy outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10 disabled:opacity-60"
        >
          <option value="price">$</option>
          <option value="na">N/A</option>
          <option value="hidden">Hide</option>
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          aria-label={`${label} price`}
          value={value.state === "price" ? value.dollars : ""}
          disabled={disabled || value.state !== "price"}
          onChange={(e) => onChange({ ...value, dollars: Number(e.target.value) })}
          placeholder={
            value.state === "na"
              ? "Not available"
              : value.state === "hidden"
                ? "Hidden (—)"
                : "0.00"
          }
          className="w-28 rounded-2xl border border-beige-dark bg-white px-3 py-2 text-sm text-navy outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10 disabled:bg-cream/60 disabled:text-navy/40"
        />
      </div>
    </div>
  );
}

/* ─────────────────────────── Chip multiselect ─────────────────────────── */

function ChipMulti({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              on
                ? "bg-navy text-white"
                : "bg-cream text-navy/70 hover:bg-beige"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Full product fields ─────────────────────────── */

function ProductFields({
  value,
  onChange,
  taxonomy,
  disabled,
}: {
  value: CatalogProductInput;
  onChange: (next: CatalogProductInput) => void;
  taxonomy: CatalogTaxonomy;
  disabled?: boolean;
}) {
  function set<K extends keyof CatalogProductInput>(
    key: K,
    v: CatalogProductInput[K],
  ) {
    onChange({ ...value, [key]: v });
  }
  function toggle(list: "productFamily" | "therapeuticAreas", option: string) {
    const cur = value[list];
    set(
      list,
      cur.includes(option)
        ? cur.filter((x) => x !== option)
        : [...cur, option],
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="flex flex-col gap-1 md:col-span-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Name
        </span>
        <input
          className={inputStyle}
          value={value.name}
          disabled={disabled}
          onChange={(e) => set("name", e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Strength
        </span>
        <input
          className={inputStyle}
          value={value.strength}
          disabled={disabled}
          placeholder="e.g. 2.5 mg/mL"
          onChange={(e) => set("strength", e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Unit
        </span>
        <input
          className={inputStyle}
          value={value.unit}
          disabled={disabled}
          placeholder="Each"
          onChange={(e) => set("unit", e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Dosage form
        </span>
        <select
          className={selectClass}
          value={value.form}
          disabled={disabled}
          onChange={(e) => set("form", e.target.value)}
        >
          {taxonomy.forms.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Brand
        </span>
        <select
          className={selectClass}
          value={value.brand}
          disabled={disabled}
          onChange={(e) => set("brand", e.target.value)}
        >
          <option value="">—</option>
          {taxonomy.brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Product family
        </span>
        <ChipMulti
          options={taxonomy.families}
          selected={value.productFamily}
          onToggle={(o) => !disabled && toggle("productFamily", o)}
        />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Therapeutic areas
        </span>
        <ChipMulti
          options={taxonomy.areas}
          selected={value.therapeuticAreas}
          onToggle={(o) => !disabled && toggle("therapeuticAreas", o)}
        />
      </div>

      <label className="flex flex-col gap-1 md:col-span-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Details
        </span>
        <textarea
          className={`${inputStyle} min-h-[64px]`}
          value={value.details}
          disabled={disabled}
          onChange={(e) => set("details", e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Badge
        </span>
        <input
          className={inputStyle}
          value={value.badge}
          disabled={disabled}
          placeholder="New / Promo / Limited"
          onChange={(e) => set("badge", e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Sort order
        </span>
        <input
          type="number"
          className={inputStyle}
          value={value.sortOrder}
          disabled={disabled}
          onChange={(e) => set("sortOrder", Number(e.target.value))}
        />
      </label>

      <label className="flex items-center gap-2 md:col-span-2">
        <input
          type="checkbox"
          checked={value.active}
          disabled={disabled}
          onChange={(e) => set("active", e.target.checked)}
        />
        <span className="text-sm text-navy/75">
          Active (visible in the catalog &amp; storefront)
        </span>
      </label>
    </div>
  );
}

/* ─────────────────────────── Single row ─────────────────────────── */

function ProductRow({
  product,
  taxonomy,
  canEdit,
  pending,
  run,
}: {
  product: CatalogProductVM;
  taxonomy: CatalogTaxonomy;
  canEdit: boolean;
  pending: boolean;
  run: (fn: () => Promise<ActionResult>, onOk?: () => void) => void;
}) {
  const initial: CatalogProductInput = useMemo(() => {
    const { id: _id, ...rest } = product;
    void _id;
    return rest;
  }, [product]);

  const [form, setForm] = useState<CatalogProductInput>(initial);
  const [expanded, setExpanded] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function save() {
    run(() => updateCatalogProduct(product.id, form));
  }
  function reset() {
    setForm(initial);
  }

  return (
    <div className={`${cardClass} px-5 py-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-navy">
            {product.name}
            {product.strength ? (
              <span className="text-navy/55"> · {product.strength}</span>
            ) : null}
          </p>
          <p className="font-mono text-[11px] text-navy/45">{product.id}</p>
        </div>
        <div className="flex items-center gap-2">
          {!product.active && <Badge tone="neutral">Inactive</Badge>}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full border border-beige-dark bg-white px-3.5 py-1.5 text-xs font-semibold text-navy/70 transition-all hover:border-navy/40 hover:text-navy"
          >
            {expanded ? "Hide details" : "Edit details"}
          </button>
        </div>
      </div>

      {/* Always-visible price editors. */}
      <div className="mt-3 flex flex-wrap items-end gap-4">
        {TIER_META.map((t) => (
          <TierField
            key={t.key}
            label={t.label}
            value={form[t.key]}
            disabled={!canEdit}
            onChange={(v) => setForm((prev) => ({ ...prev, [t.key]: v }))}
          />
        ))}
      </div>

      {expanded && (
        <div className="mt-4 border-t border-beige pt-4">
          <ProductFields
            value={form}
            onChange={setForm}
            taxonomy={taxonomy}
            disabled={!canEdit}
          />
        </div>
      )}

      {canEdit && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || pending}
            className="rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-navy-light active:scale-[0.98] disabled:opacity-50"
          >
            Save changes
          </button>
          {dirty && (
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className="rounded-full border border-beige-dark bg-white px-4 py-1.5 text-xs font-semibold text-navy/70 transition-all hover:border-navy/40 hover:text-navy disabled:opacity-50"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              run(() => setCatalogProductActive(product.id, !product.active))
            }
            disabled={pending}
            className="rounded-full border border-beige-dark bg-white px-4 py-1.5 text-xs font-semibold text-navy/70 transition-all hover:border-navy/40 hover:text-navy disabled:opacity-50"
          >
            {product.active ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  `Delete "${product.name}"? This cannot be undone. If it is referenced by clinic pricing, deactivate instead.`,
                )
              ) {
                run(() => deleteCatalogProduct(product.id));
              }
            }}
            disabled={pending}
            className="ml-auto rounded-full border border-red-200 bg-white px-4 py-1.5 text-xs font-semibold text-red-700 transition-all hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Manager ─────────────────────────── */

export default function CatalogManager({
  products,
  taxonomy,
  canEdit,
}: {
  products: CatalogProductVM[];
  taxonomy: CatalogTaxonomy;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [newId, setNewId] = useState("");
  const [newForm, setNewForm] = useState<CatalogProductInput>(() =>
    emptyInput(taxonomy),
  );

  function run(fn: () => Promise<ActionResult>, onOk?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fn();
        if (!res.ok) {
          setError(res.error ?? "Something went wrong.");
          return;
        }
        onOk?.();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function submitNew() {
    run(
      () => createCatalogProduct(newId, newForm),
      () => {
        setShowAdd(false);
        setNewId("");
        setNewForm(emptyInput(taxonomy));
      },
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    );
  }, [products, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CatalogProductVM[]>();
    for (const p of filtered) {
      const family = p.productFamily[0] ?? "Other";
      const arr = map.get(family) ?? [];
      arr.push(p);
      map.set(family, arr);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
  }, [filtered]);

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Catalog"
        description={`Edit base/standard pricing, add, rename, or remove products. ${products.length} SKUs.`}
        actions={
          canEdit ? (
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className={btnAccent}
            >
              {showAdd ? "Cancel" : "Add product"}
            </button>
          ) : undefined
        }
      />

      {!canEdit && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm text-amber-800">
          You have read-only access. Pricing changes require a full admin role.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {showAdd && canEdit && (
        <Card className="mb-6">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            New product
          </h2>
          <label className="mb-4 flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
              SKU id (immutable)
            </span>
            <input
              className={`${inputStyle} font-mono`}
              value={newId}
              placeholder="semaglutide-glycine-2.5mg-1ml"
              onChange={(e) => setNewId(e.target.value)}
            />
          </label>

          <div className="mb-4 flex flex-wrap items-end gap-4">
            {TIER_META.map((t) => (
              <TierField
                key={t.key}
                label={t.label}
                value={newForm[t.key]}
                onChange={(v) =>
                  setNewForm((prev) => ({ ...prev, [t.key]: v }))
                }
              />
            ))}
          </div>

          <ProductFields
            value={newForm}
            onChange={setNewForm}
            taxonomy={taxonomy}
          />

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={submitNew}
              disabled={pending || !newId.trim() || !newForm.name.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-navy-light active:scale-[0.98] disabled:opacity-50"
            >
              Create product
            </button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <input
          className={`${inputStyle} max-w-md`}
          value={query}
          placeholder="Search by name or SKU id…"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {groups.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            title="No products match"
            body="Try a different name or SKU id."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(([family, rows]) => (
            <section key={family}>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                {family} ({rows.length})
              </h2>
              <div className="flex flex-col gap-2">
                {rows.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    taxonomy={taxonomy}
                    canEdit={canEdit}
                    pending={pending}
                    run={run}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
