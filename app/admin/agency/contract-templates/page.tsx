import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listTemplates } from "@/lib/contracts/templates";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ContractTemplatesPage() {
  const user = await requireAdminUser("view_contracts");
  const templates = await listTemplates();

  return (
    <AdminListPage
      title="Contract templates"
      description="Admin-supplied contract language. Use templates reviewed for your business and jurisdiction. Smartlance does not provide legal advice."
      action={
        can(user.role, "manage_contract_templates") ? (
          <Button asChild size="sm">
            <Link href="/admin/agency/contract-templates/new">Create contract template</Link>
          </Button>
        ) : undefined
      }
      isEmpty={templates.length === 0}
      empty={{
        title: "No contract templates yet",
        description: "Create one with language reviewed for your business.",
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
                <Link href={`/admin/agency/contract-templates/${t.id}`} className="font-medium text-accent-text hover:underline">
                  {t.name}
                </Link>
                {t.description ? <p className="text-muted">{t.description}</p> : null}
              </>
            ),
          },
          { key: "status", header: "Status", cell: (t) => t.status },
          {
            key: "version",
            header: "Latest version",
            hideOnMobile: true,
            cell: (t) => (t.versions[0] ? `V${t.versions[0].versionNumber}` : "—"),
          },
        ]}
      />
    </AdminListPage>
  );
}
