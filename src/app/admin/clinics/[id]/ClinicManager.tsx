"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addClinicNote,
  addPriceItem,
  deletePriceItem,
  resetProductPrice,
  revealCard,
  setClinicPricing,
  setClinicVerification,
  setProductPrice,
  type RevealCardResult,
} from "../actions";

type Status = "pending" | "verified" | "rejected";
type Tier = "standard" | "preferred" | "vip";

interface NoteView {
  id: number;
  body: string;
  authorEmail: string | null;
  createdAt: string;
}

interface PriceItemView {
  id: number;
  productName: string;
  priceCents: number;
  unit: string | null;
}

interface CatalogRow {
  productId: string;
  name: string;
  strength: string | null;
  unit: string;
  family: string;
  standardCents: number | null;
  overrideCents: number | null;
}

const STATUS_OPTIONS: Status[] = ["verified", "rejected", "pending"];
const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "preferred", label: "Preferred" },
  { value: "vip", label: "VIP" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-beige bg-white p-6">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-navy/70">
        {title}
      </h2>
      {children}
    </div>
  );
}

function fmtMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ClinicManager({
  clinicId,
  status,
  hasCard,
  cardLast4,
  pricing,
  catalog,
  customItems,
  notes,
}: {
  clinicId: number;
  status: Status;
  hasCard: boolean;
  cardLast4: string | null;
  pricing: { tier: Tier; discountPct: number; notes: string };
  catalog: CatalogRow[];
  customItems: PriceItemView[];
  notes: NoteView[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <VerificationCard
        clinicId={clinicId}
        status={status}
        pending={pending}
        run={(fn) => startTransition(fn)}
        refresh={() => router.refresh()}
      />
      <CardReveal clinicId={clinicId} hasCard={hasCard} cardLast4={cardLast4} />
      <PricingCard
        clinicId={clinicId}
        pricing={pricing}
        catalog={catalog}
        customItems={customItems}
        pending={pending}
        run={(fn) => startTransition(fn)}
        refresh={() => router.refresh()}
      />
      <NotesCard
        clinicId={clinicId}
        notes={notes}
        pending={pending}
        run={(fn) => startTransition(fn)}
        refresh={() => router.refresh()}
      />
    </div>
  );
}

function VerificationCard({
  clinicId,
  status,
  pending,
  run,
  refresh,
}: {
  clinicId: number;
  status: Status;
  pending: boolean;
  run: (fn: () => void) => void;
  refresh: () => void;
}) {
  return (
    <Section title="Verification">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            disabled={pending || status === s}
            onClick={() =>
              run(async () => {
                await setClinicVerification(clinicId, s);
                refresh();
              })
            }
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
              status === s
                ? "bg-navy/10 text-navy/65 cursor-not-allowed"
                : s === "verified"
                  ? "bg-white border border-green-200 text-green-700 hover:bg-green-50"
                  : s === "rejected"
                    ? "bg-white border border-red-200 text-red-700 hover:bg-red-50"
                    : "bg-white border border-beige hover:border-magenta hover:text-magenta text-navy/60"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-navy/55">
        Approving a clinic emails them their approval and posts to Slack.
      </p>
    </Section>
  );
}

function CardReveal({
  clinicId,
  hasCard,
  cardLast4,
}: {
  clinicId: number;
  hasCard: boolean;
  cardLast4: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<RevealCardResult["card"] | null>(null);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const res = await revealCard(clinicId, password);
      if (!res.ok) {
        setError(res.error ?? "Could not reveal card.");
      } else {
        setCard(res.card ?? null);
        setOpen(false);
        setPassword("");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function hide() {
    setCard(null);
    setOpen(false);
    setPassword("");
    setError("");
  }

  return (
    <Section title="Payment card">
      {!hasCard ? (
        <p className="text-sm text-navy/55">No card on file for this clinic.</p>
      ) : card ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm md:grid-cols-3">
            <Detail label="Cardholder" value={card.cardholderName} />
            <Detail label="Card number" value={card.cardNumber} mono />
            <Detail label="CVV" value={card.cvv} mono />
            <Detail label="Type" value={card.cardType} />
            <Detail label="Expires" value={card.expiration} />
            <Detail label="Billing zip" value={card.billingZip} />
            <Detail label="Billing address" value={card.billingAddress} />
          </div>
          <div>
            <button
              onClick={hide}
              className="rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy/90"
            >
              Hide card
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-navy/65">
            Card on file: <span className="font-medium">•••• {cardLast4}</span>
          </p>
          {!open ? (
            <div>
              <button
                onClick={() => setOpen(true)}
                className="rounded-full border border-navy/20 bg-white px-4 py-1.5 text-xs font-semibold text-navy hover:border-magenta hover:text-magenta"
              >
                Reveal full card
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border border-beige bg-cream/40 p-4">
              <p className="text-xs text-navy/65">
                Re-enter your admin password to view the full card. This access
                is logged.
              </p>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Your admin password"
                className="rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-magenta"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={submit}
                  disabled={busy}
                  className="rounded-full bg-magenta px-4 py-1.5 text-xs font-semibold text-white hover:bg-magenta/90 disabled:opacity-60"
                >
                  {busy ? "Verifying…" : "Reveal"}
                </button>
                <button
                  onClick={hide}
                  className="rounded-full border border-beige bg-white px-4 py-1.5 text-xs font-semibold text-navy/60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="mb-0.5 text-xs uppercase tracking-wider text-navy/55">
        {label}
      </p>
      <p className={`text-navy ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}

function PricingCard({
  clinicId,
  pricing,
  catalog,
  customItems,
  pending,
  run,
  refresh,
}: {
  clinicId: number;
  pricing: { tier: Tier; discountPct: number; notes: string };
  catalog: CatalogRow[];
  customItems: PriceItemView[];
  pending: boolean;
  run: (fn: () => void) => void;
  refresh: () => void;
}) {
  const [tier, setTier] = useState<Tier>(pricing.tier);
  const [discount, setDiscount] = useState(String(pricing.discountPct));
  const [notes, setNotes] = useState(pricing.notes);
  const [saved, setSaved] = useState(false);

  // Ad-hoc custom line-item form (for products not in the catalog).
  const [product, setProduct] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");

  const overrideCount = catalog.filter((c) => c.overrideCents !== null).length;

  // Group catalog rows by their first product family (contiguous in the data).
  const groups: { family: string; rows: CatalogRow[] }[] = [];
  for (const row of catalog) {
    const last = groups[groups.length - 1];
    if (last && last.family === row.family) last.rows.push(row);
    else groups.push({ family: row.family, rows: [row] });
  }

  return (
    <Section title="Custom pricing">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-navy/55">
              Pricing tier
            </span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier)}
              className="rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-magenta"
            >
              {TIER_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-navy/55">
              Flat discount (%)
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-magenta"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-navy/55">
            Pricing notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Net-30 terms, negotiated bundle, etc."
            className="rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-magenta"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            disabled={pending}
            onClick={() =>
              run(async () => {
                await setClinicPricing(
                  clinicId,
                  tier,
                  Number(discount) || 0,
                  notes,
                );
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
                refresh();
              })
            }
            className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-60 ${
              saved
                ? "bg-green-600 hover:bg-green-700"
                : "bg-magenta hover:bg-magenta/90"
            }`}
          >
            {saved ? "Saved ✓" : "Save pricing"}
          </button>
        </div>

        {/* Catalog pricing sheet — every SKU at its standard price, override per clinic. */}
        <div className="border-t border-beige pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-navy/55">
              Catalog pricing
            </p>
            <p className="text-xs text-navy/45">
              {overrideCount > 0 ? `${overrideCount} custom` : "All standard"} ·{" "}
              {catalog.length} products
            </p>
          </div>
          <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-beige">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-cream/90 backdrop-blur">
                <tr className="text-left text-[11px] uppercase tracking-wider text-navy/50">
                  <th className="px-3 py-2 font-semibold">Product</th>
                  <th className="px-3 py-2 font-semibold">Standard</th>
                  <th className="px-3 py-2 font-semibold">Clinic price</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-beige">
                {groups.map((g) => (
                  <Fragment key={g.family}>
                    <tr className="bg-cream/40">
                      <td
                        colSpan={4}
                        className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy/45"
                      >
                        {g.family}
                      </td>
                    </tr>
                    {g.rows.map((row) => (
                      <CatalogPriceRow
                        key={`${row.productId}:${row.overrideCents ?? "std"}`}
                        clinicId={clinicId}
                        row={row}
                        pending={pending}
                        run={run}
                        refresh={refresh}
                      />
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-navy/45">
            Blank = clinic pays the standard catalog price. Enter a price to
            override; Reset reverts to standard.
          </p>
        </div>

        {/* Ad-hoc line items not in the catalog. */}
        <div className="border-t border-beige pt-4">
          <p className="mb-3 text-xs uppercase tracking-wider text-navy/55">
            Other line items
          </p>
          {customItems.length > 0 && (
            <div className="mb-3 flex flex-col gap-2">
              {customItems.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between rounded-lg border border-beige bg-cream/30 px-3 py-2 text-sm"
                >
                  <span className="text-navy">
                    <span className="font-medium">{it.productName}</span>{" "}
                    <span className="text-navy/60">
                      — {fmtMoney(it.priceCents)}
                      {it.unit ? ` / ${it.unit}` : ""}
                    </span>
                  </span>
                  <button
                    disabled={pending}
                    onClick={() =>
                      run(async () => {
                        await deletePriceItem(it.id);
                        refresh();
                      })
                    }
                    className="text-xs font-medium text-navy/40 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Product / service"
              className="rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-magenta"
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="Price ($)"
              className="rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-magenta"
            />
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit (opt.)"
              className="rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-magenta"
            />
            <button
              disabled={pending || !product.trim() || !price.trim()}
              onClick={() =>
                run(async () => {
                  await addPriceItem(
                    clinicId,
                    product,
                    Number(price) || 0,
                    unit,
                  );
                  setProduct("");
                  setPrice("");
                  setUnit("");
                  refresh();
                })
              }
              className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy/90 disabled:opacity-60"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function CatalogPriceRow({
  clinicId,
  row,
  pending,
  run,
  refresh,
}: {
  clinicId: number;
  row: CatalogRow;
  pending: boolean;
  run: (fn: () => void) => void;
  refresh: () => void;
}) {
  const initial =
    row.overrideCents !== null ? (row.overrideCents / 100).toFixed(2) : "";
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);

  const standardLabel =
    row.standardCents !== null ? fmtMoney(row.standardCents) : "—";
  const placeholder =
    row.standardCents !== null ? (row.standardCents / 100).toFixed(2) : "0.00";
  const hasOverride = row.overrideCents !== null;
  const trimmed = value.trim();
  const canSave = trimmed !== "" && trimmed !== initial && !pending;

  return (
    <tr className="text-navy">
      <td className="px-3 py-2">
        <div className="font-medium leading-tight">{row.name}</div>
        <div className="text-xs text-navy/45">
          {row.strength ? `${row.strength} · ` : ""}
          {row.unit}
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-navy/55">
        {standardLabel}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="text-navy/40">$</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            placeholder={placeholder}
            className={`w-20 rounded-lg border bg-white px-2 py-1 text-sm text-navy outline-none focus:border-magenta ${
              hasOverride ? "border-magenta/50" : "border-beige-dark"
            }`}
          />
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right">
        <button
          disabled={!canSave && !saved}
          onClick={() =>
            run(async () => {
              await setProductPrice(
                clinicId,
                row.productId,
                row.name,
                Number(trimmed) || 0,
                row.unit,
              );
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
              refresh();
            })
          }
          className={`rounded-full px-3 py-1 text-xs font-semibold text-white transition-colors disabled:opacity-40 ${
            saved
              ? "bg-green-600 hover:bg-green-700"
              : "bg-navy hover:bg-navy/90"
          }`}
        >
          {saved ? "Saved ✓" : "Save"}
        </button>
        {hasOverride && (
          <button
            disabled={pending}
            onClick={() =>
              run(async () => {
                await resetProductPrice(clinicId, row.productId);
                refresh();
              })
            }
            className="ml-2 text-xs font-medium text-navy/40 hover:text-red-600"
          >
            Reset
          </button>
        )}
      </td>
    </tr>
  );
}

function NotesCard({
  clinicId,
  notes,
  pending,
  run,
  refresh,
}: {
  clinicId: number;
  notes: NoteView[];
  pending: boolean;
  run: (fn: () => void) => void;
  refresh: () => void;
}) {
  const [body, setBody] = useState("");

  return (
    <Section title="Notes">
      <div className="flex flex-col gap-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Add a note about this clinic…"
          className="rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-magenta"
        />
        <div>
          <button
            disabled={pending || !body.trim()}
            onClick={() =>
              run(async () => {
                await addClinicNote(clinicId, body);
                setBody("");
                refresh();
              })
            }
            className="rounded-full bg-magenta px-4 py-1.5 text-xs font-semibold text-white hover:bg-magenta/90 disabled:opacity-60"
          >
            Add note
          </button>
        </div>

        {notes.length === 0 ? (
          <p className="text-sm text-navy/55">No notes yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((n) => (
              <li
                key={n.id}
                className="rounded-xl border border-beige bg-cream/30 p-3"
              >
                <p className="whitespace-pre-wrap text-sm text-navy">{n.body}</p>
                <p className="mt-2 text-xs text-navy/50">
                  {n.authorEmail ?? "admin"} · {fmtDate(n.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
