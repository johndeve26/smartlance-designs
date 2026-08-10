import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { getCrmDashboardMetrics } from "@/lib/crm/dashboard";
import { CRM_DEAL_STAGE_LABELS, CRM_ACTIVITY_TYPE_LABELS } from "@/lib/crm/display";
import { contactDisplayName } from "@/lib/crm/normalize";
import {
  AdminSection,
  AdminStatGrid,
} from "@/components/admin/patterns/AdminDashboardPanels";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function CrmOverviewPage() {
  await requireAdminUser("view_crm");
  const data = await getCrmDashboardMetrics();

  return (
    <div className="space-y-8">
      <PageHeader
        title="CRM"
        description="Sales workspace — follow-ups, pipeline, and contact history."
      />

      <AdminStatGrid
        stats={[
          { label: "Open Leads", value: data.cards.openLeads, href: "/admin/crm/leads" },
          {
            label: "Warm / Hot Leads",
            value: data.cards.warmHotLeads,
            href: "/admin/crm/leads?temperature=WARM",
          },
          { label: "Open Deals", value: data.cards.openDeals, href: "/admin/crm/deals" },
          {
            label: "Pipeline Value",
            value: `$${data.cards.pipelineValue.toLocaleString()}`,
            href: "/admin/crm/deals",
          },
          {
            label: "Tasks Due Today",
            value: data.cards.tasksDueToday,
            href: "/admin/crm/tasks?view=today",
          },
          {
            label: "Overdue Tasks",
            value: data.cards.overdueTasks,
            href: "/admin/crm/tasks?view=overdue",
          },
          {
            label: "Uncontacted New Leads",
            value: data.cards.uncontactedNewLeads,
            href: "/admin/crm/leads?status=NEW",
          },
          {
            label: "Emails Sent Today",
            value: data.cards.emailsSentToday,
            href: "/admin/crm/outreach",
          },
          {
            label: "Sequence Emails Today",
            value: data.cards.sequenceEmailsSentToday,
            href: "/admin/crm/sequences",
          },
          {
            label: "Tasks Completed Today",
            value: data.cards.tasksCompletedToday,
            href: "/admin/crm/tasks",
          },
          {
            label: "Active Enrollments",
            value: data.cards.activeEnrollments,
            href: "/admin/crm/sequences",
          },
          {
            label: "Failed Enrollments",
            value: data.cards.sequencesNeedingAttention,
            href: "/admin/crm/outreach",
          },
          {
            label: "Inbox Needs Review",
            value: data.cards.inboxNeedsReview,
            href: "/admin/crm/inbox?filter=needs_review",
          },
          {
            label: "Verified Replies Today",
            value: data.cards.verifiedRepliesToday,
            href: "/admin/crm/inbox",
          },
          {
            label: "Unmatched Inbound",
            value: data.cards.unmatchedInbound,
            href: "/admin/crm/inbox?filter=unmatched",
          },
          {
            label: "Reply Review Tasks",
            value: data.cards.replyReviewTasks,
            href: "/admin/crm/tasks",
          },
        ]}
      />

      <AdminSection title="Today">
        <AdminPanel>
          <div className="grid gap-6 lg:grid-cols-2">
            <TaskList title="Overdue tasks" items={data.today.overdueTasks} empty="No overdue tasks." />
            <TaskList title="Due today" items={data.today.tasksDueToday} empty="Nothing due today." />
          </div>
        </AdminPanel>
      </AdminSection>

      <AdminSection title="Pipeline">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {data.pipeline.map((row) => (
            <div key={row.stage} className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs font-semibold uppercase text-muted">
                {CRM_DEAL_STAGE_LABELS[row.stage]}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{row.count}</p>
              {row.totalAmount > 0 ? (
                <p className="text-xs text-muted">${row.totalAmount.toLocaleString()}</p>
              ) : null}
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Recent Activity">
        <AdminPanel flush>
          <ul className="divide-y divide-border">
            {data.recentActivity.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <Link
                    href={`/admin/crm/contacts/${a.contactId}`}
                    className="font-medium text-accent-text hover:underline"
                  >
                    {contactDisplayName(a.contact)}
                  </Link>
                  <p className="text-muted">
                    {CRM_ACTIVITY_TYPE_LABELS[a.type] ?? a.type}
                    {a.subject ? ` — ${a.subject}` : ""}
                  </p>
                </div>
                <time className="text-muted">{new Date(a.occurredAt).toLocaleString()}</time>
              </li>
            ))}
            {!data.recentActivity.length ? (
              <li className="px-4 py-6 text-sm text-muted">No activity yet.</li>
            ) : null}
          </ul>
        </AdminPanel>
      </AdminSection>
    </div>
  );
}

function TaskList({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{
    id: string;
    title: string;
    dueAt: Date | null;
    contact: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      displayName: string | null;
      email: string | null;
    } | null;
  }>;
  empty: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((t) => (
          <li key={t.id} className="rounded-md border border-border px-3 py-2 text-sm">
            <p className="font-medium">{t.title}</p>
            {t.contact ? (
              <Link
                href={`/admin/crm/contacts/${t.contact.id}`}
                className="text-accent-text hover:underline"
              >
                {contactDisplayName(t.contact)}
              </Link>
            ) : null}
            {t.dueAt ? (
              <p className="text-xs text-muted">Due {formatDate(t.dueAt)}</p>
            ) : null}
          </li>
        ))}
        {!items.length ? <li className="text-sm text-muted">{empty}</li> : null}
      </ul>
    </div>
  );
}
