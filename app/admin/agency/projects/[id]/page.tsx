import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getProjectAdminDetail } from "@/lib/agency/projects";
import {
  AGENCY_PROJECT_HEALTH_LABELS,
  AGENCY_SERVICE_TYPE_LABELS,
} from "@/lib/agency/constants";
import { listContracts } from "@/lib/contracts/contracts";
import { ProjectDetailPanels } from "@/components/admin/agency/ProjectDetailPanels";
import { ProjectBillingPanel } from "@/components/admin/agency/ProjectBillingPanel";
import { ProjectOnboardingPanel } from "@/components/admin/agency/ProjectOnboardingPanel";
import { ProjectChangeRequestsPanel } from "@/components/admin/agency/ProjectChangeRequestsPanel";
import { healthTone } from "@/lib/agency/display";
import { contactDisplayName } from "@/lib/crm/normalize";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminSection, AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { Button } from "@/components/ui/button";
import { StatusBadge, SemanticBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AgencyProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_projects");
  const { id } = await params;
  const [project, projectContracts] = await Promise.all([
    getProjectAdminDetail(id),
    listContracts({ filters: { projectId: id }, pageSize: 10 }),
  ]);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/projects" className="text-sm text-muted hover:underline">
        ← Projects
      </Link>

      <AdminDetailHeader
        title={project.name}
        subtitle={`${project.projectNumber} · ${AGENCY_SERVICE_TYPE_LABELS[project.serviceType]} · ${contactDisplayName(project.primaryContact)}`}
        status={{ domain: "project", value: project.status }}
        secondaryActions={
          <SemanticBadge tone={healthTone(project.health)}>
            {AGENCY_PROJECT_HEALTH_LABELS[project.health]}
          </SemanticBadge>
        }
        primaryAction={
          <div className="flex flex-wrap gap-2">
            {project.sourceProposal ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/agency/proposals/${project.sourceProposal.id}`}>
                  Source proposal ({project.sourceProposal.proposalNumber})
                </Link>
              </Button>
            ) : null}
            {project.sourceDealId ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/crm/deals/${project.sourceDealId}`}>View source deal</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {projectContracts.items.length ? (
        <AdminSection title="Contracts">
          <AdminPanel>
            <ul className="divide-y divide-border text-sm">
              {projectContracts.items.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <Link href={`/admin/agency/contracts/${c.id}`} className="text-accent-text hover:underline">
                    {c.contractNumber} · {c.title}
                  </Link>
                  <StatusBadge domain="contract" value={c.status} audience="admin" />
                </li>
              ))}
            </ul>
          </AdminPanel>
        </AdminSection>
      ) : null}

      {can(user.role, "view_billing") ? <ProjectBillingPanel projectId={project.id} /> : null}
      {can(user.role, "view_onboarding") ? (
        <ProjectOnboardingPanel projectId={project.id} canManage={can(user.role, "manage_onboarding")} />
      ) : null}
      {can(user.role, "view_change_requests") ? (
        <ProjectChangeRequestsPanel
          projectId={project.id}
          canManage={can(user.role, "manage_change_requests")}
        />
      ) : null}
      <ProjectDetailPanels project={project} canManage={can(user.role, "manage_projects")} />
    </div>
  );
}
