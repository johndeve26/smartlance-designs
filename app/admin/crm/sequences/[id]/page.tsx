import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getSequenceById } from "@/lib/crm/sequences/service";
import { listEnrollments } from "@/lib/crm/sequences/enrollment";
import { SEQUENCE_STATUS_LABELS, STEP_TYPE_LABELS } from "@/lib/crm/sequences/constants";
import { contactDisplayName } from "@/lib/crm/normalize";
import { CrmBadge } from "@/components/admin/crm/CrmShared";
import { SequenceActions } from "@/components/admin/crm/SequenceActions";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel, AdminSection } from "@/components/admin/patterns/AdminPanel";

export const dynamic = "force-dynamic";

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_crm");
  const { id } = await params;
  const sequence = await getSequenceById(id);
  if (!sequence) notFound();

  const enrollments = await listEnrollments({ sequenceId: id, pageSize: 20 });

  return (
    <div className="space-y-6">
      <Link href="/admin/crm/sequences" className="text-sm text-accent-text hover:underline">
        ← Sequences
      </Link>

      <AdminDetailHeader
        title={sequence.name}
        subtitle={`${SEQUENCE_STATUS_LABELS[sequence.status]} · v${sequence.version}`}
        primaryAction={
          can(user.role, "manage_crm") ? (
            <SequenceActions
              sequenceId={sequence.id}
              status={sequence.status}
              canSend={can(user.role, "send_crm_email")}
            />
          ) : undefined
        }
        secondaryActions={
          <CrmBadge tone={sequence.status === "ACTIVE" ? "success" : "neutral"}>
            {SEQUENCE_STATUS_LABELS[sequence.status]}
          </CrmBadge>
        }
      />

      <AdminSection title="Steps">
        <AdminPanel>
          <ol className="space-y-3">
            {sequence.steps.map((step) => (
              <li key={step.id} className="rounded-md border border-border px-3 py-2 text-sm">
                <p className="font-medium">
                  {step.position + 1}. {STEP_TYPE_LABELS[step.type]}
                  {step.delayDays || step.delayMinutes ? (
                    <span className="text-muted">
                      {" "}
                      · after {step.delayDays}d {step.delayMinutes}m
                    </span>
                  ) : null}
                </p>
                {step.type === "EMAIL" ? (
                  <p className="text-muted">Subject: {step.subject}</p>
                ) : null}
                {step.type === "TASK" ? <p className="text-muted">{step.taskTitle}</p> : null}
              </li>
            ))}
          </ol>
        </AdminPanel>
      </AdminSection>

      <AdminSection title="Enrollments">
        <AdminPanel flush>
          <ul className="divide-y divide-border text-sm">
            {enrollments.items.map((e) => (
              <li key={e.id} className="flex justify-between px-4 py-2">
                <Link
                  href={`/admin/crm/contacts/${e.contactId}`}
                  className="text-accent-text hover:underline"
                >
                  {contactDisplayName(e.contact)}
                </Link>
                <span className="text-muted">
                  {e.status} · step {e.currentStep + 1}
                </span>
              </li>
            ))}
            {!enrollments.items.length ? (
              <li className="px-4 py-6 text-muted">No enrollments yet.</li>
            ) : null}
          </ul>
        </AdminPanel>
      </AdminSection>
    </div>
  );
}
