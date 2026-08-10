import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { hasDatabaseUrl } from "@/lib/db";
import { getAdminDashboardHome } from "@/lib/admin/dashboard-home";
import {
  AdminAttentionList,
  AdminSection,
  AdminStatGrid,
} from "@/components/admin/patterns/AdminDashboardPanels";
import { PageHeader } from "@/components/ui/page-header";
import { AGENCY_PROJECT_STATUS_LABELS } from "@/lib/agency/constants";
import { CRM_DEAL_STAGE_LABELS } from "@/lib/crm/constants";
import { formatRelativeTime } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireAdminUser("dashboard");

  if (!hasDatabaseUrl()) {
    return (
      <div>
        <PageHeader title="Dashboard" description="DATABASE_URL is not configured." />
      </div>
    );
  }

  const canViewCrm = can(user.role, "view_crm");
  const canViewProjects = can(user.role, "view_projects");
  const canViewBilling = can(user.role, "view_billing");

  const home = await getAdminDashboardHome();

  const filteredAttention = home.attention.filter((item) => {
    if (item.id === "inbox" || item.id === "proposals") return canViewCrm || can(user.role, "view_proposals");
    if (item.id === "contracts") return can(user.role, "view_contracts");
    if (item.id === "invoices") return canViewBilling;
    if (item.id === "projects-client" || item.id === "onboarding") return canViewProjects;
    if (item.id === "support") return can(user.role, "view_support");
    return true;
  });

  const filteredStats = home.stats.filter((stat) => {
    if (stat.label === "Open leads") return canViewCrm;
    if (stat.label === "Active projects") return canViewProjects;
    if (stat.label === "Overdue invoices") return canViewBilling;
    if (stat.label === "Open support") return can(user.role, "view_support");
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Dashboard"
        description="What needs attention across sales, delivery, and billing."
      />

      <AdminSection title="Needs attention">
        <AdminAttentionList items={filteredAttention} />
      </AdminSection>

      {filteredStats.length > 0 ? (
        <AdminSection title="At a glance">
          <AdminStatGrid stats={filteredStats} />
        </AdminSection>
      ) : null}

      {canViewCrm && home.pipeline.length > 0 ? (
        <AdminSection title="Sales pipeline" description="Open deals by stage">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {home.pipeline
              .filter((p) => p.count > 0)
              .slice(0, 6)
              .map((stage) => (
                <div
                  key={stage.stage}
                  className="rounded-lg border border-border bg-surface px-4 py-3"
                >
                  <p className="text-sm font-medium text-foreground">
                    {CRM_DEAL_STAGE_LABELS[stage.stage as keyof typeof CRM_DEAL_STAGE_LABELS] ??
                      stage.stage}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {stage.count} deal{stage.count === 1 ? "" : "s"}
                    {stage.totalAmount > 0
                      ? ` · ${stage.totalAmount.toLocaleString()} total`
                      : null}
                  </p>
                </div>
              ))}
          </div>
        </AdminSection>
      ) : null}

      {canViewProjects && home.activeProjects.length > 0 ? (
        <AdminSection
          title="Active delivery"
          action={
            <Link
              href="/admin/agency/projects"
              className="text-sm font-medium text-accent-text hover:underline"
            >
              All projects
            </Link>
          }
        >
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {home.activeProjects.map((project) => (
              <li key={project.id}>
                <Link
                  href={project.href}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-muted/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-sm text-muted">
                      {project.clientName ?? "No company"} ·{" "}
                      {AGENCY_PROJECT_STATUS_LABELS[
                        project.status as keyof typeof AGENCY_PROJECT_STATUS_LABELS
                      ] ?? project.status}
                    </p>
                  </div>
                  <span className="text-sm text-accent-text">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        </AdminSection>
      ) : null}

      {home.recentActivity.length > 0 ? (
        <AdminSection title="Recent activity">
          <ul className="space-y-2">
            {home.recentActivity.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm"
              >
                <span className="text-foreground">{item.summary}</span>
                <span className="shrink-0 text-subtle">{formatRelativeTime(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        </AdminSection>
      ) : null}
    </div>
  );
}
