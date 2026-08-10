import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listProjects, listAdminUsersForSelect } from "@/lib/agency/projects";
import {
  AGENCY_PROJECT_HEALTH_LABELS,
  AGENCY_SERVICE_TYPE_LABELS,
} from "@/lib/agency/constants";
import { formatDate, healthTone } from "@/lib/agency/display";
import { contactDisplayName } from "@/lib/crm/normalize";
import { ProjectListFilters } from "@/components/admin/agency/ProjectListFilters";
import { CrmPagination } from "@/components/admin/crm/CrmPagination";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { StatusBadge, SemanticBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AgencyProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    health?: string;
    ownerId?: string;
    serviceType?: string;
    page?: string;
  }>;
}) {
  const user = await requireAdminUser("view_projects");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const [list, owners] = await Promise.all([
    listProjects({
      filters: {
        q: sp.q,
        status: sp.status as never,
        health: sp.health as never,
        ownerId: sp.ownerId,
        serviceType: sp.serviceType as never,
      },
      page,
    }),
    listAdminUsersForSelect(),
  ]);
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <AdminListPage
      title="Projects"
      description="Active delivery work across clients."
      action={
        can(user.role, "manage_projects") ? (
          <Button asChild size="sm">
            <Link href="/admin/agency/projects/new">New project</Link>
          </Button>
        ) : undefined
      }
      filters={<ProjectListFilters owners={owners} />}
      isEmpty={list.items.length === 0}
      empty={{ title: "No projects match these filters", description: "Try adjusting filters or create a new project." }}
      pagination={
        <CrmPagination
          page={page}
          totalPages={totalPages}
          total={list.total}
          hrefForPage={(p) => {
            const params = new URLSearchParams();
            if (sp.q) params.set("q", sp.q);
            if (sp.status) params.set("status", sp.status);
            if (sp.health) params.set("health", sp.health);
            if (sp.ownerId) params.set("ownerId", sp.ownerId);
            if (sp.serviceType) params.set("serviceType", sp.serviceType);
            if (p > 1) params.set("page", String(p));
            const qs = params.toString();
            return qs ? `/admin/agency/projects?${qs}` : "/admin/agency/projects";
          }}
        />
      }
    >
      <DataTable
        rows={list.items}
        rowKey={(p) => p.id}
        columns={[
          {
            key: "project",
            header: "Project",
            cell: (p) => (
              <>
                <Link href={`/admin/agency/projects/${p.id}`} className="font-medium text-accent-text hover:underline">
                  {p.projectNumber}
                </Link>
                <p className="text-muted">{p.name}</p>
              </>
            ),
          },
          {
            key: "client",
            header: "Client",
            cell: (p) => (
              <>
                <p>{contactDisplayName(p.primaryContact)}</p>
                <p className="text-muted">{p.clientCompany?.name ?? "—"}</p>
              </>
            ),
          },
          {
            key: "service",
            header: "Service",
            hideOnMobile: true,
            cell: (p) => AGENCY_SERVICE_TYPE_LABELS[p.serviceType],
          },
          {
            key: "owner",
            header: "Owner",
            hideOnMobile: true,
            cell: (p) => p.owner.name,
          },
          {
            key: "due",
            header: "Due",
            hideOnMobile: true,
            cell: (p) => formatDate(p.targetDueDate),
          },
          {
            key: "status",
            header: "Status",
            cell: (p) => (
              <div className="flex flex-wrap gap-1">
                <StatusBadge domain="project" value={p.status} audience="admin" />
                <SemanticBadge tone={healthTone(p.health)}>
                  {AGENCY_PROJECT_HEALTH_LABELS[p.health]}
                </SemanticBadge>
              </div>
            ),
          },
        ]}
      />
    </AdminListPage>
  );
}
