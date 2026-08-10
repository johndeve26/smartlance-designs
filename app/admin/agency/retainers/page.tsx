import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listRetainers } from "@/lib/billing/retainers";
import { formatMinorAmount } from "@/lib/money/format";
import {
  activateRetainerAction,
  createRetainerAction,
  pauseRetainerAction,
} from "@/lib/admin/billing-actions";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currency";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

export default async function AgencyRetainersPage() {
  const user = await requireAdminUser("view_billing");
  const retainers = await listRetainers();

  async function createAction(formData: FormData) {
    "use server";
    await createRetainerAction(formData);
  }

  async function activateAction(formData: FormData) {
    "use server";
    await activateRetainerAction(formData);
  }

  async function pauseAction(formData: FormData) {
    "use server";
    await pauseRetainerAction(formData);
  }

  return (
    <AdminListPage
      title="Retainers"
      description={
        <>
          <Link href="/admin/agency/billing" className="text-accent-text hover:underline">
            ← Billing
          </Link>
          {" · "}
          Recurring billing arrangements — generates invoices, not provider subscriptions.
        </>
      }
      isEmpty={retainers.length === 0 && !can(user.role, "manage_retainers")}
      empty={{ title: "No retainers yet", description: "Create a retainer to bill clients on a schedule." }}
    >
      {can(user.role, "manage_retainers") ? (
        <AdminPanel className="max-w-xl space-y-3">
          <h2 className="text-section-heading">New retainer</h2>
          <form action={createAction} className="space-y-3">
            <Input name="companyId" label="Company ID" required placeholder="Company ID" />
            <Input name="name" label="Name" required placeholder="Name" />
            <Select name="currency" label="Currency" defaultValue="USD">
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Input name="amountMinor" label="Amount (minor units)" type="number" required placeholder="Amount (minor units)" />
            <Input name="lineItemDescription" label="Line item description" required placeholder="Line item description" />
            <Input name="startDate" label="Start date" type="date" required />
            <Select name="billingInterval" label="Billing interval">
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </Select>
            <Button type="submit">Create draft retainer</Button>
          </form>
        </AdminPanel>
      ) : null}

      <DataTable
        rows={retainers}
        rowKey={(r) => r.id}
        columns={[
          { key: "name", header: "Retainer", cell: (r) => <span className="font-medium">{r.name}</span> },
          { key: "client", header: "Client", cell: (r) => r.company?.name ?? "—" },
          { key: "amount", header: "Amount", cell: (r) => formatMinorAmount(r.amountMinor, r.currency) },
          { key: "interval", header: "Interval", hideOnMobile: true, cell: (r) => r.billingInterval },
          { key: "status", header: "Status", cell: (r) => r.status },
          {
            key: "next",
            header: "Next billing",
            hideOnMobile: true,
            cell: (r) => r.nextBillingDate?.toISOString().slice(0, 10) ?? "—",
          },
          {
            key: "actions",
            header: "Actions",
            cell: (r) => (
              <>
                {can(user.role, "manage_retainers") && r.status === "DRAFT" ? (
                  <form action={activateAction} className="inline">
                    <input type="hidden" name="retainerId" value={r.id} />
                    <button type="submit" className="text-sm text-accent-text hover:underline">Activate</button>
                  </form>
                ) : null}
                {can(user.role, "manage_retainers") && r.status === "ACTIVE" ? (
                  <form action={pauseAction} className="inline">
                    <input type="hidden" name="retainerId" value={r.id} />
                    <button type="submit" className="text-sm text-accent-text hover:underline">Pause</button>
                  </form>
                ) : null}
              </>
            ),
          },
        ]}
      />
    </AdminListPage>
  );
}
