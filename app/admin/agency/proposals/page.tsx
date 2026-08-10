import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listProposals, getProposalDashboardCounts } from "@/lib/proposals/proposals";
import { PROPOSAL_STATUS_LABELS } from "@/lib/proposals/constants";
import { contactDisplayName } from "@/lib/crm/normalize";
import { formatCurrency } from "@/lib/crm/display";
import { CrmPagination } from "@/components/admin/crm/CrmPagination";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { AdminStatGrid } from "@/components/admin/patterns/AdminDashboardPanels";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AgencyProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const user = await requireAdminUser("view_proposals");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const [list, metrics] = await Promise.all([
    listProposals({ filters: { q: sp.q, status: sp.status as never }, page }),
    getProposalDashboardCounts(),
  ]);
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <AdminListPage
      title="Proposals"
      description="Commercial scope between CRM deals and agency projects."
      action={
        can(user.role, "manage_proposals") ? (
          <Button asChild size="sm">
            <Link href="/admin/agency/proposals/new">New proposal</Link>
          </Button>
        ) : undefined
      }
      filters={
        <form className="flex flex-wrap items-end gap-3">
          <Input name="q" defaultValue={sp.q} placeholder="Search…" className="min-w-[200px]" />
          <Select name="status" label="Status" defaultValue={sp.status ?? ""}>
            <option value="">All statuses</option>
            {Object.entries(PROPOSAL_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Button type="submit" size="sm" variant="outline">
            Filter
          </Button>
        </form>
      }
      isEmpty={list.items.length === 0}
      empty={{ title: "No proposals yet", description: "Create a proposal from a CRM deal or manually." }}
      pagination={
        <CrmPagination
          page={page}
          totalPages={totalPages}
          total={list.total}
          hrefForPage={(p) => `/admin/agency/proposals?page=${p}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${sp.status ? `&status=${sp.status}` : ""}`}
        />
      }
    >
      <AdminStatGrid
        stats={[
          { label: "Draft", value: metrics.draft },
          { label: "Awaiting client", value: metrics.awaiting },
          { label: "Changes requested", value: metrics.changesRequested },
          { label: "Accepted", value: metrics.accepted },
          { label: "Declined", value: metrics.declined },
          { label: "Expiring soon", value: metrics.expiringSoon },
        ]}
      />

      <DataTable
        rows={list.items}
        rowKey={(p) => p.id}
        columns={[
          {
            key: "proposal",
            header: "Proposal",
            cell: (p) => (
              <>
                <Link href={`/admin/agency/proposals/${p.id}`} className="font-medium text-accent-text hover:underline">
                  {p.proposalNumber}
                </Link>
                <p className="text-muted">{p.title}</p>
              </>
            ),
          },
          {
            key: "client",
            header: "Client",
            cell: (p) => p.company?.name ?? contactDisplayName(p.primaryContact),
          },
          {
            key: "deal",
            header: "Deal",
            hideOnMobile: true,
            cell: (p) => p.deal?.title ?? "—",
          },
          {
            key: "status",
            header: "Status",
            cell: (p) => <StatusBadge domain="proposal" value={p.status} audience="admin" />,
          },
          {
            key: "amount",
            header: "Amount",
            hideOnMobile: true,
            cell: (p) => {
              const version = p.versions[0];
              return version ? formatCurrency(Number(version.totalAmount), version.currency) : "—";
            },
          },
          {
            key: "owner",
            header: "Owner",
            hideOnMobile: true,
            cell: (p) => p.owner.name,
          },
        ]}
      />
    </AdminListPage>
  );
}
