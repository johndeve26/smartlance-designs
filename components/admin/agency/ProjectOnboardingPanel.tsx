import Link from "next/link";
import { getActiveProjectOnboarding, loadProgressContext } from "@/lib/onboarding";
import { getProjectDeliveryReadiness } from "@/lib/onboarding/readiness";
import { ONBOARDING_STATUS_LABELS } from "@/lib/onboarding/constants";
import { AgencyBadge } from "@/components/admin/agency/AgencySubNavBar";
import { StartOnboardingForm } from "@/components/admin/agency/StartOnboardingForm";
import { ProjectReadinessPanel } from "@/components/admin/agency/ProjectReadinessPanel";
import { listOnboardingTemplates } from "@/lib/onboarding";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export async function ProjectOnboardingPanel({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  const [active, readiness, templates] = await Promise.all([
    getActiveProjectOnboarding(projectId),
    getProjectDeliveryReadiness(projectId),
    canManage ? listOnboardingTemplates() : Promise.resolve([]),
  ]);

  let progress = null;
  if (active) {
    const ctx = await loadProgressContext(active.id);
    progress = ctx.progress;
  }

  return (
    <div className="space-y-4">
      <AdminPanel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Client onboarding</h2>
            {active ? (
              <p className="mt-1 text-sm text-neutral-600">
                {ONBOARDING_STATUS_LABELS[active.status]} · {progress?.percentComplete ?? 0}% complete
              </p>
            ) : (
              <p className="mt-1 text-sm text-neutral-600">No active onboarding.</p>
            )}
          </div>
          {active ? (
            <Link href={`/admin/agency/onboarding/${active.id}`} className="admin-btn admin-btn-secondary">
              Open onboarding
            </Link>
          ) : null}
        </div>

        {active && progress ? (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <AgencyBadge>
              Questions {progress.requiredQuestionsComplete}/{progress.requiredQuestionsTotal}
            </AgencyBadge>
            <AgencyBadge>
              Requirements {progress.requiredRequirementsComplete}/{progress.requiredRequirementsTotal}
            </AgencyBadge>
            {progress.clarificationsOutstanding ? (
              <AgencyBadge tone="warning">
                {progress.clarificationsOutstanding} clarification(s)
              </AgencyBadge>
            ) : null}
            {progress.overdueRequirements ? (
              <AgencyBadge tone="danger">{progress.overdueRequirements} overdue</AgencyBadge>
            ) : null}
          </div>
        ) : null}

        {!active && canManage ? (
          <div className="mt-4">
            <StartOnboardingForm projectId={projectId} templates={templates} />
          </div>
        ) : null}
      </AdminPanel>

      <ProjectReadinessPanel projectId={projectId} readiness={readiness} canManage={canManage} />
    </div>
  );
}
