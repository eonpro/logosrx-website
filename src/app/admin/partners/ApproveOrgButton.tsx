"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { approvePartnerOrg } from "./actions";

/**
 * Inline approve action for a pending org on the partners list. Provisions the
 * Clerk login and emails the owner an activation link (handled server-side).
 */
export default function ApproveOrgButton({ orgId }: { orgId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");

  function approve() {
    setError("");
    startTransition(async () => {
      const res = await approvePartnerOrg(orgId, password || undefined);
      if (!res.ok) setError(res.error ?? "Could not approve.");
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
          placeholder="Optional password"
          className="h-8 w-36 rounded-full border border-beige-dark bg-white px-3 text-[11px] text-navy outline-none transition-all placeholder:text-navy/35 focus:border-navy focus:ring-2 focus:ring-navy/10"
        />
        <button
          type="button"
          onClick={approve}
          disabled={pending}
          className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Approving…" : "Approve"}
        </button>
      </div>
      {error && (
        <div className="flex flex-col items-end gap-0.5 text-right">
          <span className="text-[11px] text-red-600">{error}</span>
          <Link
            href={`/admin/partners/${orgId}?edit=1`}
            className="text-[11px] font-semibold text-magenta hover:underline"
          >
            Edit contact details →
          </Link>
        </div>
      )}
    </div>
  );
}
