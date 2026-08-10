import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listSalesInboxThreads, type SalesInboxView } from "@/lib/crm/inbox/threads";
import { listInboxEmails } from "@/lib/crm/inbound/inbox";
import { contactDisplayName } from "@/lib/crm/normalize";
import {
  CRM_LEAD_STATUS_LABELS,
  CRM_LEAD_TEMPERATURE_LABELS,
  CRM_THREAD_WORKFLOW_LABELS,
  formatDateTime,
} from "@/lib/crm/display";
import { waitingDurationLabel } from "@/lib/crm/inbox/subject";
import { CrmPagination } from "@/components/admin/crm/CrmPagination";
import { InboxSyncButton } from "@/components/admin/crm/InboxDetailActions";
import { AdminStatGrid, AdminSection } from "@/components/admin/patterns/AdminDashboardPanels";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const VIEWS: Array<{ value: SalesInboxView; label: string }> = [
  { value: "needs_reply", label: "Needs reply" },
  { value: "waiting", label: "Waiting on contact" },
  { value: "snoozed", label: "Snoozed" },
  { value: "needs_review", label: "Needs review" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

export default async function CrmInboxPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    q?: string;
    page?: string;
    assigned?: string;
  }>;
}) {
  const user = await requireAdminUser("view_crm");
  const sp = await searchParams;
  const view = (VIEWS.some((v) => v.value === sp.view) ? sp.view : "needs_reply") as SalesInboxView;
  const page = Math.max(1, Number(sp.page || 1));
  const assigned = sp.assigned;

  const data = await listSalesInboxThreads({
    view,
    search: sp.q,
    page,
    userId: user.id,
    assignedToId: assigned === "me" ? user.id : assigned && assigned !== "unassigned" ? assigned : undefined,
    unassigned: assigned === "unassigned",
  });

  const reviewMessages =
    view === "needs_review"
      ? await listInboxEmails({ filter: "needs_review", search: sp.q, page: 1, pageSize: 50 })
      : null;

  function hrefForPage(p: number) {
    const params = new URLSearchParams();
    params.set("view", view);
    if (sp.q) params.set("q", sp.q);
    if (assigned) params.set("assigned", assigned);
    if (p > 1) params.set("page", String(p));
    return `/admin/crm/inbox?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Inbox"
        description="Human conversation workspace — what needs your attention right now."
        action={can(user.role, "manage_crm") ? <InboxSyncButton /> : undefined}
      />

      <AdminStatGrid
        stats={[
          { label: "Needs reply", value: data.counts.needsReply },
          { label: "Waiting", value: data.counts.waiting },
          { label: "Snoozed", value: data.counts.snoozed },
          { label: "Needs review", value: data.counts.needsReview },
          { label: "Unassigned", value: data.counts.unassigned },
        ]}
      />

      <form className="flex flex-wrap items-end gap-3" action="/admin/crm/inbox" method="get">
        <input type="hidden" name="view" value={view} />
        <Input
          name="q"
          label="Search"
          defaultValue={sp.q ?? ""}
          placeholder="Search contact, email, company, subject…"
          className="min-w-[220px] flex-1"
        />
        <Select name="assigned" label="Owner" defaultValue={assigned ?? ""} className="min-w-[160px]">
          <option value="">All owners</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
        </Select>
        <Button type="submit" size="sm">
          Filter
        </Button>
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        {VIEWS.map(({ value, label }) => (
          <Link
            key={value}
            href={`/admin/crm/inbox?view=${value}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${assigned ? `&assigned=${assigned}` : ""}`}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition-colors",
              view === value
                ? "bg-primary text-primary-foreground"
                : "bg-surface-muted text-foreground hover:bg-surface-muted/80",
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {view === "needs_reply" && !data.items.length ? (
        <AdminPanel>
          <p className="font-medium text-foreground">You&apos;re all caught up.</p>
          <p className="mt-1 text-sm text-muted">No conversations need a reply right now.</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/admin/crm/inbox?view=waiting" className="text-accent-text hover:underline">
              View waiting
            </Link>
            <Link href="/admin/crm/inbox?view=snoozed" className="text-accent-text hover:underline">
              View snoozed
            </Link>
            <Link href="/admin/crm/inbox?view=all" className="text-accent-text hover:underline">
              View all
            </Link>
          </div>
        </AdminPanel>
      ) : null}

      <AdminPanel flush className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="p-3">Contact</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Status</th>
              <th className="p-3">Owner</th>
              <th className="p-3">Lead</th>
              <th className="p-3">Last activity</th>
              <th className="p-3">Waiting</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((thread) => {
              const contact = thread.contact;
              const lead = contact?.leads[0];
              const latest = thread.emails[0];
              const waiting =
                thread.workflowStatus === "NEEDS_REPLY"
                  ? waitingDurationLabel(thread.needsReplySince)
                  : null;
              const userState = "userStates" in thread ? thread.userStates?.[0] : undefined;
              const unread =
                thread.workflowStatus === "NEEDS_REPLY" &&
                (!userState?.lastReadAt ||
                  (thread.lastActivityAt && userState.lastReadAt < thread.lastActivityAt));

              return (
                <tr key={thread.id} className="border-b border-border">
                  <td className="p-3">
                    {contact ? (
                      <div>
                        <Link
                          href={`/admin/crm/contacts/${contact.id}`}
                          className="font-medium text-accent-text hover:underline"
                        >
                          {contactDisplayName(contact)}
                        </Link>
                        {contact.company ? (
                          <p className="text-xs text-muted">{contact.company.name}</p>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/crm/inbox/threads/${thread.id}`}
                      className={cn("hover:underline", unread ? "font-semibold text-foreground" : "text-accent-text")}
                    >
                      {thread.subjectNormalized}
                    </Link>
                    {thread.snippet ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted">{thread.snippet}</p>
                    ) : null}
                    {latest?.openDetectedCount || latest?.clickDetectedCount ? (
                      <p className="mt-0.5 text-xs text-subtle">
                        {latest.openDetectedCount ? "Open" : null}
                        {latest.openDetectedCount && latest.clickDetectedCount ? " · " : null}
                        {latest.clickDetectedCount ? "Click" : null}
                        {latest.matchConfidence === "EXACT_THREAD" && !latest.isAutomated ? " · Reply" : null}
                      </p>
                    ) : null}
                  </td>
                  <td className="p-3">{CRM_THREAD_WORKFLOW_LABELS[thread.workflowStatus]}</td>
                  <td className="p-3">{thread.assignedTo?.name ?? "—"}</td>
                  <td className="p-3">
                    {lead ? (
                      <span className="text-xs">
                        {CRM_LEAD_STATUS_LABELS[lead.status]}
                        {" · "}
                        {CRM_LEAD_TEMPERATURE_LABELS[lead.temperature]}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">{formatDateTime(thread.lastActivityAt)}</td>
                  <td className="p-3">{waiting ?? "—"}</td>
                </tr>
              );
            })}
            {!data.items.length && view !== "needs_reply" ? (
              <tr>
                <td colSpan={7} className="p-4 text-muted">
                  No conversations in this view.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </AdminPanel>

      <CrmPagination
        page={data.page}
        totalPages={Math.max(1, Math.ceil(data.total / data.pageSize))}
        total={data.total}
        hrefForPage={hrefForPage}
      />

      {reviewMessages?.items.length ? (
        <AdminSection title="Unmatched / review messages">
          <AdminPanel flush className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="p-3">Sender</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Received</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {reviewMessages.items.map((em) => (
                  <tr key={em.id} className="border-b border-border">
                    <td className="p-3">{em.fromAddress ?? "—"}</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/crm/inbox/messages/${em.id}`}
                        className="text-accent-text hover:underline"
                      >
                        {em.subject}
                      </Link>
                    </td>
                    <td className="p-3">{formatDateTime(em.receivedAt)}</td>
                    <td className="p-3">{em.reviewStatus ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminPanel>
        </AdminSection>
      ) : null}
    </div>
  );
}
