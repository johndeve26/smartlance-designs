import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { listContactImportsAction } from "@/lib/admin/crm-import-actions";
import { formatDateTime } from "@/lib/crm/display";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";

export const dynamic = "force-dynamic";

export default async function CrmImportsPage() {
  await requireAdminUser("view_crm");
  const imports = await listContactImportsAction();

  return (
    <AdminListPage
      title="Import history"
      description={
        <Link href="/admin/crm/contacts" className="text-accent-text hover:underline">
          ← Contacts
        </Link>
      }
      isEmpty={imports.length === 0}
      empty={{ title: "No imports yet" }}
    >
      <DataTable
        rows={imports}
        rowKey={(job) => job.id}
        columns={[
          {
            key: "date",
            header: "Date",
            cell: (job) => formatDateTime(job.createdAt),
          },
          {
            key: "file",
            header: "File",
            cell: (job) => (
              <Link
                href={`/admin/crm/imports/${job.id}`}
                className="text-accent-text hover:underline"
              >
                {job.fileName}
              </Link>
            ),
          },
          { key: "status", header: "Status", cell: (job) => job.status },
          { key: "rows", header: "Rows", cell: (job) => job.totalRows },
          { key: "created", header: "Created", hideOnMobile: true, cell: (job) => job.createdContacts },
          { key: "updated", header: "Updated", hideOnMobile: true, cell: (job) => job.updatedContacts },
          { key: "skipped", header: "Skipped", hideOnMobile: true, cell: (job) => job.skippedContacts },
          { key: "invalid", header: "Invalid", hideOnMobile: true, cell: (job) => job.invalidRows },
          { key: "admin", header: "Admin", hideOnMobile: true, cell: (job) => job.createdBy.name },
        ]}
      />
    </AdminListPage>
  );
}
