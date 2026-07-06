export const dynamic = "force-dynamic";

import { getPartnerContext } from "@/lib/auth/partner";
import { roleAtLeast } from "@/lib/auth/partner-roles";
import { getAllGoalProgress } from "@/lib/partners/goals";
import { listOrgReps } from "@/lib/partners/queries";
import PartnerNoAccess from "../PartnerNoAccess";
import GoalsManager from "./GoalsManager";

export default async function PartnerGoalsPage() {
  const ctx = await getPartnerContext();
  // Goal management is org admin+ only (matches the nav's adminOnly flag and
  // the setGoal/deleteGoal actions); viewers don't get the management UI.
  if (!ctx || ctx.kind !== "org" || !roleAtLeast(ctx.role, "admin")) {
    return <PartnerNoAccess />;
  }

  const [goals, reps] = await Promise.all([
    getAllGoalProgress(ctx),
    listOrgReps(ctx.org.id),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Goals &amp; Quotas</h1>
        <p className="text-navy/70 text-sm mt-1">
          Set revenue or commission targets for your organization or individual
          reps. Progress tracks the current period&rsquo;s attributed actuals.
        </p>
      </div>

      <GoalsManager
        goals={goals}
        reps={reps.map((r) => ({ id: r.id, name: r.name }))}
      />
    </div>
  );
}
