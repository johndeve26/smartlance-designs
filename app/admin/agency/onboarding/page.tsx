import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { listOnboardings } from "@/lib/onboarding";
import { ONBOARDING_STATUS_LABELS, ONBOARDING_WAITING_ON_LABELS } from "@/lib/onboarding/constants";
import { contactDisplayName } from "@/lib/crm/normalize";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SemanticBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AgencyOnboardingListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdminUser("view_onboarding");
  const params = await searchParams;
  const result = await listOnboardings({
    status: params.status as never,
    search: params.q,
  });

  return (
    <AdminListPage
      title="Client onboarding"
      description="Track onboarding progress across active projects."
      filters={
        <form className="flex flex-wrap items-end gap-3">
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search project…"
            className="min-w-[200px]"
          />
          <Select name="status" label="Status" defaultValue={params.status ?? ""}>
            <option value="">All statuses</option>
            {Object.entries(ONBOARDING_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Button type="submit" size="sm" variant="outline">
            Filter
          </Button>
        </form>
      }
      isEmpty={result.items.length === 0}
      empty={{ title: "No onboarding records yet", description: "Onboarding starts when a project enters the onboarding phase." }}
    >
      <DataTable
        rows={result.items}
        rowKey={(item) => item.id}
        columns={[
          {
            key: "project",
            header: "Project",
            cell: (item) => (
              <>
                <Link href={`/admin/agency/onboarding/${item.id}`} className="font-medium text-accent-text hover:underline">
                  {item.project.projectNumber} · {item.project.name}
                </Link>
                <p className="text-muted">{contactDisplayName(item.project.primaryContact)}</p>
              </>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (item) => (
              <SemanticBadge tone="info">{ONBOARDING_STATUS_LABELS[item.status]}</SemanticBadge>
            ),
          },
          {
            key: "progress",
            header: "Progress",
            hideOnMobile: true,
            cell: (item) => `${item.progress.percentComplete}%`,
          },
          {
            key: "waiting",
            header: "Waiting on",
            hideOnMobile: true,
            cell: (item) => ONBOARDING_WAITING_ON_LABELS[item.waitingOn],
          },
          {
            key: "due",
            header: "Due",
            hideOnMobile: true,
            cell: (item) =>
              item.targetCompletionDate
                ? new Date(item.targetCompletionDate).toLocaleDateString()
                : "—",
          },
        ]}
      />
    </AdminListPage>
  );
}
