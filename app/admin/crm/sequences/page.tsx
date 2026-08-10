import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listSequences } from "@/lib/crm/sequences/service";
import { SEQUENCE_STATUS_LABELS } from "@/lib/crm/sequences/constants";
import { CrmBadge } from "@/components/admin/crm/CrmShared";
import { SequenceForm } from "@/components/admin/crm/SequenceForm";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { AdminPanel, AdminSection } from "@/components/admin/patterns/AdminPanel";
import { DataTable } from "@/components/ui/data-table";

export const dynamic = "force-dynamic";

export default async function CrmSequencesPage() {
  const user = await requireAdminUser("view_crm");
  const sequences = await listSequences();

  return (
    <div className="space-y-6">
      <AdminListPage
        title="Sequences"
        description="Controlled sales outreach workflows with email, wait, and task steps."
        isEmpty={sequences.length === 0}
        empty={{ title: "No sequences yet" }}
      >
        <DataTable
          rows={sequences}
          rowKey={(s) => s.id}
          columns={[
            {
              key: "name",
              header: "Name",
              cell: (s) => (
                <Link
                  href={`/admin/crm/sequences/${s.id}`}
                  className="font-medium text-accent-text hover:underline"
                >
                  {s.name}
                </Link>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (s) => (
                <CrmBadge tone={s.status === "ACTIVE" ? "success" : "neutral"}>
                  {SEQUENCE_STATUS_LABELS[s.status]}
                </CrmBadge>
              ),
            },
            { key: "steps", header: "Steps", cell: (s) => s._count.steps },
            { key: "enrollments", header: "Active enrollments", cell: (s) => s._count.enrollments },
          ]}
        />
      </AdminListPage>

      {can(user.role, "manage_crm") ? (
        <AdminSection title="New sequence">
          <AdminPanel className="max-w-xl">
            <SequenceForm />
          </AdminPanel>
        </AdminSection>
      ) : null}
    </div>
  );
}
