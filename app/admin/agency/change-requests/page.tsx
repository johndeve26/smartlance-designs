import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { listChangeRequests } from "@/lib/change-requests";
import {
  CHANGE_REQUEST_CLASSIFICATION_LABELS,
  CHANGE_REQUEST_STATUS_LABELS,
} from "@/lib/change-requests/constants";
import { formatMinorAmount } from "@/lib/money/format";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AgencyChangeRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; awaiting?: string }>;
}) {
  await requireAdminUser("view_change_requests");
  const params = await searchParams;

  const { items } = await listChangeRequests({
    filters: {
      status: params.status,
      q: params.q,
      awaitingClient: params.awaiting === "1",
    },
  });

  return (
    <AdminListPage
      title="Change Requests"
      description="Scope control after original project acceptance."
      filters={
        <form className="flex flex-wrap items-end gap-3">
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search CR #, project, title…"
            className="min-w-[240px]"
          />
          <Select name="status" label="Status" defaultValue={params.status ?? ""}>
            <option value="">All statuses</option>
            {Object.entries(CHANGE_REQUEST_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Button type="submit" size="sm" variant="outline">
            Filter
          </Button>
        </form>
      }
      isEmpty={items.length === 0}
      empty={{ title: "No change requests yet", description: "Change requests appear when clients or staff request scope changes." }}
    >
      <DataTable
        rows={items}
        rowKey={(cr) => cr.id}
        columns={[
          {
            key: "number",
            header: "CR #",
            cell: (cr) => (
              <Link href={`/admin/agency/change-requests/${cr.id}`} className="font-medium text-accent-text hover:underline">
                {cr.changeRequestNumber}
              </Link>
            ),
          },
          {
            key: "project",
            header: "Project",
            cell: (cr) => (
              <>
                <Link href={`/admin/agency/projects/${cr.project.id}`} className="text-accent-text hover:underline">
                  {cr.project.projectNumber}
                </Link>
                <div className="text-muted">{cr.project.name}</div>
              </>
            ),
          },
          { key: "title", header: "Title", cell: (cr) => cr.title },
          {
            key: "status",
            header: "Status",
            cell: (cr) => <StatusBadge domain="change" value={cr.status} audience="admin" />,
          },
          {
            key: "classification",
            header: "Classification",
            hideOnMobile: true,
            cell: (cr) => CHANGE_REQUEST_CLASSIFICATION_LABELS[cr.classification],
          },
          {
            key: "price",
            header: "Price",
            hideOnMobile: true,
            cell: (cr) => {
              const assessment = cr.assessments[0];
              const priceMinor = cr.approval?.approvedPriceImpactMinor ?? assessment?.priceImpactMinor ?? 0;
              const currency = cr.approval?.currency ?? assessment?.currency ?? "USD";
              return formatMinorAmount(priceMinor, currency);
            },
          },
          {
            key: "timeline",
            header: "Timeline",
            hideOnMobile: true,
            cell: (cr) => {
              const assessment = cr.assessments[0];
              return assessment?.timelineImpactDays ? `+${assessment.timelineImpactDays}d` : "—";
            },
          },
          {
            key: "submitted",
            header: "Submitted",
            hideOnMobile: true,
            cell: (cr) => (cr.submittedAt ? new Date(cr.submittedAt).toLocaleDateString() : "—"),
          },
        ]}
      />
    </AdminListPage>
  );
}
