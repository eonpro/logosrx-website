"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import SetPasswordControl from "@/components/auth/SetPasswordControl";
import {
  addClinicNote,
  addPriceItem,
  createCardUpdateLink,
  deletePriceItem,
  resendClinicActivation,
  resetProductPrice,
  revealCard,
  revokeCardUpdateLink,
  setClinicLifeFile,
  setClinicPassword,
  setClinicPricing,
  setClinicVerification,
  setProductPrice,
  type RevealCardResult,
} from "../actions";
import { LIFEFILE_SHIPPING_SERVICES } from "@/lib/lifefile/constants";
import {
  cardClass,
  inputClass,
  selectClass,
} from "@/components/ui/portal";

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

interface CardLinkView {
  status: "active" | "used" | "revoked" | "expired";
  /** Public URL — only set while the link is still openable. */
  url: string | null;
  expiresAt: string | null;
  usedAt: string | null;
  viewedAt: string | null;
  createdAt: string;
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

interface LifeFileView {
  enabled: boolean;
  practiceId: number | null;
  defaultServiceId: number | null;
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
    <div className={`${cardClass} p-6`}>
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
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
  canActivate,
  hasCard,
  cardLast4,
  cardLink,
  pricing,
  lifefile,
  catalog,
  customItems,
  notes,
}: {
  clinicId: number;
  status: Status;
  /** True when the clinic has both an account and a contact email to email. */
  canActivate: boolean;
  hasCard: boolean;
  cardLast4: string | null;
  cardLink: CardLinkView | null;
  pricing: { tier: Tier; discountPct: number; notes: string };
  lifefile: LifeFileView;
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
        canActivate={canActivate}
        pending={pending}
        run={(fn) => startTransition(fn)}
        refresh={() => router.refresh()}
      />
      <CardReveal
        clinicId={clinicId}
        hasCard={hasCard}
        cardLast4={cardLast4}
        cardLink={cardLink}
      />
      <LifeFileCard clinicId={clinicId} lifefile={lifefile} />
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

/**
 * The current status renders as a filled, semantically-colored state panel
 * (green when verified — the happy end-state deserves celebration, not a
 * grayed-out button). The remaining statuses render below as outline actions.
 */
const STATUS_PANEL: Record<
  Status,
  { title: string; body: string; panel: string; iconBg: string }
> = {
  verified: {
    title: "This clinic is verified",
    body: "Their provider portal is live and they can order at their assigned pricing.",
    panel: "bg-emerald-600 text-white",
    iconBg: "bg-white/20 text-white",
  },
  rejected: {
    title: "This clinic was rejected",
    body: "They cannot access the provider portal. You can re-verify at any time.",
    panel: "bg-red-600 text-white",
    iconBg: "bg-white/20 text-white",
  },
  pending: {
    title: "Awaiting verification",
    body: "Review the intake details, then verify or reject this clinic.",
    panel: "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-600/25",
    iconBg: "bg-amber-500/15 text-amber-700",
  },
};

function StatusIcon({ status }: { status: Status }) {
  if (status === "verified") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3.5 9.5L7 13l7.5-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "rejected") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 5l8 8M13 5l-8 8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="9" r="6.5" />
      <path d="M9 5.5V9l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VerificationCard({
  clinicId,
  status,
  canActivate,
  pending,
  run,
  refresh,
}: {
  clinicId: number;
  status: Status;
  canActivate: boolean;
  pending: boolean;
  run: (fn: () => void) => void;
  refresh: () => void;
}) {
  const meta = STATUS_PANEL[status];
  return (
    <Section title="Verification">
      <div className={`flex items-start gap-3.5 rounded-2xl p-5 ${meta.panel}`}>
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.iconBg}`}
        >
          <StatusIcon status={status} />
        </span>
        <div>
          <p className="font-display text-lg font-medium leading-snug">
            {meta.title}
          </p>
          <p
            className={`mt-1 text-[13px] leading-relaxed ${
              status === "pending" ? "text-amber-900/70" : "text-white/75"
            }`}
          >
            {meta.body}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Change status
        </span>
        {STATUS_OPTIONS.filter((s) => s !== status).map((s) => (
          <button
            key={s}
            disabled={pending}
            onClick={() =>
              run(async () => {
                await setClinicVerification(clinicId, s);
                refresh();
              })
            }
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${
              s === "verified"
                ? "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                : s === "rejected"
                  ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
                  : "border border-beige-dark bg-white text-navy/60 hover:border-navy/40 hover:text-navy"
            }`}
          >
            {s === "verified" ? "Verify" : s === "rejected" ? "Reject" : "Mark pending"}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-navy/55">
        Approving a clinic emails them their approval and posts to Slack.
      </p>
      <ResendActivation clinicId={clinicId} canActivate={canActivate} />
    </Section>
  );
}

function ResendActivation({
  clinicId,
  canActivate,
}: {
  clinicId: number;
  canActivate: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await resendClinicActivation(clinicId);
      setMsg(
        res.ok
          ? { ok: true, text: "Activation email sent." }
          : { ok: false, text: res.error ?? "Could not send activation email." },
      );
    } catch {
      setMsg({ ok: false, text: "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-beige pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={busy || !canActivate}
          onClick={send}
          className="rounded-full border border-beige-dark bg-white px-4 py-1.5 text-xs font-semibold text-navy transition-all hover:border-navy/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Sending…" : "Resend activation link"}
        </button>
        {msg && (
          <span
            className={`text-xs font-medium ${
              msg.ok ? "text-green-600" : "text-red-600"
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-navy/50">
        {canActivate
          ? "Emails the clinic a fresh one-time link to set their password and sign in. Doesn't change verification status."
          : "Needs a contact email and an account on file to send an activation link."}
      </p>
      {canActivate && (
        <div className="mt-4 border-t border-beige pt-4">
          <SetPasswordControl
            action={(password) => setClinicPassword(clinicId, password)}
          />
          <p className="mt-2 text-xs text-navy/50">
            Sets the clinic&rsquo;s sign-in password immediately (no email needed)
            — useful if they were rep-onboarded and never set one.
          </p>
        </div>
      )}
    </div>
  );
}

function CardReveal({
  clinicId,
  hasCard,
  cardLast4,
  cardLink,
}: {
  clinicId: number;
  hasCard: boolean;
  cardLast4: string | null;
  cardLink: CardLinkView | null;
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
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm md:grid-cols-3">
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
              className="rounded-full bg-plum px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-plum-deep active:scale-[0.98]"
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
                className="rounded-full border border-beige-dark bg-white px-4 py-1.5 text-xs font-semibold text-navy transition-all hover:border-navy/40"
              >
                Reveal full card
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-2xl border border-beige/70 bg-cream/50 p-4">
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
                className={inputClass}
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={submit}
                  disabled={busy}
                  className="rounded-full bg-plum px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-plum-deep active:scale-[0.98] disabled:opacity-60"
                >
                  {busy ? "Verifying…" : "Reveal"}
                </button>
                <button
                  onClick={hide}
                  className="rounded-full border border-beige-dark bg-white px-4 py-1.5 text-xs font-semibold text-navy/60 transition-all hover:border-navy/40 hover:text-navy"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <CardUpdateLinkControl clinicId={clinicId} cardLink={cardLink} />
    </Section>
  );
}

/**
 * Generates / manages the shareable card-update link for this clinic: a
 * single-use public URL the clinic opens to re-enter their full card (same
 * fields as onboarding). Only one link is live at a time — generating a new
 * one revokes its predecessor.
 */
function CardUpdateLinkControl({
  clinicId,
  cardLink,
}: {
  clinicId: number;
  cardLink: CardLinkView | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  // Freshly minted URL — shown immediately, before the server props refresh.
  const [freshUrl, setFreshUrl] = useState<string | null>(null);

  const activeUrl = freshUrl ?? (cardLink?.status === "active" ? cardLink.url : null);

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await createCardUpdateLink(clinicId);
      if (res.ok && res.url) {
        setFreshUrl(res.url);
        router.refresh();
      } else {
        setError(res.error ?? "Could not create the link.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    setError("");
    try {
      await revokeCardUpdateLink(clinicId);
      setFreshUrl(null);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy — select and copy the link manually.");
    }
  }

  const statusLine = (() => {
    if (!cardLink || freshUrl) return null;
    if (cardLink.status === "used") {
      return `Card submitted through the last link${
        cardLink.usedAt ? ` on ${fmtDate(cardLink.usedAt)}` : ""
      }.`;
    }
    if (cardLink.status === "expired") return "The last link expired unused.";
    if (cardLink.status === "revoked") return "The last link was revoked.";
    return null;
  })();

  return (
    <div className="mt-4 border-t border-beige pt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        Card update link
      </p>

      {activeUrl ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={activeUrl}
              onFocus={(e) => e.currentTarget.select()}
              className={`${inputClass} flex-1 font-mono text-xs`}
            />
            <button
              onClick={() => copy(activeUrl)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-all active:scale-[0.98] ${
                copied
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-plum hover:bg-plum-deep"
              }`}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-navy/55">
            Single-use link — the clinic opens it (no sign-in) and enters their
            full new card.
            {cardLink?.expiresAt && !freshUrl
              ? ` Expires ${fmtDate(cardLink.expiresAt)}.`
              : " Expires in 7 days."}
            {cardLink?.viewedAt && !freshUrl
              ? ` Opened ${fmtDate(cardLink.viewedAt)}.`
              : ""}
          </p>
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={generate}
              className="rounded-full border border-beige-dark bg-white px-4 py-1.5 text-xs font-semibold text-navy transition-all hover:border-navy/40 disabled:opacity-50"
            >
              {busy ? "Working…" : "Generate new link"}
            </button>
            <button
              disabled={busy}
              onClick={revoke}
              className="rounded-full border border-red-200 bg-white px-4 py-1.5 text-xs font-semibold text-red-700 transition-all hover:bg-red-50 disabled:opacity-50"
            >
              Revoke
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {statusLine && <p className="text-xs text-navy/55">{statusLine}</p>}
          <div>
            <button
              disabled={busy}
              onClick={generate}
              className="rounded-full border border-beige-dark bg-white px-4 py-1.5 text-xs font-semibold text-navy transition-all hover:border-navy/40 disabled:opacity-50"
            >
              {busy ? "Generating…" : "Generate card update link"}
            </button>
          </div>
          <p className="text-xs text-navy/50">
            Creates a single-use link (valid 7 days) you can text or email to
            the clinic so they can securely enter a new card — same form as
            onboarding. Generating a new link revokes the previous one.
          </p>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
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
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        {label}
      </p>
      <p className={`text-navy ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}

/**
 * In-app LifeFile ordering config: enable gate, LifeFile practice id
 * (required for billing when enabled), and default shipping.
 */
function LifeFileCard({
  clinicId,
  lifefile,
}: {
  clinicId: number;
  lifefile: LifeFileView;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(lifefile.enabled);
  const [practiceId, setPracticeId] = useState(
    lifefile.practiceId ? String(lifefile.practiceId) : "",
  );
  const [serviceId, setServiceId] = useState(
    lifefile.defaultServiceId ? String(lifefile.defaultServiceId) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setClinicLifeFile(clinicId, {
        enabled,
        practiceId: practiceId.trim() ? Number(practiceId) : null,
        defaultServiceId: serviceId ? Number(serviceId) : null,
      });
      if (!result.ok) {
        setError(result.error ?? "Could not save.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <Section title="In-app ordering (LifeFile)">
      <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-beige bg-cream/50 px-5 py-4">
        <span>
          <span className="block text-sm font-semibold text-navy">
            Online prescribing enabled
          </span>
          <span className="mt-0.5 block text-[13px] text-navy/55">
            Lets this clinic place prescription orders from their dashboard —
            we forward them to LifeFile with this practice for billing.
          </span>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-plum"
        />
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            LifeFile practice ID{" "}
            <span className="normal-case tracking-normal text-plum">
              (required for billing)
            </span>
          </span>
          <input
            type="number"
            min={1}
            required={enabled}
            value={practiceId}
            onChange={(e) => setPracticeId(e.target.value)}
            placeholder="e.g. practice on network 1949"
            className={inputClass}
          />
          <span className="mt-1.5 block text-[12px] leading-snug text-navy/45">
            Stamped on every order as <code>order.practice.id</code> so LifeFile
            bills this clinic. Must be a practice under Logos Pharmacy&apos;s
            API network (1949) — not a practice ID from another LifeFile portal
            or network.
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Default shipping service
          </span>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className={selectClass}
          >
            <option value="">Account default</option>
            {LIFEFILE_SHIPPING_SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {enabled && !practiceId.trim() && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-[13px] text-amber-800 ring-1 ring-inset ring-amber-600/20">
          Add the LifeFile practice ID before enabling — without it LifeFile
          cannot bill the correct clinic.
        </p>
      )}
      {enabled && practiceId.trim() && (
        <p className="mt-3 rounded-xl bg-cream px-4 py-2.5 text-[13px] text-navy/65 ring-1 ring-inset ring-beige">
          Orders will send practice ID {practiceId.trim()} for billing, plus
          the clinic name in the memo for pharmacy ops.
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-700 ring-1 ring-inset ring-red-600/15">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={pending}
          onClick={save}
          className="rounded-full bg-plum px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-plum-deep disabled:opacity-50"
        >
          {pending ? "Saving…" : saved ? "Saved" : "Save ordering settings"}
        </button>
      </div>
    </Section>
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
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
              Pricing tier
            </span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier)}
              className={selectClass}
            >
              {TIER_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
              Flat discount (%)
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Pricing notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Net-30 terms, negotiated bundle, etc."
            className={`${inputClass} resize-none`}
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
            className={`rounded-full px-5 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 ${
              saved
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-magenta hover:bg-magenta-dark"
            }`}
          >
            {saved ? "Saved ✓" : "Save pricing"}
          </button>
        </div>

        {/* Catalog pricing sheet — every SKU at its standard price, override per clinic. */}
        <div className="border-t border-beige pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
              Catalog pricing
            </p>
            <p className="text-xs text-navy/45">
              {overrideCount > 0 ? `${overrideCount} custom` : "All standard"} ·{" "}
              {catalog.length} products
            </p>
          </div>
          <div className="max-h-[28rem] overflow-y-auto rounded-2xl border border-beige/70">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-cream/90 backdrop-blur">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/45">
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
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Other line items
          </p>
          {customItems.length > 0 && (
            <div className="mb-3 flex flex-col gap-2">
              {customItems.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between rounded-2xl border border-beige/70 bg-cream/50 px-4 py-2.5 text-sm"
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
              className={inputClass}
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="Price ($)"
              className={inputClass}
            />
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit (opt.)"
              className={inputClass}
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
              className="rounded-full bg-plum px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-plum-deep active:scale-[0.98] disabled:opacity-60"
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
            className={`w-20 rounded-2xl border bg-white px-2.5 py-1 text-sm text-navy outline-none transition-all focus:border-plum focus:ring-2 focus:ring-plum/10 ${
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
          className={`rounded-full px-3 py-1 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 ${
            saved
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-plum hover:bg-plum-deep"
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
          className={`${inputClass} resize-none`}
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
            className="rounded-full bg-plum px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-plum-deep active:scale-[0.98] disabled:opacity-60"
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
                className="rounded-2xl border border-beige/70 bg-cream/50 p-4"
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
