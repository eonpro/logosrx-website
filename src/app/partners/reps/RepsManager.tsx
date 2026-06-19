"use client";

import { useState, useTransition } from "react";
import {
  inviteRep,
  resendRepInvite,
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
  "h-10 rounded-lg border border-beige bg-cream/50 px-3 text-sm text-navy outline-none focus:border-magenta";

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
      const res = await inviteRep({ name, email, phone, ratePercent });
      if (!res.ok) {
        setError(res.error ?? "Could not invite the rep.");
        return;
      }
      setName("");
      setEmail("");
      setPhone("");
      setRate("");
      setNotice("Invite sent — the rep will receive an activation email.");
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
      <div className="rounded-2xl border border-beige bg-white p-6">
        <h2 className="text-sm font-semibold text-navy">Invite a rep</h2>
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
          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-full bg-magenta px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
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
        <div className="rounded-2xl bg-white border border-beige p-12 text-center">
          <p className="text-navy/65 text-sm">
            No reps yet. Invite your first rep above — they&rsquo;ll get their
            own referral links and commission tracking.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
              <tr>
                <th className="px-5 py-3 font-semibold">Rep</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Clinics</th>
                <th className="px-5 py-3 font-semibold text-right">
                  Commission %
                </th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {reps.map((rep) => (
                <tr
                  key={rep.id}
                  className={rep.status === "suspended" ? "opacity-50" : ""}
                >
                  <td className="px-5 py-3">
                    <span className="font-medium">{rep.name}</span>
                    <span className="block text-xs text-navy/55">
                      {rep.email}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        rep.status === "active"
                          ? rep.activated
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {rep.status === "active" && !rep.activated
                        ? "Invited"
                        : rep.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {rep.clinicCount}
                  </td>
                  <td className="px-5 py-3 text-right">
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
                      className="h-9 w-24 rounded-lg border border-beige bg-cream/50 px-2 text-right text-sm tabular-nums text-navy outline-none focus:border-magenta"
                    />
                  </td>
                  <td className="px-5 py-3 text-right text-xs font-medium">
                    {!rep.activated && rep.status === "active" && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => resend(rep.id)}
                        className="mr-3 text-navy/60 hover:text-magenta disabled:opacity-50"
                      >
                        Resend invite
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggleStatus(rep)}
                      className="text-navy/60 hover:text-magenta disabled:opacity-50"
                    >
                      {rep.status === "suspended" ? "Reactivate" : "Suspend"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
