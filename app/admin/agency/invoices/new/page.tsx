import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { createManualInvoiceAction } from "@/lib/admin/billing-actions";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currency";
import { PAYMENT_TERMS_PRESETS } from "@/lib/billing/constants";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  await requireAdminUser("manage_billing");

  async function action(formData: FormData) {
    "use server";
    const result = await createManualInvoiceAction(formData);
    if (result.ok) redirect(`/admin/agency/invoices/${result.id}`);
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/invoices" className="text-sm text-muted hover:underline">
        ← Invoices
      </Link>

      <AdminDetailHeader
        title="New invoice"
        subtitle="Creates a draft invoice. Add line items on the detail page before issuing."
      />

      <AdminPanel className="max-w-xl">
        <form action={action} className="space-y-4">
          <Input name="companyId" label="Company ID (optional)" placeholder="CUID" />
          <Input name="primaryContactId" label="Primary contact ID (optional)" placeholder="CUID" />
          <Select name="currency" label="Currency" defaultValue="USD">
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Select name="paymentTermsDays" label="Payment terms" defaultValue="14">
            {PAYMENT_TERMS_PRESETS.map((p) => (
              <option key={p.days} value={p.days}>{p.label}</option>
            ))}
          </Select>
          <div>
            <label className="text-sm font-medium">Memo (internal)</label>
            <textarea name="memo" rows={3} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Client notes</label>
            <textarea name="clientNotes" rows={3} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
          </div>
          <Button type="submit">Create draft</Button>
        </form>
      </AdminPanel>
    </div>
  );
}
