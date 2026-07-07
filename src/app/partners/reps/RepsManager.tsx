"use client";

import { Fragment, useState, useTransition } from "react";
import SetPasswordControl from "@/components/auth/SetPasswordControl";
import {
  Badge,
  EmptyState,
  btnAccent,
  btnGhost,
  tableWrapClass,
  theadClass,
  rowClass,
} from "@/components/ui/portal";
import {
  inviteRep,
  resendRepInvite,
  setRepPassword,
  setRepRate,
  setRepStatus,
} from "./actions";

interface RepRow {
  id: number;
  name: string;
  email: string;
  status: "pending" | "active" | "suspended";
  ratePercent: number;
  activated: boolean;
  clinicCount: number;
}

const inputClass =
  "h-10 rounded-full border border-beige-dark bg-white px-4 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-navy focus:ring-2 focus:ring-navy/10";

export default function RepsManager({
  reps,
  orgRatePercent,
}: {
  reps: RepRow[];
  orgRatePercent: number;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rate, setRate] = useState("");
  const [invitePw, setInvitePw] = useState("");
  const [pwForId, setPwForId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function invite() {
    setError("");
    setNotice("");
    if (rate.trim() === "") {
      setError("Enter a commission rate (percent).");
      return;
    }
    const ratePercent = Number(rate);
    if (!Number.isFinite(ratePercent)) {
      setError("Enter a valid commission rate (percent).");
      return;
    }
    startTransition(async () => {
      const res = await inviteRep({
        name,
        email,
        phone,
        ratePercent,
        password: invitePw || undefined,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not invite the rep.");
        return;
      }
      setName("");
      setEmail("");
      setPhone("");
      setRate("");
      setInvitePw("");
      setNotice(
        invitePw
          ? "Rep added — they can sign in with the password you set."
          : "Invite sent — the rep will receive an activation email.",
      );
    });
  }

  function updateRate(repId: number, raw: string) {
    const ratePercent = Number(raw);
    if (!Number.isFinite(ratePercent)) return;
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await setRepRate(repId, ratePercent);
      if (!res.ok) setError(res.error ?? "Could not update the rate.");
    });
  }

  function toggleStatus(rep: RepRow) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await setRepStatus(
        rep.id,
        rep.status === "suspended" ? "active" : "suspended",
      );
      if (!res.ok) setError(res.error ?? "Could not update the rep.");
    });
  }

  function resend(repId: number) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await resendRepInvite(repId);
      if (!res.ok) setError(res.error ?? "Could not re-send the invite.");
      else setNotice("Activation email re-sent.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Invite a rep
        </h2>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            invite();
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">Name</span>
            <input
              className={`${inputClass} w-48`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Johnson"
              maxLength={200}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">Email</span>
            <input
              className={`${inputClass} w-60`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              maxLength={255}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">Phone</span>
            <input
              className={`${inputClass} w-40`}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              maxLength={30}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">
              Commission % (max {orgRatePercent}%)
            </span>
            <input
              className={`${inputClass} w-36`}
              type="number"
              min={0}
              max={orgRatePercent}
              step="0.25"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 5"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">
              Password (optional)
            </span>
            <input
              className={`${inputClass} w-48`}
              type="text"
              value={invitePw}
              onChange={(e) => setInvitePw(e.target.value)}
              placeholder="Leave blank to email a link"
              autoComplete="off"
              maxLength={100}
            />
          </label>
          <button type="submit" disabled={pending} className={btnAccent}>
            {pending ? "Working…" : "Send invite"}
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-3 text-sm text-emerald-700">
            {notice}
          </p>
        )}
      </div>

      {reps.length === 0 ? (
        <div className="rounded-3xl border border-beige/70 bg-white shadow-soft">
          <EmptyState
            title="No reps yet"
            body="Invite your first rep above — they'll get their own referral links and commission tracking."
          />
        </div>
      ) : (
        <div className={`overflow-x-auto ${tableWrapClass}`}>
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="px-5 py-4 font-semibold">Rep</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold text-right">Clinics</th>
                <th className="px-5 py-4 font-semibold text-right">
                  Commission %
                </th>
                <th className="px-5 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-navy">
              {reps.map((rep) => (
                <Fragment key={rep.id}>
                <tr
                  className={`${rowClass} ${rep.status === "suspended" ? "opacity-50" : ""}`}
                >
                  <td className="px-5 py-4">
                    <span className="font-medium">{rep.name}</span>
                    <span className="block text-xs text-navy/55">
                      {rep.email}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      tone={
                        rep.status === "active"
                          ? rep.activated
                            ? "success"
                            : "warning"
                          : "neutral"
                      }
                    >
                      {rep.status === "active" && !rep.activated
                        ? "Invited"
                        : rep.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {rep.clinicCount}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <input
                      type="number"
                      min={0}
                      max={orgRatePercent}
                      step="0.25"
                      aria-label={`Commission percent for ${rep.name}`}
                      defaultValue={rep.ratePercent}
                      onBlur={(e) => {
                        if (e.target.value.trim() === "") return;
                        const next = Number(e.target.value);
                        if (Number.isFinite(next) && next !== rep.ratePercent) {
                          updateRate(rep.id, e.target.value);
                        }
                      }}
                      className="h-9 w-24 rounded-full border border-beige-dark bg-white px-3 text-right text-sm tabular-nums text-navy outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                    />
                  </td>
                  <td className="px-5 py-4 text-right text-xs font-medium whitespace-nowrap">
                    {!rep.activated && rep.status === "active" && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => resend(rep.id)}
                        className={btnGhost}
                      >
                        Resend invite
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        setPwForId((cur) => (cur === rep.id ? null : rep.id))
                      }
                      className={btnGhost}
                    >
                      {pwForId === rep.id ? "Cancel" : "Set password"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggleStatus(rep)}
                      className={btnGhost}
                    >
                      {rep.status === "suspended" ? "Reactivate" : "Suspend"}
                    </button>
                  </td>
                </tr>
                {pwForId === rep.id && (
                  <tr>
                    <td colSpan={5} className="bg-cream/40 px-5 py-4">
                      <SetPasswordControl
                        action={(password) => setRepPassword(rep.id, password)}
                      />
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
