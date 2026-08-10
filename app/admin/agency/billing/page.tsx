import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getBillingDashboardCounts, listInvoices } from "@/lib/billing/invoices";
import { listRetainers } from "@/lib/billing/retainers";
import { formatMinorAmount } from "@/lib/money/format";
import { displayInvoiceStatus } from "@/lib/billing/display";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { AdminStatGrid, AdminSection } from "@/components/admin/patterns/AdminDashboardPanels";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AgencyBillingDashboardPage() {
  const user = await requireAdminUser("view_billing");
  const [metrics, recent, retainers] = await Promise.all([
    getBillingDashboardCounts(),
    listInvoices({ page: 1, pageSize: 10 }),
    listRetainers(),
  ]);
  const activeRetainers = retainers.filter((r) => r.status === "ACTIVE").length;
  const currency = "USD";

  return (
    <AdminListPage
      title="Billing"
      description="Invoices, payments, and recurring retainers — operational billing, not accounting."
      action={
        can(user.role, "manage_billing") ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/admin/agency/invoices/new">New invoice</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/agency/retainers">Retainers</Link>
            </Button>
          </div>
        ) : undefined
      }
      isEmpty={false}
    >
      <AdminStatGrid
        stats={[
          { label: "Outstanding", value: formatMinorAmount(metrics.outstandingMinor, currency) },
          { label: "Overdue invoices", value: metrics.overdueCount },
          { label: "Paid this month", value: metrics.paidThisMonth },
          { label: "Active retainers", value: activeRetainers },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/agency/invoices">All invoices</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/agency/payments">Payments</Link>
        </Button>
      </div>

      <AdminSection title="Recent invoices">
        <DataTable
          rows={recent.items}
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
              cell: (inv) => inv.company?.name ?? inv.billingNameSnapshot ?? "—",
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
              key: "balance",
              header: "Balance",
              hideOnMobile: true,
              cell: (inv) => formatMinorAmount(inv.amountDueMinor, inv.currency),
            },
            {
              key: "due",
              header: "Due",
              hideOnMobile: true,
              cell: (inv) => (inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : "—"),
            },
          ]}
        />
      </AdminSection>
    </AdminListPage>
  );
}
