import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { listManagedWebsitesForAdmin } from "@/lib/client-success/websites";
import { MANAGED_WEBSITE_STATUS, WEBSITE_CARE_STATUS } from "@/lib/client-success/constants";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { SemanticBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AgencyWebsitesPage() {
  await requireAdminUser("view_websites");
  const websites = await listManagedWebsitesForAdmin();

  return (
    <AdminListPage
      title="Managed Websites"
      description="Ongoing client website relationships after launch."
      action={
        <Button asChild size="sm">
          <Link href="/admin/agency/websites/new">New website</Link>
        </Button>
      }
      isEmpty={websites.length === 0}
      empty={{ title: "No managed websites yet", description: "Add a website to track care and support." }}
    >
      <DataTable
        rows={websites}
        rowKey={(w) => w.id}
        columns={[
          {
            key: "website",
            header: "Website",
            cell: (w) => (
              <>
                <Link href={`/admin/agency/websites/${w.id}`} className="font-medium text-accent-text hover:underline">
                  {w.name}
                </Link>
                <p className="text-muted">{w.domain}</p>
              </>
            ),
          },
          { key: "company", header: "Company", cell: (w) => w.company?.name ?? "—" },
          {
            key: "status",
            header: "Status",
            cell: (w) => (
              <SemanticBadge tone="neutral">{MANAGED_WEBSITE_STATUS[w.status] ?? w.status}</SemanticBadge>
            ),
          },
          {
            key: "care",
            header: "Care",
            hideOnMobile: true,
            cell: (w) => WEBSITE_CARE_STATUS[w.careStatus] ?? w.careStatus,
          },
          {
            key: "support",
            header: "Support",
            hideOnMobile: true,
            cell: (w) => w._count.supportRequests,
          },
        ]}
      />
    </AdminListPage>
  );
}
