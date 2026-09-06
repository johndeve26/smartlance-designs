import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getThreadDetail } from "@/lib/crm/inbox/threads";
import { getThreadReplyDraft } from "@/lib/crm/inbox/reply";
import { markThreadRead } from "@/lib/crm/inbox/workflow";
import { listCrmOwnersAction } from "@/lib/admin/crm-inbox-actions";
import { listEmailTemplates } from "@/lib/crm/email";
import { contactDisplayName } from "@/lib/crm/normalize";
import {
  CRM_EMAIL_STATUS_LABELS,
  CRM_LEAD_STATUS_LABELS,
  CRM_LEAD_TEMPERATURE_LABELS,
  CRM_THREAD_WORKFLOW_LABELS,
  formatDateTime,
} from "@/lib/crm/display";
import { ThreadReplyComposer } from "@/components/admin/crm/ThreadReplyComposer";
import { ThreadWorkflowPanel } from "@/components/admin/crm/ThreadWorkflowPanel";
import { ThreadQuickActions } from "@/components/admin/crm/ThreadQuickActions";
import { ThreadFollowUpPanel } from "@/components/admin/crm/ThreadFollowUpPanel";
import { ThreadDeliveryWarning } from "@/components/admin/crm/ThreadDeliveryWarning";
import { getThreadFollowUpDefaultsAction } from "@/lib/admin/crm-inbox-actions";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel, AdminSection } from "@/components/admin/patterns/AdminPanel";
import { listCrmSenderProfileOptions } from "@/lib/email/routing/crm-sender-options";

export const dynamic = "force-dynamic";

export default async function CrmInboxThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const user = await requireAdminUser("view_crm");
  const { threadId } = await params;
  const thread = await getThreadDetail(threadId, user.id);
  if (!thread) notFound();

  await markThreadRead({ threadId, userId: user.id });

  const draft = can(user.role, "send_crm_email")
    ? await getThreadReplyDraft(threadId, user.id)
    : null;
  const owners = can(user.role, "manage_crm") ? await listCrmOwnersAction() : [];
  const templates = can(user.role, "send_crm_email")
    ? await listEmailTemplates(true)
    : [];
  const activeLead = thread.contact?.leads[0] ?? thread.lead;
  const followUpDefaults = can(user.role, "manage_crm")
    ? await getThreadFollowUpDefaultsAction(threadId)
    : { title: "Follow up", assigneeId: null };
  const senderOptions = can(user.role, "send_crm_email")
    ? await listCrmSenderProfileOptions()
    : {
        profiles: [],
        defaultProfileId: null,
        routedDefault: {
          profileId: null,
          fromName: "",
          fromEmail: "",
          source: "legacy",
        },
      };

  return (
    <div className="space-y-6">
      <Link href="/admin/crm/inbox" className="text-sm text-accent-text hover:underline">
        ← Inbox
      </Link>

      <AdminDetailHeader
        title={thread.subjectNormalized ?? "Conversation"}
        subtitle={[
          thread.contact ? contactDisplayName(thread.contact) : "Unknown contact",
          thread.contact?.company?.name,
        ]
          .filter(Boolean)
          .join(" · ")}
      />

      {can(user.role, "manage_crm") ? (
        <ThreadWorkflowPanel
          threadId={thread.id}
          workflowStatus={thread.workflowStatus}
          assignedToId={thread.assignedToId}
          owners={owners}
          canManage
        />
      ) : (
        <p className="text-sm text-muted">
          Status: {CRM_THREAD_WORKFLOW_LABELS[thread.workflowStatus]}
        </p>
      )}

      {thread.uncertainOutbound && can(user.role, "manage_crm") ? (
        <ThreadDeliveryWarning emailId={thread.uncertainOutbound.id} canManage />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <AdminPanel flush>
            <div className="divide-y divide-border">
              {thread.emails.map((em) => (
                <article key={em.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium">
                        {em.direction === "INBOUND" ? "Inbound" : "Outbound"}
                        {em.origin === "THREAD_REPLY"
                          ? " · Thread reply"
                          : em.origin
                            ? ` · ${em.origin}`
                            : ""}
                      </p>
                      <p className="text-muted">
                        {em.direction === "INBOUND"
                          ? em.fromAddress
                          : (thread.contact?.email ?? "—")}
                      </p>
                    </div>
                    <time className="text-muted">
                      {formatDateTime(em.receivedAt ?? em.sentAt ?? em.createdAt)}
                    </time>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                    {em.deliveryStatus ? <span>{em.deliveryStatus}</span> : null}
                    {em.openDetectedCount ? (
                      <span>Open detected ({em.openDetectedCount})</span>
                    ) : null}
                    {em.clickDetectedCount ? (
                      <span>Click detected ({em.clickDetectedCount})</span>
                    ) : null}
                    {em.matchConfidence === "EXACT_THREAD" && !em.isAutomated ? (
                      <span>Verified reply</span>
                    ) : null}
                    {em.isAutomated ? <span>Automated response</span> : null}
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap text-sm text-foreground">{em.bodyText}</pre>
                  {em.bodyHtml ? (
                    <details className="mt-2 text-sm">
                      <summary className="cursor-pointer text-muted">HTML view</summary>
                      <div
                        className="prose mt-2 max-w-none text-sm"
                        dangerouslySetInnerHTML={{ __html: em.bodyHtml }}
                      />
                    </details>
                  ) : null}
                </article>
              ))}
              {!thread.emails.length ? (
                <p className="p-4 text-sm text-muted">No messages in this thread yet.</p>
              ) : null}
            </div>
          </AdminPanel>

          {thread.contactId ? (
            <AdminPanel>
              <ThreadReplyComposer
                threadId={thread.id}
                initialBody={draft?.bodyText ?? ""}
                canSend={can(user.role, "send_crm_email")}
                canChooseSender={can(user.role, "choose_email_sender")}
                templates={templates.map((t) => ({ id: t.id, name: t.name }))}
                sendingProfiles={senderOptions.profiles}
                defaultSendingProfileId={senderOptions.defaultProfileId}
              />
            </AdminPanel>
          ) : (
            <p className="text-sm text-muted">Link this thread to a contact before replying.</p>
          )}
        </div>

        <aside className="space-y-4">
          <AdminSection title="Context">
            <AdminPanel>
              {thread.contact ? (
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted">Contact</dt>
                    <dd>
                      <Link
                        href={`/admin/crm/contacts/${thread.contact.id}`}
                        className="text-accent-text hover:underline"
                      >
                        {contactDisplayName(thread.contact)}
                      </Link>
                    </dd>
                  </div>
                  {thread.contact.company ? (
                    <div>
                      <dt className="text-muted">Company</dt>
                      <dd>
                        <Link
                          href={`/admin/crm/companies/${thread.contact.company.id}`}
                          className="text-accent-text hover:underline"
                        >
                          {thread.contact.company.name}
                        </Link>
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-muted">Email status</dt>
                    <dd>{CRM_EMAIL_STATUS_LABELS[thread.contact.emailStatus]}</dd>
                  </div>
                </dl>
              ) : null}
              {activeLead ? (
                <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                  <div>
                    <dt className="text-muted">Lead</dt>
                    <dd>
                      <Link
                        href={`/admin/crm/leads/${activeLead.id}`}
                        className="text-accent-text hover:underline"
                      >
                        {CRM_LEAD_STATUS_LABELS[activeLead.status]} ·{" "}
                        {CRM_LEAD_TEMPERATURE_LABELS[activeLead.temperature]}
                      </Link>
                    </dd>
                  </div>
                </dl>
              ) : null}
              {thread.deal ? (
                <div className="mt-3 border-t border-border pt-3 text-sm">
                  <p className="text-muted">Deal</p>
                  <Link
                    href={`/admin/crm/deals/${thread.deal.id}`}
                    className="text-accent-text hover:underline"
                  >
                    {thread.deal.title}
                  </Link>
                </div>
              ) : null}
            </AdminPanel>
          </AdminSection>

          <AdminSection title="Tasks">
            <AdminPanel>
              <ul className="space-y-2 text-sm">
                {thread.tasks.map((t) => (
                  <li key={t.id} className="rounded-md border border-border px-3 py-2">
                    {t.title}
                    {t.taskType === "REPLY_REQUIRED" ? " · Reply required" : ""}
                    {t.dueAt ? ` · due ${formatDateTime(t.dueAt)}` : ""}
                  </li>
                ))}
                {!thread.tasks.length ? (
                  <li className="text-muted">No open tasks.</li>
                ) : null}
              </ul>
            </AdminPanel>
          </AdminSection>

          {thread.contactId ? (
            <AdminPanel>
              <ThreadFollowUpPanel
                threadId={thread.id}
                defaultTitle={followUpDefaults.title}
                defaultAssigneeId={followUpDefaults.assigneeId}
                owners={owners}
                nextFollowUp={thread.nextFollowUp}
                canManage={can(user.role, "manage_crm")}
              />
            </AdminPanel>
          ) : null}

          {thread.contactId ? (
            <AdminPanel>
              <ThreadQuickActions
                threadId={thread.id}
                leadId={activeLead?.id}
                contactId={thread.contactId}
                defaultAssigneeId={followUpDefaults.assigneeId}
                canManage={can(user.role, "manage_crm")}
              />
            </AdminPanel>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
