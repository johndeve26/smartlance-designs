import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { getAgencyDashboardMetrics } from "@/lib/agency/dashboard";
import {
  AGENCY_PROJECT_HEALTH_LABELS,
  AGENCY_PROJECT_STATUS_LABELS,
} from "@/lib/agency/constants";
import { AgencySubNavBar, AgencyBadge } from "@/components/admin/agency/AgencySubNavBar";
import { healthTone, statusTone, formatDateTime } from "@/lib/agency/display";
import { contactDisplayName } from "@/lib/crm/normalize";

export const dynamic = "force-dynamic";

export default async function AgencyDashboardPage() {
  await requireAdminUser("view_projects");
  const data = await getAgencyDashboardMetrics();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Agency Operations</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Delivery workspace — projects, milestones, and client handoffs.
          </p>
        </div>
        <Link href="/admin/agency/projects/new" className="admin-btn admin-btn-primary">
          New project
        </Link>
      </div>

      <AgencySubNavBar />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Active Projects" value={data.cards.activeProjects} href="/admin/agency/projects" />
        <Metric label="Overdue Tasks" value={data.cards.overdueTasks} href="/admin/agency/projects" />
        <Metric label="Awaiting Client" value={data.cards.awaitingClient} href="/admin/agency/projects" />
        <Metric label="Awaiting Approval" value={data.cards.awaitingApproval} href="/admin/agency/projects" />
        <Metric label="On Hold" value={data.cards.onHoldProjects} href="/admin/agency/projects?status=ON_HOLD" />
        <Metric label="Client Review" value={data.cards.clientReviewProjects} href="/admin/agency/projects?status=CLIENT_REVIEW" />
      </div>

      <section className="admin-card space-y-3 p-4">
        <h2 className="text-lg font-semibold">Overdue tasks</h2>
        <ul className="divide-y text-sm">
          {data.overdueTaskItems.map((t) => (
            <li key={t.id} className="flex justify-between gap-2 py-2">
              <div>
                <Link href={`/admin/agency/projects/${t.projectId}`} className="font-medium hover:underline">
                  {t.title}
                </Link>
                <p className="text-neutral-600">
                  {t.project?.projectNumber} · {t.assignee?.name ?? "Unassigned"}
                </p>
              </div>
              {t.dueDate ? (
                <span className="text-neutral-500">Due {formatDateTime(t.dueDate)}</span>
              ) : null}
            </li>
          ))}
          {!data.overdueTaskItems.length ? (
            <li className="py-4 text-neutral-500">No overdue tasks.</li>
          ) : null}
        </ul>
      </section>

      <section className="admin-card space-y-3 p-4">
        <h2 className="text-lg font-semibold">Recent projects</h2>
        <ul className="divide-y">
          {data.recentProjects.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <Link href={`/admin/agency/projects/${p.id}`} className="font-medium hover:underline">
                  {p.projectNumber} · {p.name}
                </Link>
                <p className="text-neutral-600">
                  {p.owner.name} · {contactDisplayName(p.primaryContact)}
                </p>
              </div>
              <div className="flex gap-2">
                <AgencyBadge tone={statusTone(p.status)}>
                  {AGENCY_PROJECT_STATUS_LABELS[p.status]}
                </AgencyBadge>
                <AgencyBadge tone={healthTone(p.health)}>
                  {AGENCY_PROJECT_HEALTH_LABELS[p.health]}
                </AgencyBadge>
              </div>
            </li>
          ))}
          {!data.recentProjects.length ? (
            <li className="py-4 text-sm text-neutral-500">No projects yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-lg border bg-white p-4 hover:border-neutral-400">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
    </Link>
  );
}
