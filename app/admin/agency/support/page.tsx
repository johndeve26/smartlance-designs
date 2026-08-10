import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { listSupportRequestsForAdmin } from "@/lib/client-success/support";
import { SUPPORT_STATUS } from "@/lib/client-success/constants";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SemanticBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AgencySupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminUser("view_support");
  const params = await searchParams;

  const items = await listSupportRequestsForAdmin({
    status: params.status as never,
  });

  return (
    <AdminListPage
      title="Support Requests"
      description="Client support inbox — minimal internal tooling."
      filters={
        <form className="flex flex-wrap items-end gap-3">
          <Select name="status" label="Status" defaultValue={params.status ?? ""}>
            <option value="">All statuses</option>
            {Object.entries(SUPPORT_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Button type="submit" size="sm" variant="outline">
            Filter
          </Button>
        </form>
      }
      isEmpty={items.length === 0}
      empty={{ title: "No support requests", description: "Support requests from clients appear here." }}
    >
      <DataTable
        rows={items}
        rowKey={(s) => s.id}
        columns={[
          {
            key: "request",
            header: "Request",
            cell: (s) => (
              <>
                <Link href={`/admin/agency/support/${s.id}`} className="font-medium text-accent-text hover:underline">
                  {s.supportNumber}
                </Link>
                <p>{s.subject}</p>
              </>
            ),
          },
          {
            key: "website",
            header: "Website",
            cell: (s) => (
              <>
                {s.website.name}
                <p className="text-muted">{s.website.domain}</p>
              </>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (s) => (
              <SemanticBadge tone={s.status === "WAITING_ON_CLIENT" ? "warning" : "neutral"}>
                {SUPPORT_STATUS[s.status] ?? s.status}
              </SemanticBadge>
            ),
          },
          {
            key: "submitted",
            header: "Submitted by",
            hideOnMobile: true,
            cell: (s) =>
              s.submittedByContact.displayName ??
              s.submittedByContact.firstName ??
              s.submittedByContact.email,
          },
        ]}
      />
    </AdminListPage>
  );
}
