import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listEmailTemplates, seedDefaultEmailTemplates } from "@/lib/crm/email";
import { EmailTemplateForm } from "@/components/admin/crm/EmailTemplateForm";
import { AdminPanel, AdminSection } from "@/components/admin/patterns/AdminPanel";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function CrmEmailTemplatesPage() {
  const user = await requireAdminUser("view_crm");
  if (can(user.role, "manage_crm")) {
    await seedDefaultEmailTemplates(user.id);
  }
  const templates = await listEmailTemplates(false);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Email Templates"
        description="Reusable templates for manual one-to-one CRM email."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {templates.map((t) => (
          <AdminPanel key={t.id}>
            <h2 className="font-semibold text-foreground">{t.name}</h2>
            <p className="text-sm text-muted">{t.subject}</p>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted">
              {t.body}
            </pre>
            {!t.isActive ? (
              <p className="mt-2 text-xs text-warning">Inactive</p>
            ) : null}
          </AdminPanel>
        ))}
      </div>

      {can(user.role, "manage_crm") ? (
        <AdminSection title="New template">
          <AdminPanel className="max-w-xl">
            <EmailTemplateForm />
          </AdminPanel>
        </AdminSection>
      ) : null}
    </div>
  );
}
