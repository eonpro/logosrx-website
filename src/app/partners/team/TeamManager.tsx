"use client";

import { Fragment, useState, useTransition } from "react";
import SetPasswordControl from "@/components/auth/SetPasswordControl";
import {
  inviteMember,
  removeMember,
  resendMemberInvite,
  setMemberPassword,
  setMemberRole,
} from "./actions";

interface MemberRow {
  id: number;
  name: string;
  email: string;
  role: "admin" | "viewer";
  status: "pending" | "active" | "suspended";
  activated: boolean;
}

const inputClass =
  "h-10 rounded-lg border border-beige bg-cream/50 px-3 text-sm text-navy outline-none focus:border-magenta";

export default function TeamManager({
  owner,
  members,
}: {
  owner: { name: string; email: string | null };
  members: MemberRow[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [invitePw, setInvitePw] = useState("");
  const [pwForId, setPwForId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function run(
    work: () => Promise<{ ok: boolean; error?: string }>,
    okMsg?: string,
    onOk?: () => void,
  ) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await work();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else {
        onOk?.();
        if (okMsg) setNotice(okMsg);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-beige bg-white p-6">
        <h2 className="text-sm font-semibold text-navy">Invite a teammate</h2>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () =>
                inviteMember({
                  name,
                  email,
                  role,
                  password: invitePw || undefined,
                }),
              invitePw
                ? "Teammate added — they can sign in with the password you set."
                : "Invite sent.",
              () => {
                setName("");
                setEmail("");
                setRole("viewer");
                setInvitePw("");
              },
            );
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">Name</span>
            <input
              className={`${inputClass} w-48`}
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              maxLength={255}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-navy/60">Role</span>
            <select
              className={`${inputClass} w-36`}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="viewer">Viewer (read-only)</option>
              <option value="admin">Admin (manage)</option>
            </select>
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

      <div className="overflow-x-auto rounded-2xl border border-beige bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-cream/60 text-xs uppercase tracking-wide text-navy/55">
            <tr>
              <th className="px-5 py-3 font-semibold">Member</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-beige text-navy">
            <tr className="bg-cream/30">
              <td className="px-5 py-3">
                <span className="font-medium">{owner.name}</span>
                <span className="block text-xs text-navy/55">
                  {owner.email ?? "—"}
                </span>
              </td>
              <td className="px-5 py-3">
                <span className="inline-flex rounded-full bg-navy px-2.5 py-0.5 text-xs font-semibold text-white">
                  Owner
                </span>
              </td>
              <td className="px-5 py-3 capitalize">active</td>
              <td className="px-5 py-3 text-right text-xs text-navy/40">—</td>
            </tr>
            {members.map((m) => (
              <Fragment key={m.id}>
              <tr className={m.status === "suspended" ? "opacity-50" : ""}>
                <td className="px-5 py-3">
                  <span className="font-medium">{m.name}</span>
                  <span className="block text-xs text-navy/55">{m.email}</span>
                </td>
                <td className="px-5 py-3">
                  <select
                    value={m.role}
                    disabled={pending}
                    onChange={(e) =>
                      run(() => setMemberRole(m.id, e.target.value))
                    }
                    className="h-8 rounded-lg border border-beige bg-cream/50 px-2 text-xs text-navy outline-none focus:border-magenta disabled:opacity-50"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      m.activated
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {m.activated ? "Active" : "Invited"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-xs font-medium">
                  {!m.activated && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() => resendMemberInvite(m.id), "Invite re-sent.")
                      }
                      className="mr-3 text-navy/60 hover:text-magenta disabled:opacity-50"
                    >
                      Resend
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      setPwForId((cur) => (cur === m.id ? null : m.id))
                    }
                    className="mr-3 text-navy/60 hover:text-magenta disabled:opacity-50"
                  >
                    {pwForId === m.id ? "Cancel" : "Set password"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => removeMember(m.id))}
                    className="text-navy/60 hover:text-red-600 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
              {pwForId === m.id && (
                <tr>
                  <td colSpan={4} className="bg-cream/40 px-5 py-4">
                    <SetPasswordControl
                      action={(password) => setMemberPassword(m.id, password)}
                    />
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
