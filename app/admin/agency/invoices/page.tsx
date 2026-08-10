import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listInvoices } from "@/lib/billing/invoices";
import { INVOICE_STATUS_LABELS } from "@/lib/billing/constants";
import { displayInvoiceStatus } from "@/lib/billing/display";
import { formatMinorAmount } from "@/lib/money/format";
import { CrmPagination } from "@/components/admin/crm/CrmPagination";
import { contactDisplayName } from "@/lib/crm/normalize";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AgencyInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const user = await requireAdminUser("view_billing");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const list = await listInvoices({ filters: { q: sp.q, status: sp.status }, page });
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <AdminListPage
      title="Invoices"
      description={
        <Link href="/admin/agency/billing" className="text-accent-text hover:underline">
          ← Billing
        </Link>
      }
      action={
        can(user.role, "manage_billing") ? (
          <Button asChild size="sm">
            <Link href="/admin/agency/invoices/new">New invoice</Link>
          </Button>
        ) : undefined
      }
      filters={
        <form className="flex flex-wrap items-end gap-3">
          <Input name="q" defaultValue={sp.q} placeholder="Search…" className="min-w-[200px]" />
          <Select name="status" label="Status" defaultValue={sp.status ?? ""}>
            <option value="">All statuses</option>
            {Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Button type="submit" size="sm" variant="outline">
            Filter
          </Button>
        </form>
      }
      isEmpty={list.items.length === 0}
      empty={{ title: "No invoices found", description: "Create an invoice or adjust filters." }}
      pagination={
        <CrmPagination
          page={page}
          totalPages={totalPages}
          total={list.total}
          hrefForPage={(p) => `/admin/agency/invoices?page=${p}`}
        />
      }
    >
      <DataTable
        rows={list.items}
        rowKey={(inv) => inv.id}
        columns={[
          {
            key: "invoice",
            header: "Invoice",
            cell: (inv) => (
              <Link href={`/admin/agency/invoices/${inv.id}`} className="font-medium text-accent-text hover:underline">
                {inv.invoiceNumber}
              </Link>
            ),
          },
          {
            key: "client",
            header: "Client",
            cell: (inv) =>
              inv.company?.name ??
              (inv.primaryContact ? contactDisplayName(inv.primaryContact) : inv.billingNameSnapshot ?? "—"),
          },
          {
            key: "project",
            header: "Project",
            hideOnMobile: true,
            cell: (inv) =>
              inv.project ? (
                <Link href={`/admin/agency/projects/${inv.project.id}`} className="text-accent-text hover:underline">
                  {inv.project.projectNumber}
                </Link>
              ) : (
                "—"
              ),
          },
          {
            key: "status",
            header: "Status",
            cell: (inv) => {
              const status = displayInvoiceStatus({
                status: inv.status,
                dueDate: inv.dueDate,
                amountDueMinor: inv.amountDueMinor,
              });
              return <StatusBadge domain="invoice" value={status} audience="admin" />;
            },
          },
          {
            key: "total",
            header: "Total",
            hideOnMobile: true,
            cell: (inv) => formatMinorAmount(inv.totalMinor, inv.currency),
          },
          {
            key: "paid",
            header: "Paid",
            hideOnMobile: true,
            cell: (inv) => formatMinorAmount(inv.amountPaidMinor, inv.currency),
          },
          {
            key: "balance",
            header: "Balance",
            hideOnMobile: true,
            cell: (inv) => formatMinorAmount(inv.amountDueMinor, inv.currency),
          },
          {
            key: "issue",
            header: "Issue",
            hideOnMobile: true,
            cell: (inv) => (inv.issueDate ? inv.issueDate.toISOString().slice(0, 10) : "—"),
          },
          {
            key: "due",
            header: "Due",
            hideOnMobile: true,
            cell: (inv) => (inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : "—"),
          },
        ]}
      />
    </AdminListPage>
  );
}
