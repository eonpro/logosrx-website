"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approvePartnerOrg } from "./actions";

/**
 * Inline approve action for a pending org on the partners list. Provisions the
 * Clerk login and emails the owner an activation link (handled server-side).
 */
export default function ApproveOrgButton({ orgId }: { orgId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function approve() {
    setError("");
    startTransition(async () => {
      const res = await approvePartnerOrg(orgId);
      if (!res.ok) setError(res.error ?? "Could not approve.");
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={approve}
        disabled={pending}
        className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Approving…" : "Approve"}
      </button>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
