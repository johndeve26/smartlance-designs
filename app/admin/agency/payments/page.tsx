import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { listPayments } from "@/lib/billing/payments";
import { formatMinorAmount } from "@/lib/money/format";
import { CrmPagination } from "@/components/admin/crm/CrmPagination";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";

export const dynamic = "force-dynamic";

export default async function AgencyPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminUser("view_billing");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const list = await listPayments({ page });
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <AdminListPage
      title="Payments"
      description={
        <Link href="/admin/agency/billing" className="text-accent-text hover:underline">
          ← Billing
        </Link>
      }
      isEmpty={list.items.length === 0}
      empty={{ title: "No payments yet", description: "Payments appear here when recorded or confirmed." }}
      pagination={
        <CrmPagination
          page={page}
          totalPages={totalPages}
          total={list.total}
          hrefForPage={(p) => `/admin/agency/payments?page=${p}`}
        />
      }
    >
      <DataTable
        rows={list.items}
        rowKey={(p) => p.id}
        columns={[
          {
            key: "payment",
            header: "Payment",
            cell: (p) => p.paymentReference ?? p.id.slice(0, 8),
          },
          {
            key: "invoice",
            header: "Invoice",
            cell: (p) => {
              const inv = p.allocations[0]?.invoice;
              return inv ? (
                <Link href={`/admin/agency/invoices/${inv.id}`} className="text-accent-text hover:underline">
                  {inv.invoiceNumber}
                </Link>
              ) : (
                "—"
              );
            },
          },
          {
            key: "amount",
            header: "Amount",
            cell: (p) => formatMinorAmount(p.amountMinor, p.currency),
          },
          {
            key: "status",
            header: "Status",
            hideOnMobile: true,
            cell: (p) => p.status,
          },
          {
            key: "method",
            header: "Method",
            hideOnMobile: true,
            cell: (p) => p.method,
          },
          {
            key: "provider",
            header: "Provider",
            hideOnMobile: true,
            cell: (p) => p.provider,
          },
          {
            key: "date",
            header: "Date",
            hideOnMobile: true,
            cell: (p) => (p.confirmedAt ?? p.createdAt).toISOString().slice(0, 10),
          },
        ]}
      />
    </AdminListPage>
  );
}
