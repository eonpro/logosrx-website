export const dynamic = "force-dynamic";

import { getPartnerContext } from "@/lib/auth/partner";
import { bpsToPercent, formatBps } from "@/lib/partners/commission";
import { listOrgReps } from "@/lib/partners/queries";
import PartnerNoAccess from "../PartnerNoAccess";
import RepsManager from "./RepsManager";

export default async function PartnerRepsPage() {
  const ctx = await getPartnerContext();
  // Rep management is owner-only: reps don't get to see (or edit) each
  // other's rates.
  if (!ctx || ctx.kind !== "org") return <PartnerNoAccess />;

  const reps = await listOrgReps(ctx.org.id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Reps</h1>
        <p className="text-navy/70 text-sm mt-1">
          Invite reps and sub-groups under {ctx.org.name}. Each rep&rsquo;s
          rate comes out of your {formatBps(ctx.org.commissionRateBps)}{" "}
          commission. Rate changes apply to future transactions only.
        </p>
      </div>

      <RepsManager
        reps={reps.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          status: r.status,
          ratePercent: bpsToPercent(r.commissionRateBps),
          activated: r.activatedAt != null,
          clinicCount: r.clinicCount,
        }))}
        orgRatePercent={bpsToPercent(ctx.org.commissionRateBps)}
      />
    </div>
  );
}
