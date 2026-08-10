import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listDeals } from "@/lib/crm/deals";
import { contactDisplayName } from "@/lib/crm/normalize";
import {
  CRM_DEAL_STAGE_LABELS,
  formatCurrency,
  formatDate,
} from "@/lib/crm/display";
import { CrmPagination } from "@/components/admin/crm/CrmPagination";
import { CrmExportButton } from "@/components/admin/crm/CrmExportButton";
import type { CrmDealStage } from "@prisma/client";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CrmDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; page?: string }>;
}) {
  const user = await requireAdminUser("view_crm");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const list = await listDeals({
    q: sp.q,
    stage: sp.stage as CrmDealStage | undefined,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <AdminListPage
      title="Deals"
      description="Sales pipeline and opportunities."
      action={
        can(user.role, "export_crm") ? (
          <CrmExportButton type="deals" label="Export CSV" />
        ) : undefined
      }
      filters={
        <form className="flex flex-wrap items-end gap-3">
            <Input name="q" label="Search" defaultValue={sp.q} placeholder="Search deals…" className="min-w-[180px]" />
            <Select name="stage" label="Stage" defaultValue={sp.stage ?? ""}>
              <option value="">All stages</option>
              {Object.entries(CRM_DEAL_STAGE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Button type="submit" size="sm">Filter</Button>
          </form>
      }
      isEmpty={list.items.length === 0}
      empty={{ title: "No deals found" }}
      pagination={
        <CrmPagination page={list.page} totalPages={totalPages} total={list.total} hrefForPage={(p) => `/admin/crm/deals?page=${p}`} />
      }
    >
      <DataTable
        rows={list.items}
        rowKey={(d) => d.id}
        columns={[
          {
            key: "deal",
            header: "Deal",
            cell: (d) => (
              <Link href={`/admin/crm/deals/${d.id}`} className="font-medium text-accent-text hover:underline">
                {d.title}
              </Link>
            ),
          },
          { key: "contact", header: "Contact", cell: (d) => contactDisplayName(d.contact) },
          { key: "stage", header: "Stage", cell: (d) => CRM_DEAL_STAGE_LABELS[d.stage] },
          { key: "value", header: "Value", cell: (d) => formatCurrency(Number(d.amount), d.currency ?? "USD") },
          { key: "prob", header: "Probability", hideOnMobile: true, cell: (d) => (d.probability != null ? `${d.probability}%` : "—") },
          { key: "close", header: "Expected close", hideOnMobile: true, cell: (d) => formatDate(d.expectedCloseAt) ?? "—" },
          { key: "owner", header: "Owner", hideOnMobile: true, cell: (d) => d.owner?.name ?? "—" },
        ]}
      />
    </AdminListPage>
  );
}
