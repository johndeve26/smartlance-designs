import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getInboxEmailById } from "@/lib/crm/inbound/inbox";
import { contactDisplayName } from "@/lib/crm/normalize";
import { formatDateTime } from "@/lib/crm/display";
import { InboxDetailActions } from "@/components/admin/crm/InboxDetailActions";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel, AdminSection } from "@/components/admin/patterns/AdminPanel";

export const dynamic = "force-dynamic";

export default async function CrmInboxMessageReviewPage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const user = await requireAdminUser("view_crm");
  const { messageId } = await params;
  const email = await getInboxEmailById(messageId);
  if (!email) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/crm/inbox?view=needs_review"
        className="text-sm text-accent-text hover:underline"
      >
        ← Inbox review
      </Link>

      <AdminDetailHeader
        title={email.subject}
        subtitle={`From ${email.fromAddress} · ${formatDateTime(email.receivedAt)}`}
      />

      {can(user.role, "manage_crm") ? (
        <InboxDetailActions emailId={email.id} contactId={email.contactId} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminSection title="Message" className="lg:col-span-2">
          <AdminPanel>
            <pre className="whitespace-pre-wrap text-sm text-foreground">{email.bodyText}</pre>
            {email.bodyHtml ? (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted">Sanitized HTML view</summary>
                <div
                  className="prose mt-2 max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                />
              </details>
            ) : null}
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Context">
          <AdminPanel>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted">Status</dt>
                <dd>{email.reviewStatus ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Match</dt>
                <dd>{email.matchConfidence ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Automated</dt>
                <dd>{email.isAutomated ? "Yes" : "No"}</dd>
              </div>
              {email.contact ? (
                <div>
                  <dt className="text-muted">Contact</dt>
                  <dd>
                    <Link
                      href={`/admin/crm/contacts/${email.contact.id}`}
                      className="text-accent-text hover:underline"
                    >
                      {contactDisplayName(email.contact)}
                    </Link>
                  </dd>
                </div>
              ) : null}
              {email.thread ? (
                <div>
                  <dt className="text-muted">Thread</dt>
                  <dd>
                    <Link
                      href={`/admin/crm/inbox/threads/${email.thread.id}`}
                      className="text-accent-text hover:underline"
                    >
                      Open conversation
                    </Link>
                  </dd>
                </div>
              ) : null}
              {email.replyToOutbound ? (
                <div>
                  <dt className="text-muted">In reply to</dt>
                  <dd>{email.replyToOutbound.subject}</dd>
                </div>
              ) : null}
            </dl>
          </AdminPanel>
        </AdminSection>
      </div>
    </div>
  );
}
