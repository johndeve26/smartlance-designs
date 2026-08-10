import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listSegments, countSegmentMatches, parseSegmentFilter } from "@/lib/crm/segments/service";
import { SegmentForm } from "@/components/admin/crm/SegmentForm";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { AdminPanel, AdminSection } from "@/components/admin/patterns/AdminPanel";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function CrmSegmentsPage() {
  const user = await requireAdminUser("view_crm");
  const segments = await listSegments();

  const withCounts = await Promise.all(
    segments.map(async (s) => {
      try {
        const filter = parseSegmentFilter(s.filterJson);
        const count = await countSegmentMatches(filter);
        return { ...s, matchCount: count };
      } catch {
        return { ...s, matchCount: 0 };
      }
    }),
  );

  return (
    <div className="space-y-6">
      <AdminListPage
        title="Segments"
        description="Saved CRM audiences for deliberate outreach enrollment."
        isEmpty={withCounts.length === 0}
        empty={{ title: "No segments yet" }}
      >
        <DataTable
          rows={withCounts}
          rowKey={(s) => s.id}
          columns={[
            {
              key: "name",
              header: "Name",
              cell: (s) => (
                <Link
                  href={`/admin/crm/segments/${s.id}`}
                  className="font-medium text-accent-text hover:underline"
                >
                  {s.name}
                </Link>
              ),
            },
            { key: "matches", header: "Matches", cell: (s) => s.matchCount },
            {
              key: "updated",
              header: "Updated",
              hideOnMobile: true,
              cell: (s) => formatDate(s.updatedAt) ?? "—",
            },
            { key: "creator", header: "Creator", hideOnMobile: true, cell: (s) => s.createdBy.name },
          ]}
        />
      </AdminListPage>

      {can(user.role, "manage_crm") ? (
        <AdminSection title="New segment">
          <AdminPanel className="max-w-xl">
            <SegmentForm />
          </AdminPanel>
        </AdminSection>
      ) : null}
    </div>
  );
}
