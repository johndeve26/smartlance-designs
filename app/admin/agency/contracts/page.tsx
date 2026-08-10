import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listContracts, getContractDashboardCounts } from "@/lib/contracts/contracts";
import { CONTRACT_STATUS_LABELS } from "@/lib/contracts/constants";
import { contactDisplayName } from "@/lib/crm/normalize";
import { CrmPagination } from "@/components/admin/crm/CrmPagination";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { AdminStatGrid } from "@/components/admin/patterns/AdminDashboardPanels";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AgencyContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const user = await requireAdminUser("view_contracts");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const [list, metrics] = await Promise.all([
    listContracts({ filters: { q: sp.q, status: sp.status as never }, page }),
    getContractDashboardCounts(),
  ]);
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <AdminListPage
      title="Contracts"
      description="Legal agreements between accepted commercial scope and project delivery."
      action={
        can(user.role, "manage_contracts") ? (
          <Button asChild size="sm">
            <Link href="/admin/agency/contracts/new">New contract</Link>
          </Button>
        ) : undefined
      }
      filters={
        <form className="flex flex-wrap items-end gap-3">
          <Input name="q" defaultValue={sp.q} placeholder="Search…" className="min-w-[200px]" />
          <Select name="status" label="Status" defaultValue={sp.status ?? ""}>
            <option value="">All statuses</option>
            {Object.entries(CONTRACT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Button type="submit" size="sm" variant="outline">
            Filter
          </Button>
        </form>
      }
      isEmpty={list.items.length === 0}
      empty={{
        title: "No contracts yet",
        description: "Create contract templates first, then create a contract from an accepted proposal.",
      }}
      pagination={
        <CrmPagination
          page={page}
          totalPages={totalPages}
          total={list.total}
          hrefForPage={(p) => `/admin/agency/contracts?page=${p}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${sp.status ? `&status=${sp.status}` : ""}`}
        />
      }
    >
      <AdminStatGrid
        stats={[
          { label: "Draft", value: metrics.draft },
          { label: "Awaiting signature", value: metrics.awaiting },
          { label: "Partially signed", value: metrics.partial },
          { label: "Correction requested", value: metrics.correction },
          { label: "Signed", value: metrics.signed },
          { label: "Expired", value: metrics.expired },
        ]}
      />

      <DataTable
        rows={list.items}
        rowKey={(c) => c.id}
        columns={[
          {
            key: "contract",
            header: "Contract",
            cell: (c) => (
              <>
                <Link href={`/admin/agency/contracts/${c.id}`} className="font-medium text-accent-text hover:underline">
                  {c.contractNumber}
                </Link>
                <p className="text-muted">{c.title}</p>
              </>
            ),
          },
          {
            key: "client",
            header: "Client",
            cell: (c) => c.company?.name ?? (c.primaryContact ? contactDisplayName(c.primaryContact) : "—"),
          },
          {
            key: "proposal",
            header: "Proposal",
            hideOnMobile: true,
            cell: (c) =>
              c.proposal ? (
                <Link href={`/admin/agency/proposals/${c.proposal.id}`} className="text-accent-text hover:underline">
                  {c.proposal.proposalNumber}
                </Link>
              ) : (
                "—"
              ),
          },
          {
            key: "project",
            header: "Project",
            hideOnMobile: true,
            cell: (c) =>
              c.project ? (
                <Link href={`/admin/agency/projects/${c.project.id}`} className="text-accent-text hover:underline">
                  {c.project.projectNumber}
                </Link>
              ) : (
                "—"
              ),
          },
          {
            key: "status",
            header: "Status",
            cell: (c) => <StatusBadge domain="contract" value={c.status} audience="admin" />,
          },
          {
            key: "version",
            header: "Version",
            hideOnMobile: true,
            cell: (c) => {
              const version = c.versions[0];
              const signedCount = c.signers.filter((s) => s.status === "SIGNED").length;
              return version
                ? `V${version.versionNumber}${c.signers.length ? ` · ${signedCount}/${c.signers.length}` : ""}`
                : "—";
            },
          },
          {
            key: "owner",
            header: "Owner",
            hideOnMobile: true,
            cell: (c) => c.owner.name,
          },
        ]}
      />
    </AdminListPage>
  );
}
