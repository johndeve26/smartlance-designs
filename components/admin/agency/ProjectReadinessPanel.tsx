import { updateProjectReadinessGatesAction } from "@/lib/admin/onboarding-actions";
import { AgencyBadge } from "@/components/admin/agency/AgencySubNavBar";
import type { ProjectReadiness } from "@/lib/onboarding/readiness";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export function ProjectReadinessPanel({
  projectId,
  readiness,
  canManage,
}: {
  projectId: string;
  readiness: ProjectReadiness;
  canManage: boolean;
}) {
  return (
    <AdminPanel>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Delivery readiness</h2>
        <AgencyBadge tone={readiness.overall === "ready" ? "success" : "warning"}>
          {readiness.overall === "ready" ? "Ready for delivery" : "Not ready"}
        </AgencyBadge>
      </div>
      <ul className="mt-3 divide-y text-sm">
        {readiness.gates.map((gate) => (
          <li key={gate.key} className="flex justify-between py-2">
            <span>{gate.label}</span>
            <span className="text-neutral-600">{gate.detail}</span>
          </li>
        ))}
      </ul>
      {canManage ? (
        <form action={updateProjectReadinessGatesAction} className="mt-4 space-y-2 border-t pt-4 text-sm">
          <input type="hidden" name="projectId" value={projectId} />
          <p className="font-medium">Required gates</p>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="requireOnboarding" defaultChecked />
            Require onboarding
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="requireSignedContract" />
            Require signed contract
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="requireDeposit" />
            Require deposit paid
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="requireInternalKickoff" />
            Require internal kickoff
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="internalKickoffCompleted" />
            Internal kickoff complete
          </label>
          <button type="submit" className="admin-btn admin-btn-secondary">
            Save readiness gates
          </button>
        </form>
      ) : null}
    </AdminPanel>
  );
}
