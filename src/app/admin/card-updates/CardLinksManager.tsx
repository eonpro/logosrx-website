"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCardUpdateLink } from "../clinics/actions";
import {
  createExternalCardUpdateLink,
  revealExternalCard,
  revokeCardUpdateLinkById,
  type RevealExternalCardResult,
} from "./actions";
import {
  Badge,
  Card,
  EmptyState,
  btnAccent,
  btnSecondary,
  inputClass,
  rowClass,
  selectClass,
  tableWrapClass,
  theadClass,
  type BadgeTone,
} from "@/components/ui/portal";

export interface CardLinkRow {
  id: number;
  /** Null for external (non-portal) clinics. */
  clinicId: number | null;
  external: boolean;
  clinicName: string;
  contactEmail: string | null;
  status: "active" | "used" | "revoked" | "expired";
  /** Public URL — only set while the link is still openable. */
  url: string | null;
  /** Last 4 of the submitted card (used rows only). */
  cardLast4: string | null;
  createdAt: string;
  createdByEmail: string | null;
  expiresAt: string | null;
  viewedAt: string | null;
  usedAt: string | null;
}

const STATUS_BADGE: Record<
  CardLinkRow["status"],
  { text: string; tone: BadgeTone }
> = {
  active: { text: "Active", tone: "accent" },
  used: { text: "Submitted", tone: "success" },
  expired: { text: "Expired", tone: "warning" },
  revoked: { text: "Revoked", tone: "neutral" },
};

function fmtDate(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
}

type RecipientKind = "portal" | "external";

export default function CardLinksManager({
  rows,
  clinicOptions,
  canEdit,
}: {
  rows: CardLinkRow[];
  clinicOptions: { id: number; name: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<RecipientKind>("portal");
  const [clinicId, setClinicId] = useState("");
  const [externalName, setExternalName] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Freshly minted link, shown prominently until the admin dismisses it.
  const [fresh, setFresh] = useState<{ clinicName: string; url: string } | null>(
    null,
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const clinicNameById = useMemo(
    () => new Map(clinicOptions.map((c) => [String(c.id), c.name])),
    [clinicOptions],
  );

  async function generate() {
    setBusy(true);
    setError("");
    try {
      if (kind === "portal") {
        const id = Number(clinicId);
        if (!id) {
          setError("Pick a clinic first.");
          return;
        }
        const res = await createCardUpdateLink(id);
        if (res.ok && res.url) {
          setFresh({
            clinicName: clinicNameById.get(clinicId) ?? "Clinic",
            url: res.url,
          });
          router.refresh();
        } else {
          setError(res.error ?? "Could not create the link.");
        }
      } else {
        if (!externalName.trim()) {
          setError("Enter the clinic's name.");
          return;
        }
        const res = await createExternalCardUpdateLink(
          externalName,
          externalEmail,
        );
        if (res.ok && res.url) {
          setFresh({ clinicName: externalName.trim(), url: res.url });
          setExternalName("");
          setExternalEmail("");
          router.refresh();
        } else {
          setError(res.error ?? "Could not create the link.");
        }
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(row: CardLinkRow) {
    setBusy(true);
    setError("");
    try {
      const res = await revokeCardUpdateLinkById(row.id);
      if (!res.ok) {
        setError(res.error ?? "Could not revoke the link.");
        return;
      }
      if (fresh?.url === row.url) setFresh(null);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(key: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setError("Could not copy — select and copy the link manually.");
    }
  }

  const canGenerate =
    kind === "portal" ? Boolean(clinicId) : Boolean(externalName.trim());

  return (
    <div className="flex flex-col gap-6">
      {canEdit && (
        <Card>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
            Generate a link
          </p>

          <div className="mb-4 inline-flex rounded-full border border-beige-dark bg-cream/60 p-1">
            {(
              [
                { value: "portal", label: "Portal clinic" },
                { value: "external", label: "Not on the portal" },
              ] as { value: RecipientKind; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setKind(opt.value);
                  setError("");
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  kind === opt.value
                    ? "bg-plum text-white"
                    : "text-navy/60 hover:text-navy"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {kind === "portal" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                className={`${selectClass} sm:max-w-sm ${
                  clinicId ? "text-navy" : "text-navy/40"
                }`}
              >
                <option value="" disabled>
                  Choose a clinic…
                </option>
                {clinicOptions.map((c) => (
                  <option key={c.id} value={c.id} className="text-navy">
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                disabled={busy || !canGenerate}
                onClick={generate}
                className={btnAccent}
              >
                {busy ? "Generating…" : "Generate link"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={externalName}
                onChange={(e) => setExternalName(e.target.value)}
                placeholder="Clinic name"
                className={`${inputClass} sm:max-w-xs`}
              />
              <input
                value={externalEmail}
                onChange={(e) => setExternalEmail(e.target.value)}
                type="email"
                placeholder="Contact email (optional)"
                className={`${inputClass} sm:max-w-xs`}
              />
              <button
                disabled={busy || !canGenerate}
                onClick={generate}
                className={btnAccent}
              >
                {busy ? "Generating…" : "Generate link"}
              </button>
            </div>
          )}

          <p className="mt-2 text-xs text-navy/50">
            {kind === "portal"
              ? "Single-use, valid 7 days. Generating a new link for a clinic revokes their previous one; the submitted card lands on the clinic's page."
              : "Single-use, valid 7 days. For clinics without a portal account — the submitted card is stored securely and revealed right here."}
          </p>

          {fresh && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-2 text-xs font-semibold text-emerald-800">
                Link ready for {fresh.clinicName} — copy and send it:
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={fresh.url}
                  onFocus={(e) => e.currentTarget.select()}
                  className={`${inputClass} flex-1 font-mono text-xs`}
                />
                <button
                  onClick={() => copy("fresh", fresh.url)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98] ${
                    copiedKey === "fresh"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-plum hover:bg-plum-deep"
                  }`}
                >
                  {copiedKey === "fresh" ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>
          )}
          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </Card>
      )}

      {rows.length === 0 ? (
        <Card pad={false}>
          <EmptyState
            title="No card update links yet"
            body="Generate one above to send a clinic a secure link for entering a new payment card."
          />
        </Card>
      ) : (
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Clinic</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Created</th>
                <th className="px-5 py-4 font-semibold">Expires</th>
                <th className="px-5 py-4 font-semibold">Opened</th>
                <th className="px-5 py-4 font-semibold">Submitted</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <LinkRow
                  key={row.id}
                  row={row}
                  canEdit={canEdit}
                  busy={busy}
                  copiedKey={copiedKey}
                  onCopy={copy}
                  onRevoke={revoke}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LinkRow({
  row,
  canEdit,
  busy,
  copiedKey,
  onCopy,
  onRevoke,
}: {
  row: CardLinkRow;
  canEdit: boolean;
  busy: boolean;
  copiedKey: string | null;
  onCopy: (key: string, url: string) => void;
  onRevoke: (row: CardLinkRow) => void;
}) {
  const badge = STATUS_BADGE[row.status];
  const key = String(row.id);

  // External card reveal (step-up password gate).
  const [revealOpen, setRevealOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [revealError, setRevealError] = useState("");
  const [revealBusy, setRevealBusy] = useState(false);
  const [card, setCard] = useState<RevealExternalCardResult["card"] | null>(
    null,
  );

  async function reveal() {
    setRevealBusy(true);
    setRevealError("");
    try {
      const res = await revealExternalCard(row.id, password);
      if (!res.ok) {
        setRevealError(res.error ?? "Could not reveal the card.");
      } else {
        setCard(res.card ?? null);
        setRevealOpen(false);
        setPassword("");
      }
    } catch {
      setRevealError("Something went wrong.");
    } finally {
      setRevealBusy(false);
    }
  }

  function hideCard() {
    setCard(null);
    setRevealOpen(false);
    setPassword("");
    setRevealError("");
  }

  const clinicCell = (
    <>
      <div className="font-medium text-navy">{row.clinicName}</div>
      <div className="text-xs text-navy/50">
        {row.external && (
          <span className="mr-1.5 inline-flex rounded-full bg-navy/[0.06] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-navy/55 ring-1 ring-inset ring-navy/10">
            Not on portal
          </span>
        )}
        {row.contactEmail}
      </div>
    </>
  );

  return (
    <Fragment>
      <tr className={rowClass}>
        <td className="px-5 py-4">
          {row.clinicId ? (
            <Link href={`/admin/clinics/${row.clinicId}`} className="block">
              {clinicCell}
            </Link>
          ) : (
            clinicCell
          )}
        </td>
        <td className="px-5 py-4">
          <Badge tone={badge.tone}>{badge.text}</Badge>
          {row.cardLast4 && (
            <div className="mt-1 text-xs text-navy/55">
              New card •••• {row.cardLast4}
            </div>
          )}
        </td>
        <td className="px-5 py-4 text-navy/60">
          <div>{fmtDate(row.createdAt)}</div>
          {row.createdByEmail && (
            <div className="text-xs text-navy/45">{row.createdByEmail}</div>
          )}
        </td>
        <td className="px-5 py-4 text-navy/60">{fmtDate(row.expiresAt)}</td>
        <td className="px-5 py-4 text-navy/60">{fmtDate(row.viewedAt)}</td>
        <td className="px-5 py-4 text-navy/60">{fmtDate(row.usedAt)}</td>
        <td className="whitespace-nowrap px-5 py-4 text-right">
          {row.status === "used" &&
            (row.clinicId ? (
              <Link
                href={`/admin/clinics/${row.clinicId}`}
                className={`${btnSecondary} !px-4 !py-1.5 !text-xs`}
              >
                View card
              </Link>
            ) : canEdit ? (
              card ? (
                <button
                  onClick={hideCard}
                  className="rounded-full bg-plum px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-plum-deep active:scale-[0.98]"
                >
                  Hide card
                </button>
              ) : (
                <button
                  onClick={() => setRevealOpen((v) => !v)}
                  className={`${btnSecondary} !px-4 !py-1.5 !text-xs`}
                >
                  Reveal card
                </button>
              )
            ) : null)}
          {row.status === "active" && row.url && canEdit && (
            <span className="inline-flex items-center gap-2">
              <button
                onClick={() => onCopy(key, row.url!)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-all active:scale-[0.98] ${
                  copiedKey === key
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-plum hover:bg-plum-deep"
                }`}
              >
                {copiedKey === key ? "Copied ✓" : "Copy link"}
              </button>
              <button
                disabled={busy}
                onClick={() => onRevoke(row)}
                className="text-xs font-medium text-navy/40 transition-colors hover:text-red-600 disabled:opacity-50"
              >
                Revoke
              </button>
            </span>
          )}
        </td>
      </tr>

      {revealOpen && !card && (
        <tr className="border-b border-beige/60 bg-cream/40 last:border-0">
          <td colSpan={7} className="px-5 py-4">
            <div className="flex flex-col gap-2 sm:max-w-md">
              <p className="text-xs text-navy/65">
                Re-enter your admin password to view the card submitted by{" "}
                <span className="font-semibold">{row.clinicName}</span>. This
                access is logged.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && reveal()}
                  placeholder="Your admin password"
                  className={inputClass}
                />
                <button
                  onClick={reveal}
                  disabled={revealBusy}
                  className="shrink-0 rounded-full bg-plum px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-plum-deep active:scale-[0.98] disabled:opacity-60"
                >
                  {revealBusy ? "Verifying…" : "Reveal"}
                </button>
                <button
                  onClick={hideCard}
                  className="shrink-0 rounded-full border border-beige-dark bg-white px-4 py-1.5 text-xs font-semibold text-navy/60 transition-all hover:border-navy/40 hover:text-navy"
                >
                  Cancel
                </button>
              </div>
              {revealError && (
                <p className="text-xs text-red-600">{revealError}</p>
              )}
            </div>
          </td>
        </tr>
      )}

      {card && (
        <tr className="border-b border-beige/60 last:border-0">
          <td colSpan={7} className="px-5 py-4">
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm md:grid-cols-4">
              <CardDetail label="Cardholder" value={card.cardholderName} />
              <CardDetail label="Card number" value={card.cardNumber} mono />
              <CardDetail label="CVV" value={card.cvv} mono />
              <CardDetail label="Type" value={card.cardType} />
              <CardDetail label="Expires" value={card.expiration} />
              <CardDetail label="Billing zip" value={card.billingZip} />
              <CardDetail label="Billing address" value={card.billingAddress} />
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function CardDetail({
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
