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
          className="h-7 w-36 rounded-md border border-beige bg-cream/50 px-2 text-[11px] text-navy outline-none focus:border-magenta"
        />
        <button
          type="button"
          onClick={approve}
          disabled={pending}
          className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
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
