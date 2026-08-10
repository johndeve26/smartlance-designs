import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getInvoiceById } from "@/lib/billing/invoices";
import { InvoiceDetailPanels } from "@/components/admin/agency/InvoiceDetailPanels";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { StatusBadge } from "@/components/ui/status-badge";
import { displayInvoiceStatus } from "@/lib/billing/display";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_billing");
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const displayStatus = displayInvoiceStatus({
    status: invoice.status,
    dueDate: invoice.dueDate,
    amountDueMinor: invoice.amountDueMinor,
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/invoices" className="text-sm text-muted hover:underline">
        ← Invoices
      </Link>

      <AdminDetailHeader
        title={invoice.invoiceNumber}
        subtitle={`${invoice.billingNameSnapshot} · ${invoice.currency}${invoice.project ? ` · ${invoice.project.projectNumber}` : ""}`}
        status={{ domain: "invoice", value: displayStatus }}
      />

      {invoice.project ? (
        <p className="text-sm text-muted">
          Project:{" "}
          <Link href={`/admin/agency/projects/${invoice.project.id}`} className="text-accent-text hover:underline">
            {invoice.project.projectNumber}
          </Link>
        </p>
      ) : null}

      <InvoiceDetailPanels
        invoice={invoice}
        canManage={can(user.role, "manage_billing")}
        canRecordPayments={can(user.role, "record_payments")}
      />
    </div>
  );
}
