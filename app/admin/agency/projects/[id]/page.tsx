import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getProjectAdminDetail } from "@/lib/agency/projects";
import {
  AGENCY_PROJECT_HEALTH_LABELS,
  AGENCY_PROJECT_STATUS_LABELS,
  AGENCY_SERVICE_TYPE_LABELS,
} from "@/lib/agency/constants";
import { AgencySubNavBar, AgencyBadge } from "@/components/admin/agency/AgencySubNavBar";
import { ProjectDetailPanels } from "@/components/admin/agency/ProjectDetailPanels";
import { healthTone, statusTone } from "@/lib/agency/display";
import { contactDisplayName } from "@/lib/crm/normalize";

export const dynamic = "force-dynamic";

export default async function AgencyProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_projects");
  const { id } = await params;
  const project = await getProjectAdminDetail(id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/agency/projects" className="text-sm text-neutral-600 hover:underline">
            ← Projects
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-neutral-600">
            {project.projectNumber} · {AGENCY_SERVICE_TYPE_LABELS[project.serviceType]} ·{" "}
            {contactDisplayName(project.primaryContact)}
          </p>
          <div className="mt-2 flex gap-2">
            <AgencyBadge tone={statusTone(project.status)}>
              {AGENCY_PROJECT_STATUS_LABELS[project.status]}
            </AgencyBadge>
            <AgencyBadge tone={healthTone(project.health)}>
              {AGENCY_PROJECT_HEALTH_LABELS[project.health]}
            </AgencyBadge>
          </div>
        </div>
        {project.sourceDealId ? (
          <Link href={`/admin/crm/deals/${project.sourceDealId}`} className="admin-btn admin-btn-secondary">
            View source deal
          </Link>
        ) : null}
      </div>

      <AgencySubNavBar />
      <ProjectDetailPanels project={project} canManage={can(user.role, "manage_projects")} />
    </div>
  );
}
