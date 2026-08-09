import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listProjects, listAdminUsersForSelect } from "@/lib/agency/projects";
import {
  AGENCY_PROJECT_HEALTH_LABELS,
  AGENCY_PROJECT_STATUS_LABELS,
  AGENCY_SERVICE_TYPE_LABELS,
} from "@/lib/agency/constants";
import { formatDate, healthTone, statusTone } from "@/lib/agency/display";
import { contactDisplayName } from "@/lib/crm/normalize";
import { AgencySubNavBar, AgencyBadge } from "@/components/admin/agency/AgencySubNavBar";
import { ProjectListFilters } from "@/components/admin/agency/ProjectListFilters";
import { CrmPagination } from "@/components/admin/crm/CrmShared";

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="mt-1 text-sm text-neutral-600">Active delivery work across clients.</p>
        </div>
        {can(user.role, "manage_projects") ? (
          <Link href="/admin/agency/projects/new" className="admin-btn admin-btn-primary">
            New project
          </Link>
        ) : null}
      </div>

      <AgencySubNavBar />
      <ProjectListFilters owners={owners} />

      <div className="admin-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-neutral-500">
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="px-4 py-3">
                  <Link href={`/admin/agency/projects/${p.id}`} className="font-medium hover:underline">
                    {p.projectNumber}
                  </Link>
                  <p className="text-neutral-600">{p.name}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{contactDisplayName(p.primaryContact)}</p>
                  <p className="text-neutral-600">{p.clientCompany?.name ?? "—"}</p>
                </td>
                <td className="px-4 py-3">{AGENCY_SERVICE_TYPE_LABELS[p.serviceType]}</td>
                <td className="px-4 py-3">{p.owner.name}</td>
                <td className="px-4 py-3">{formatDate(p.targetDueDate)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <AgencyBadge tone={statusTone(p.status)}>
                      {AGENCY_PROJECT_STATUS_LABELS[p.status]}
                    </AgencyBadge>
                    <AgencyBadge tone={healthTone(p.health)}>
                      {AGENCY_PROJECT_HEALTH_LABELS[p.health]}
                    </AgencyBadge>
                  </div>
                </td>
              </tr>
            ))}
            {!list.items.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No projects match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}
