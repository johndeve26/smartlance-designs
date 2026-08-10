import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listCompanies } from "@/lib/crm/companies";
import { CrmPagination } from "@/components/admin/crm/CrmPagination";
import { CrmExportButton } from "@/components/admin/crm/CrmExportButton";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function CrmCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requireAdminUser("view_crm");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const list = await listCompanies({ q: sp.q, page, pageSize: 25 });
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <AdminListPage
      title="Companies"
      description="Organizations linked to CRM contacts."
      action={
        <div className="flex flex-wrap gap-2">
          {can(user.role, "export_crm") ? (
            <CrmExportButton type="companies" label="Export CSV" />
          ) : null}
          {can(user.role, "manage_crm") ? (
            <Button asChild size="sm">
              <Link href="/admin/crm/companies/new">New company</Link>
            </Button>
          ) : null}
        </div>
      }
      filters={
        <form className="flex flex-wrap items-end gap-3">
          <Input name="q" label="Search" defaultValue={sp.q} placeholder="Search companies…" className="min-w-[220px]" />
          <Button type="submit" size="sm">Search</Button>
        </form>
      }
      isEmpty={list.items.length === 0}
      empty={{ title: "No companies found" }}
      pagination={
        <CrmPagination
          page={list.page}
          totalPages={totalPages}
          total={list.total}
          hrefForPage={(p) => `/admin/crm/companies?page=${p}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}
        />
      }
    >
      <DataTable
        rows={list.items}
        rowKey={(c) => c.id}
        columns={[
          {
            key: "name",
            header: "Company",
            cell: (c) => (
              <Link href={`/admin/crm/companies/${c.id}`} className="font-medium text-accent-text hover:underline">
                {c.name}
              </Link>
            ),
          },
          { key: "website", header: "Website", hideOnMobile: true, cell: (c) => c.website ?? "—" },
          { key: "industry", header: "Industry", hideOnMobile: true, cell: (c) => c.industry ?? "—" },
          { key: "contacts", header: "Contacts", cell: (c) => c._count.contacts },
          { key: "deals", header: "Open deals", cell: (c) => c._count.deals },
        ]}
      />
    </AdminListPage>
  );
}
