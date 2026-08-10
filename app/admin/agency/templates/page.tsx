import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listTemplates } from "@/lib/agency/templates";
import { AGENCY_SERVICE_TYPE_LABELS } from "@/lib/agency/constants";
import { InstallStarterTemplatesButton } from "@/components/admin/agency/InstallStarterTemplatesButton";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AgencyTemplatesPage() {
  const user = await requireAdminUser("view_projects");
  const templates = await listTemplates({ includeArchived: true });
  const canManage = can(user.role, "manage_project_templates");

  return (
    <AdminListPage
      title="Project Templates"
      description="Reusable milestone, task, and requirement structures."
      action={
        canManage ? (
          <div className="flex flex-wrap gap-2">
            {!templates.length ? <InstallStarterTemplatesButton /> : null}
            <Button asChild size="sm">
              <Link href="/admin/agency/templates/new">Create template</Link>
            </Button>
          </div>
        ) : undefined
      }
      isEmpty={templates.length === 0}
      empty={{
        title: "No project templates yet",
        description: canManage
          ? "Create a template from scratch or install editable starter templates for common engagements."
          : undefined,
      }}
    >
      <DataTable
        rows={templates}
        rowKey={(t) => t.id}
        columns={[
          {
            key: "template",
            header: "Template",
            cell: (t) => (
              <>
                <Link href={`/admin/agency/templates/${t.id}`} className="font-medium text-accent-text hover:underline">
                  {t.name}
                </Link>
                {t.isArchived ? <span className="ml-2 text-xs text-muted">(archived)</span> : null}
              </>
            ),
          },
          {
            key: "service",
            header: "Service",
            cell: (t) => AGENCY_SERVICE_TYPE_LABELS[t.serviceType],
          },
          {
            key: "structure",
            header: "Structure",
            hideOnMobile: true,
            cell: (t) => `${t._count.milestones} milestones · ${t._count.tasks} tasks · ${t._count.requirements} requirements`,
          },
          {
            key: "created",
            header: "Created by",
            hideOnMobile: true,
            cell: () => "—",
          },
        ]}
      />
    </AdminListPage>
  );
}
