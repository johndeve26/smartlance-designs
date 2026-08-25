import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getContactById } from "@/lib/crm/contacts";
import { listContactActivities } from "@/lib/crm/activities";
import { listContactEmailHistory } from "@/lib/crm/outreach/analytics";
import { listContactConversations } from "@/lib/crm/inbound/inbox";
import { listEnrollments } from "@/lib/crm/sequences/enrollment";
import { prisma } from "@/lib/db";
import { contactDisplayName } from "@/lib/crm/normalize";
import {
  CRM_ACTIVITY_TYPE_LABELS,
  CRM_DEAL_STAGE_LABELS,
  CRM_EMAIL_STATUS_LABELS,
  CRM_LEAD_STATUS_LABELS,
  CRM_LEAD_TEMPERATURE_LABELS,
  CRM_LIFECYCLE_LABELS,
  CRM_SOURCE_LABELS,
  formatCurrency,
  formatDateTime,
  temperatureTone,
} from "@/lib/crm/display";
import { CrmBadge } from "@/components/admin/crm/CrmShared";
import { ContactDetailActions } from "@/components/admin/crm/ContactDetailActions";
import { listProjectsForContact } from "@/lib/agency/projects";
import {
  AGENCY_PROJECT_HEALTH_LABELS,
  AGENCY_PROJECT_STATUS_LABELS,
} from "@/lib/agency/constants";
import { formatDate } from "@/lib/ui/format";
import { formatContactLocation } from "@/lib/crm/country";
import { formatPropertyValueForDisplay } from "@/lib/crm/properties/validate";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/crm/social";
import { ContactProspectPanel } from "@/components/admin/prospect/ContactProspectPanel";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { AdminPanel, AdminSection } from "@/components/admin/patterns/AdminPanel";
import { Button } from "@/components/ui/button";
import { listEmailTemplates } from "@/lib/crm/email";
import { listCrmSenderProfileOptions } from "@/lib/email/routing/crm-sender-options";

export const dynamic = "force-dynamic";

export default async function CrmContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_crm");
  const { id } = await params;
  const contact = await getContactById(id);
  if (!contact) notFound();

  const activities = await listContactActivities({ contactId: id, pageSize: 30 });
  const emailHistory = await listContactEmailHistory(id);
  const inboundMessages = await listContactConversations(id);
  const enrollments = await listEnrollments({ contactId: id, pageSize: 10 });
  const linkedProjects = can(user.role, "view_projects")
    ? await listProjectsForContact(id)
    : [];
  const activeSequences = can(user.role, "send_crm_email")
    ? await prisma.crmSequence.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];
  const activeLead = contact.leads.find(
    (l) => l.status !== "UNQUALIFIED" && l.status !== "CLOSED",
  );
  const senderOptions = can(user.role, "send_crm_email")
    ? await listCrmSenderProfileOptions()
    : { profiles: [], defaultProfileId: null };
  const emailTemplates = can(user.role, "send_crm_email")
    ? (await listEmailTemplates(true)).map((t) => ({ id: t.id, name: t.name }))
    : [];

  return (
    <div className="space-y-6">
      <Link href="/admin/crm/contacts" className="text-sm text-accent-text hover:underline">
        ← Contacts
      </Link>

      <AdminDetailHeader
        title={contactDisplayName(contact)}
        secondaryActions={
          <div className="flex flex-wrap items-center gap-2">
            <CrmBadge>{CRM_LIFECYCLE_LABELS[contact.lifecycleStage]}</CrmBadge>
            {activeLead ? (
              <>
                <CrmBadge>{CRM_LEAD_STATUS_LABELS[activeLead.status]}</CrmBadge>
                <CrmBadge tone={temperatureTone(activeLead.temperature)}>
                  {CRM_LEAD_TEMPERATURE_LABELS[activeLead.temperature]}
                </CrmBadge>
              </>
            ) : null}
            <CrmBadge tone={contact.emailStatus === "SENDABLE" ? "success" : "warning"}>
              {CRM_EMAIL_STATUS_LABELS[contact.emailStatus]}
            </CrmBadge>
          </div>
        }
        primaryAction={
          can(user.role, "manage_crm") ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/crm/contacts/${id}/edit`}>Edit contact</Link>
            </Button>
          ) : undefined
        }
      />

      {can(user.role, "manage_crm") || can(user.role, "send_crm_email") ? (
        <ContactDetailActions
          contact={contact}
          activeLead={activeLead ?? null}
          canSendEmail={can(user.role, "send_crm_email")}
          canChooseSender={can(user.role, "choose_email_sender")}
          canManageOutreach={can(user.role, "manage_crm")}
          activeSequences={activeSequences}
          enrollments={enrollments.items}
          sendingProfiles={senderOptions.profiles}
          defaultSendingProfileId={senderOptions.defaultProfileId}
          emailTemplates={emailTemplates}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminSection title="Contact information" className="lg:col-span-1">
          <AdminPanel>
            <dl className="space-y-2 text-sm">
              <Row label="Email" value={contact.email} />
              <Row label="Phone" value={contact.phone} />
              <Row label="Job title" value={contact.jobTitle} />
              <Row label="Company" value={contact.company?.name} />
              <Row label="Location" value={formatContactLocation(contact) || undefined} />
              <Row label="Source" value={CRM_SOURCE_LABELS[contact.source]} />
              <Row label="Source detail" value={contact.sourceDetail} />
              <Row label="Owner" value={contact.owner?.name} />
              <Row label="Last contacted" value={formatDateTime(contact.lastContactedAt)} />
              <Row label="Next action" value={formatDateTime(contact.nextActivityAt)} />
            </dl>
            {contact.socialProfiles.length ? (
              <div className="mt-4 border-t border-border pt-3">
                <h3 className="text-sm font-medium">Social profiles</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {contact.socialProfiles.map((s) => (
                    <li key={s.id}>
                      {SOCIAL_PLATFORM_LABELS[s.platform]}:{" "}
                      <a
                        href={s.url}
                        className="text-accent-text hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {s.username ?? s.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {contact.propertyValues.length ? (
              <div className="mt-4 border-t border-border pt-3">
                <h3 className="text-sm font-medium">Custom properties</h3>
                <dl className="mt-2 space-y-2 text-sm">
                  {contact.propertyValues.map((pv) => (
                    <Row
                      key={pv.id}
                      label={pv.definition.label}
                      value={formatPropertyValueForDisplay(pv.definition, pv)}
                    />
                  ))}
                </dl>
              </div>
            ) : null}
          </AdminPanel>
        </AdminSection>

        <div className="space-y-6 lg:col-span-2">
          {activeLead ? (
            <AdminSection title="Active lead">
              <AdminPanel>
                <p className="text-sm text-muted">{activeLead.interestSummary ?? "—"}</p>
                {activeLead.servicesInterested.length ? (
                  <p className="mt-1 text-sm text-muted">
                    Services: {activeLead.servicesInterested.join(", ")}
                  </p>
                ) : null}
              </AdminPanel>
            </AdminSection>
          ) : null}

          <AdminSection title={`Linked projects (${linkedProjects.length})`}>
            <AdminPanel flush>
              <ul className="divide-y divide-border text-sm">
                {linkedProjects.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2 px-4 py-2">
                    <Link
                      href={`/admin/agency/projects/${p.id}`}
                      className="text-accent-text hover:underline"
                    >
                      {p.projectNumber} · {p.name}
                    </Link>
                    <span className="text-muted">
                      {AGENCY_PROJECT_STATUS_LABELS[p.status]} ·{" "}
                      {AGENCY_PROJECT_HEALTH_LABELS[p.health]}
                      {p.targetDueDate ? ` · due ${formatDate(p.targetDueDate)}` : ""}
                    </span>
                  </li>
                ))}
                {!linkedProjects.length ? (
                  <li className="px-4 py-6 text-muted">No linked projects.</li>
                ) : null}
              </ul>
            </AdminPanel>
          </AdminSection>

          <ContactProspectPanel contactId={id} />

          <AdminSection title={`Open deals (${contact.deals.length})`}>
            <AdminPanel flush>
              <ul className="divide-y divide-border text-sm">
                {contact.deals.map((d) => (
                  <li key={d.id} className="flex justify-between px-4 py-2">
                    <Link
                      href={`/admin/crm/deals/${d.id}`}
                      className="text-accent-text hover:underline"
                    >
                      {d.title}
                    </Link>
                    <span className="text-muted">
                      {CRM_DEAL_STAGE_LABELS[d.stage]} ·{" "}
                      {formatCurrency(Number(d.amount), d.currency ?? "USD")}
                    </span>
                  </li>
                ))}
                {!contact.deals.length ? (
                  <li className="px-4 py-6 text-muted">No open deals.</li>
                ) : null}
              </ul>
            </AdminPanel>
          </AdminSection>

          <AdminSection title="Open tasks">
            <AdminPanel>
              <ul className="space-y-2 text-sm">
                {contact.tasks.map((t) => (
                  <li key={t.id} className="rounded-md border border-border px-3 py-2">
                    {t.title}
                    {t.dueAt ? ` · due ${formatDateTime(t.dueAt)}` : ""}
                  </li>
                ))}
                {!contact.tasks.length ? (
                  <li className="text-muted">No open tasks.</li>
                ) : null}
              </ul>
            </AdminPanel>
          </AdminSection>

          <AdminSection title="Outreach">
            <AdminPanel>
              <ul className="space-y-2 text-sm">
                {enrollments.items.map((e) => (
                  <li key={e.id} className="rounded-md border border-border px-3 py-2">
                    {e.sequence.name} · {e.status} · step {e.currentStep + 1}
                    {e.nextRunAt ? ` · next ${formatDateTime(e.nextRunAt)}` : ""}
                  </li>
                ))}
                {!enrollments.items.length ? (
                  <li className="text-muted">No active sequences.</li>
                ) : null}
              </ul>
            </AdminPanel>
          </AdminSection>

          <AdminSection title="Conversations">
            <AdminPanel flush>
              <ul className="divide-y divide-border text-sm">
                {inboundMessages.map((thread) => (
                  <li key={thread.id} className="px-4 py-2">
                    <Link
                      href={`/admin/crm/inbox/threads/${thread.id}`}
                      className="font-medium text-accent-text hover:underline"
                    >
                      {thread.subjectNormalized}
                    </Link>
                    <p className="text-muted">
                      {thread.lastActivityAt ? formatDateTime(thread.lastActivityAt) : "—"}
                      {" · "}
                      {thread.workflowStatus.replace(/_/g, " ").toLowerCase()}
                      {thread.assignedTo ? ` · ${thread.assignedTo.name}` : ""}
                    </p>
                    {thread.snippet ? (
                      <p className="line-clamp-1 text-xs text-subtle">{thread.snippet}</p>
                    ) : null}
                  </li>
                ))}
                {!inboundMessages.length ? (
                  <li className="px-4 py-6 text-muted">No conversations yet.</li>
                ) : null}
              </ul>
            </AdminPanel>
          </AdminSection>

          <AdminSection title="Email history">
            <AdminPanel flush>
              <ul className="divide-y divide-border text-sm">
                {emailHistory.items.map((em) => (
                  <li key={em.id} id={`email-${em.id}`} className="px-4 py-2 scroll-mt-24">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{em.subject}</p>
                      <span className="text-xs uppercase tracking-wide text-subtle">
                        {em.deliveryStatus}
                      </span>
                    </div>
                    <p className="text-muted">
                      {em.origin === "MANUAL" ? "Manual" : em.origin}
                      {em.sentAt ? ` · ${formatDateTime(em.sentAt)}` : ` · ${formatDateTime(em.createdAt)}`}
                    </p>
                    {em.direction === "OUTBOUND" && (em.fromEmailSnapshot || em.fromNameSnapshot) ? (
                      <p className="text-xs text-subtle">
                        From:{" "}
                        {em.fromNameSnapshot && em.fromEmailSnapshot
                          ? `${em.fromNameSnapshot} <${em.fromEmailSnapshot}>`
                          : em.fromEmailSnapshot || em.fromNameSnapshot}
                      </p>
                    ) : null}
                    {em.direction === "OUTBOUND" &&
                    (em.openDetectedCount > 0 || em.clickDetectedCount > 0) ? (
                      <p className="text-xs text-subtle">
                        {em.openDetectedCount > 0
                          ? `Open detected (${em.openDetectedCount})`
                          : null}
                        {em.openDetectedCount > 0 && em.clickDetectedCount > 0 ? " · " : null}
                        {em.clickDetectedCount > 0
                          ? `Link click detected (${em.clickDetectedCount})`
                          : null}
                      </p>
                    ) : null}
                  </li>
                ))}
                {!emailHistory.items.length ? (
                  <li className="px-4 py-6 text-muted">No emails yet.</li>
                ) : null}
              </ul>
            </AdminPanel>
          </AdminSection>

          <AdminSection title="Activity timeline">
            <AdminPanel flush>
              <ul className="divide-y divide-border">
                {activities.items.map((a) => {
                  const meta = a.metadata as Record<string, unknown> | null;
                  const adminPath =
                    typeof meta?.adminPath === "string" ? meta.adminPath : null;
                  return (
                    <li key={a.id} className="px-4 py-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <p className="font-medium">
                          {CRM_ACTIVITY_TYPE_LABELS[a.type] ?? a.type}
                        </p>
                        <time className="text-muted">{formatDateTime(a.occurredAt)}</time>
                      </div>
                      {a.subject ? <p className="text-muted">{a.subject}</p> : null}
                      {a.body ? (
                        <p className="mt-1 whitespace-pre-wrap text-muted">{a.body}</p>
                      ) : null}
                      {adminPath ? (
                        <Link
                          href={adminPath}
                          className="mt-1 inline-block text-accent-text hover:underline"
                        >
                          View enquiry
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
                {!activities.items.length ? (
                  <li className="px-4 py-6 text-sm text-muted">No activity yet.</li>
                ) : null}
              </ul>
            </AdminPanel>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd>{value?.trim() ? value : "—"}</dd>
    </div>
  );
}
