"use client";

import { useState, useTransition } from "react";
import { formatCents } from "@/lib/partners/commission";
import SetPasswordControl from "@/components/auth/SetPasswordControl";
import {
  approvePartnerCommission,
  approvePartnerOrg,
  recordPartnerPayout,
  resendPartnerActivation,
  setPartnerOrgCompensationModel,
  setPartnerOrgPassword,
  setPartnerOrgRate,
  setPartnerOrgStatus,
} from "../actions";

interface OrgProps {
  id: number;
  status: "pending" | "active" | "suspended";
  compensationModel: "commission" | "margin";
  ratePercent: number;
  hasAccount: boolean;
  /** Approved, payable balance (what a payout settles). */
  unpaidCents: number;
  /** Earned but not yet approved. */
  awaitingCents: number;
  /** Whether any pending entries exist to approve. */
  hasPending: boolean;
}

interface RepOption {
  id: number;
  name: string;
  unpaidCents: number;
}

const inputClass =
  "h-10 rounded-lg border border-beige bg-cream/50 px-3 text-sm text-navy outline-none focus:border-magenta";

export default function PartnerOrgManager({
  org,
  reps,
}: {
  org: OrgProps;
  reps: RepOption[];
}) {
  const [rate, setRate] = useState(String(org.ratePercent));
  const [payee, setPayee] = useState<string>("org");
  const [method, setMethod] = useState("ach");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [approvePw, setApprovePw] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function run(
    work: () => Promise<{ ok: boolean; error?: string }>,
    successMessage: string,
  ) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await work();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else setNotice(successMessage);
    });
  }

  const selectedUnpaidCents =
    payee === "org"
      ? org.unpaidCents
      : (reps.find((r) => r.id === Number(payee))?.unpaidCents ?? 0);

  return (
    <div className="rounded-2xl border border-beige bg-white p-6">
      <div className="flex flex-wrap items-center gap-3">
        {org.status === "pending" && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-navy/60">
                Initial password (optional)
              </span>
              <input
                type="text"
                value={approvePw}
                onChange={(e) => setApprovePw(e.target.value)}
                autoComplete="off"
                placeholder="Leave blank to email a link"
                className={`${inputClass} w-60`}
              />
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () => approvePartnerOrg(org.id, approvePw || undefined),
                  approvePw
                    ? "Org approved — sign-in password set."
                    : "Org approved — activation email sent.",
                )
              }
              className="h-10 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Approve application
            </button>
          </div>
        )}
        {org.status === "active" && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () => setPartnerOrgStatus(org.id, "suspended"),
                "Org suspended.",
              )
            }
            className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
          >
            Suspend
          </button>
        )}
        {org.status === "suspended" && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () => setPartnerOrgStatus(org.id, "active"),
                "Org reactivated.",
              )
            }
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Reactivate
          </button>
        )}
        {org.hasAccount && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () => resendPartnerActivation(org.id),
                "Activation email re-sent.",
              )
            }
            className="rounded-full border border-beige px-5 py-2 text-sm font-semibold text-navy/70 transition-colors hover:border-navy/30 disabled:opacity-60"
          >
            Resend activation email
          </button>
        )}

        <div className="ml-auto flex items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">
              Org commission %
            </span>
            <input
              type="number"
              min={0}
              max={100}
              step="0.25"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className={`${inputClass} w-28 text-right tabular-nums`}
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () => setPartnerOrgRate(org.id, Number(rate)),
                "Commission rate updated (applies to future transactions).",
              )
            }
            className="h-10 rounded-full bg-navy px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Save rate
          </button>
        </div>
      </div>

      {org.hasAccount && (
        <div className="mt-4 border-t border-beige pt-4">
          <SetPasswordControl
            action={(password) => setPartnerOrgPassword(org.id, password)}
          />
          <p className="mt-2 text-xs text-navy/55">
            Sets the owner&rsquo;s sign-in password immediately (no email needed).
            Use it to hand a partner working credentials or reset a forgotten one.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-beige pt-4">
        <span className="text-xs font-medium text-navy/60">
          Compensation model
        </span>
        <div className="inline-flex rounded-full border border-beige p-0.5">
          {(["commission", "margin"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={pending}
              aria-pressed={org.compensationModel === m}
              onClick={() =>
                run(
                  () => setPartnerOrgCompensationModel(org.id, m),
                  m === "margin"
                    ? "Switched to the margin (wholesale) model."
                    : "Switched to the commission (%) model.",
                )
              }
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                org.compensationModel === m
                  ? "bg-navy text-white"
                  : "text-navy/60 hover:text-navy"
              }`}
            >
              {m === "commission" ? "Commission (%)" : "Margin (wholesale)"}
            </button>
          ))}
        </div>
        <span className="text-xs text-navy/55">
          {org.compensationModel === "margin"
            ? "Earns the spread above the per-product floors set below."
            : "Earns a % of each attributed sale."}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-beige pt-4">
        <span className="text-xs font-medium text-navy/60">
          Commission approval
        </span>
        <span className="text-xs text-navy/55">
          {org.awaitingCents > 0
            ? `${formatCents(org.awaitingCents)} earned and awaiting approval before it's payable.`
            : "Nothing awaiting approval."}
        </span>
        {org.hasPending && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () => approvePartnerCommission(org.id),
                "Pending commission approved — now payable.",
              )
            }
            className="rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Approve all pending
          </button>
        )}
      </div>

      <div className="mt-6 border-t border-beige pt-6">
        <h3 className="text-sm font-semibold text-navy">Record a payout</h3>
        <p className="mt-1 text-xs text-navy/60">
          Pays out the payee&rsquo;s approved (payable) balance and marks the
          covered commission entries as paid. Clawbacks net against it.
        </p>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () =>
                recordPartnerPayout({
                  orgId: org.id,
                  repId: payee === "org" ? null : Number(payee),
                  method,
                  reference,
                  notes,
                }),
              "Payout recorded.",
            );
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">Pay to</span>
            <select
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className={`${inputClass} w-64`}
            >
              <option value="org">
                Organization — {formatCents(org.unpaidCents)} payable
              </option>
              {reps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name} — {formatCents(rep.unpaidCents)} payable
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">Method</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={`${inputClass} w-32`}
            >
              <option value="ach">ACH</option>
              <option value="check">Check</option>
              <option value="wire">Wire</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">
              Reference (optional)
            </span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Check # / trace id"
              maxLength={200}
              className={`${inputClass} w-48`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">
              Notes (optional)
            </span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={4000}
              className={`${inputClass} w-56`}
            />
          </label>
          <button
            type="submit"
            disabled={pending || selectedUnpaidCents <= 0}
            className="h-10 rounded-full bg-magenta px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending
              ? "Working…"
              : `Pay ${formatCents(selectedUnpaidCents)}`}
          </button>
        </form>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 text-sm text-emerald-700">
          {notice}
        </p>
      )}
    </div>
  );
}
