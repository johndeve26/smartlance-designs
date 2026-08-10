import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listOnboardingTemplates } from "@/lib/onboarding";
import { InstallStarterOnboardingTemplatesButton } from "@/components/admin/agency/InstallStarterOnboardingTemplatesButton";
import { ONBOARDING_TEMPLATE_STATUS_LABELS } from "@/lib/onboarding/constants";
import { createOnboardingTemplateAction } from "@/lib/admin/onboarding-actions";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function OnboardingTemplatesPage() {
  const user = await requireAdminUser("view_onboarding");
  const templates = await listOnboardingTemplates();

  return (
    <AdminListPage
      title="Onboarding templates"
      description="Structured client information collection. Templates snapshot into project onboarding."
      action={
        can(user.role, "manage_onboarding_templates") ? (
          <InstallStarterOnboardingTemplatesButton />
        ) : undefined
      }
      isEmpty={templates.length === 0 && !can(user.role, "manage_onboarding_templates")}
      empty={{ title: "No onboarding templates yet", description: "Install starter templates or create a new one." }}
    >
      {can(user.role, "manage_onboarding_templates") ? (
        <AdminPanel className="space-y-3">
          <h2 className="text-section-heading">Create template</h2>
          <form action={createOnboardingTemplateAction} className="space-y-3">
            <Input name="name" required placeholder="Template name" className="max-w-md" />
            <textarea name="description" placeholder="Description" className="w-full max-w-xl rounded-md border border-border bg-surface px-3 py-2 text-sm" rows={2} />
            <textarea name="welcomeText" placeholder="Default welcome message" className="w-full max-w-xl rounded-md border border-border bg-surface px-3 py-2 text-sm" rows={3} />
            <Button type="submit">Create draft template</Button>
          </form>
        </AdminPanel>
      ) : null}

      <DataTable
        rows={templates}
        rowKey={(t) => t.id}
        columns={[
          {
            key: "template",
            header: "Template",
            cell: (t) => (
              <>
                <Link href={`/admin/agency/onboarding-templates/${t.id}`} className="font-medium text-accent-text hover:underline">
                  {t.name}
                </Link>
                {t.description ? <p className="text-muted">{t.description}</p> : null}
              </>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (t) => ONBOARDING_TEMPLATE_STATUS_LABELS[t.status],
          },
          {
            key: "version",
            header: "Version",
            hideOnMobile: true,
            cell: (t) => (t.versions[0] ? `V${t.versions[0].versionNumber}` : "—"),
          },
        ]}
      />
    </AdminListPage>
  );
}
