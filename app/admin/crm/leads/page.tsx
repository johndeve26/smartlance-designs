import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listLeads } from "@/lib/crm/leads";
import { contactDisplayName } from "@/lib/crm/normalize";
import {
  CRM_LEAD_STATUS_LABELS,
  CRM_LEAD_TEMPERATURE_LABELS,
  CRM_SOURCE_LABELS,
  formatDate,
  temperatureTone,
} from "@/lib/crm/display";
import { CrmPagination } from "@/components/admin/crm/CrmPagination";
import { CrmBadge } from "@/components/admin/crm/CrmShared";
import { CrmExportButton } from "@/components/admin/crm/CrmExportButton";
import type { CrmLeadStatus, CrmLeadTemperature, CrmContactSource } from "@prisma/client";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CrmLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireAdminUser("view_crm");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);

  const list = await listLeads({
    q: sp.q,
    status: sp.status as CrmLeadStatus | undefined,
    temperature: sp.temperature as CrmLeadTemperature | undefined,
    source: sp.source as CrmContactSource | undefined,
    overdue: sp.overdue === "1",
    page,
  });

  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <AdminListPage
      title="Leads"
      description="Active sales leads by status and temperature."
      action={
        can(user.role, "export_crm") ? (
          <CrmExportButton type="leads" label="Export CSV" />
        ) : undefined
      }
      filters={
        <form className="flex flex-wrap items-end gap-3">
            <Input name="q" label="Search" defaultValue={sp.q} placeholder="Search leads…" className="min-w-[180px]" />
            <Select name="status" label="Status" defaultValue={sp.status ?? ""}>
              <option value="">Active leads</option>
              {Object.entries(CRM_LEAD_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Button type="submit" size="sm">Filter</Button>
          </form>
      }
      isEmpty={list.items.length === 0}
      empty={{ title: "No leads found" }}
      pagination={
        <CrmPagination page={list.page} totalPages={totalPages} total={list.total} hrefForPage={(p) => `/admin/crm/leads?page=${p}`} />
      }
    >
      <DataTable
        rows={list.items}
        rowKey={(l) => l.id}
        columns={[
          {
            key: "contact",
            header: "Contact",
            cell: (l) => (
              <Link href={`/admin/crm/leads/${l.id}`} className="font-medium text-accent-text hover:underline">
                {contactDisplayName(l.contact)}
              </Link>
            ),
          },
          { key: "company", header: "Company", cell: (l) => l.contact.company?.name ?? "—" },
          { key: "status", header: "Status", cell: (l) => CRM_LEAD_STATUS_LABELS[l.status] },
          {
            key: "temp",
            header: "Temp",
            cell: (l) => (
              <CrmBadge tone={temperatureTone(l.temperature)}>
                {CRM_LEAD_TEMPERATURE_LABELS[l.temperature]}
              </CrmBadge>
            ),
          },
          { key: "source", header: "Source", hideOnMobile: true, cell: (l) => CRM_SOURCE_LABELS[l.source] },
          { key: "owner", header: "Owner", hideOnMobile: true, cell: (l) => l.owner?.name ?? "—" },
          { key: "next", header: "Next task", cell: (l) => formatDate(l.tasks[0]?.dueAt) ?? "—" },
          { key: "created", header: "Created", hideOnMobile: true, cell: (l) => formatDate(l.createdAt) ?? "—" },
        ]}
      />
    </AdminListPage>
  );
}
