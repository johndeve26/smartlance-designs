import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listTemplates, seedSystemTemplatesIfEmpty } from "@/lib/agency/templates";
import {
  AGENCY_SERVICE_TYPE_LABELS,
} from "@/lib/agency/constants";
import { AgencySubNavBar } from "@/components/admin/agency/AgencySubNavBar";

export const dynamic = "force-dynamic";

export default async function AgencyTemplatesPage() {
  const user = await requireAdminUser("view_projects");
  if (can(user.role, "manage_project_templates")) {
    await seedSystemTemplatesIfEmpty(user.id);
  }
  const templates = await listTemplates({ includeArchived: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Project Templates</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Reusable milestone, task, and requirement structures.
          </p>
        </div>
        {can(user.role, "manage_project_templates") ? (
          <Link href="/admin/agency/templates/new" className="admin-btn admin-btn-primary">
            New template
          </Link>
        ) : null}
      </div>

      <AgencySubNavBar />

      <div className="admin-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-neutral-500">
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Structure</th>
              <th className="px-4 py-3">Created by</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="px-4 py-3">
                  <Link href={`/admin/agency/templates/${t.id}`} className="font-medium hover:underline">
                    {t.name}
                  </Link>
                  {t.isArchived ? (
                    <span className="ml-2 text-xs text-neutral-500">(archived)</span>
                  ) : null}
                </td>
                <td className="px-4 py-3">{AGENCY_SERVICE_TYPE_LABELS[t.serviceType]}</td>
                <td className="px-4 py-3">{t._count.milestones} milestones · {t._count.tasks} tasks · {t._count.requirements} requirements</td>
                <td className="px-4 py-3">—</td>
              </tr>
            ))}
            {!templates.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  No templates yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
