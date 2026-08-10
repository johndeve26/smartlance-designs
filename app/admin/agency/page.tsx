import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { getAgencyDashboardMetrics } from "@/lib/agency/dashboard";
import {
  AGENCY_PROJECT_HEALTH_LABELS,
} from "@/lib/agency/constants";
import { formatDateTime, healthTone } from "@/lib/agency/display";
import { contactDisplayName } from "@/lib/crm/normalize";
import { AdminStatGrid, AdminSection } from "@/components/admin/patterns/AdminDashboardPanels";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge, SemanticBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AgencyDashboardPage() {
  await requireAdminUser("view_projects");
  const data = await getAgencyDashboardMetrics();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agency Operations"
        description="Delivery workspace — projects, milestones, and client handoffs."
        action={
          <Button asChild size="sm">
            <Link href="/admin/agency/projects/new">New project</Link>
          </Button>
        }
      />

      <AdminStatGrid
        stats={[
          { label: "Active Projects", value: data.cards.activeProjects, href: "/admin/agency/projects" },
          { label: "Overdue Tasks", value: data.cards.overdueTasks, href: "/admin/agency/projects" },
          { label: "Awaiting Client", value: data.cards.awaitingClient, href: "/admin/agency/projects" },
          { label: "Awaiting Approval", value: data.cards.awaitingApproval, href: "/admin/agency/projects" },
          {
            label: "On Hold",
            value: data.cards.onHoldProjects,
            href: "/admin/agency/projects?status=ON_HOLD",
          },
          {
            label: "Client Review",
            value: data.cards.clientReviewProjects,
            href: "/admin/agency/projects?status=CLIENT_REVIEW",
          },
        ]}
      />

      <AdminSection title="Overdue tasks">
        <AdminPanel className="space-y-3">
          <ul className="divide-y divide-border text-sm">
            {data.overdueTaskItems.map((t) => (
              <li key={t.id} className="flex justify-between gap-2 py-2">
                <div>
                  <Link href={`/admin/agency/projects/${t.projectId}`} className="font-medium text-accent-text hover:underline">
                    {t.title}
                  </Link>
                  <p className="text-muted">
                    {t.project?.projectNumber} · {t.assignee?.name ?? "Unassigned"}
                  </p>
                </div>
                {t.dueDate ? (
                  <span className="text-muted">Due {formatDateTime(t.dueDate)}</span>
                ) : null}
              </li>
            ))}
            {!data.overdueTaskItems.length ? (
              <li className="py-4 text-muted">No overdue tasks.</li>
            ) : null}
          </ul>
        </AdminPanel>
      </AdminSection>

      <AdminSection title="Recent projects">
        <AdminPanel className="space-y-3">
          <ul className="divide-y divide-border">
            {data.recentProjects.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <Link href={`/admin/agency/projects/${p.id}`} className="font-medium text-accent-text hover:underline">
                    {p.projectNumber} · {p.name}
                  </Link>
                  <p className="text-muted">
                    {p.owner.name} · {contactDisplayName(p.primaryContact)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge domain="project" value={p.status} audience="admin" />
                  <SemanticBadge tone={healthTone(p.health)}>
                    {AGENCY_PROJECT_HEALTH_LABELS[p.health]}
                  </SemanticBadge>
                </div>
              </li>
            ))}
            {!data.recentProjects.length ? (
              <li className="py-4 text-sm text-muted">No projects yet.</li>
            ) : null}
          </ul>
        </AdminPanel>
      </AdminSection>
    </div>
  );
}
