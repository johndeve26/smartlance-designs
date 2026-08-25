"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CrmContact, CrmCompany, CrmLead } from "@prisma/client";
import {
  addNoteAction,
  archiveContactAction,
  createDealFromLeadAction,
  createLeadAction,
  createTaskAction,
  updateEmailStatusAction,
  updateLeadStatusAction,
  updateLeadTemperatureAction,
} from "@/lib/admin/crm-actions";
import {
  enrollContactAction,
  markManualReplyAction,
  pauseContactOutreachAction,
  resumeContactOutreachAction,
  stopEnrollmentAction,
} from "@/lib/admin/crm-outreach-actions";
import {
  ContactEmailComposer,
  type ContactEmailComposerProfile,
  type ContactEmailComposerTemplate,
} from "@/components/admin/crm/ContactEmailComposer";
import { contactDisplayName } from "@/lib/crm/normalize";

type ContactWithRelations = CrmContact & {
  company: CrmCompany | null;
  owner: { id: string; name: string; email: string } | null;
};

type ActiveEnrollment = {
  id: string;
  status: string;
  sequence: { id: string; name: string };
};

export function ContactDetailActions({
  contact,
  activeLead,
  canSendEmail,
  canChooseSender,
  canManageOutreach,
  activeSequences,
  enrollments,
  sendingProfiles = [],
  defaultSendingProfileId = null,
  emailTemplates = [],
}: {
  contact: ContactWithRelations;
  activeLead: CrmLead | null;
  canSendEmail: boolean;
  canChooseSender: boolean;
  canManageOutreach: boolean;
  activeSequences: Array<{ id: string; name: string }>;
  enrollments: ActiveEnrollment[];
  sendingProfiles?: ContactEmailComposerProfile[];
  defaultSendingProfileId?: string | null;
  emailTemplates?: ContactEmailComposerTemplate[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap gap-2">
        <QuickForm
          label="Add note"
          pending={pending}
          submitLabel="Save note"
          onSubmit={(fd) => {
            fd.set("contactId", contact.id);
            start(async () => {
              const r = await addNoteAction(fd);
              if (!r.ok) alert(r.error);
              else router.refresh();
            });
          }}
        >
          <textarea name="body" required rows={3} className="admin-input w-full" placeholder="Note…" />
        </QuickForm>

        <QuickForm
          label="Create task"
          pending={pending}
          submitLabel="Create task"
          onSubmit={(fd) => {
            fd.set("contactId", contact.id);
            if (activeLead) fd.set("leadId", activeLead.id);
            start(async () => {
              const r = await createTaskAction(fd);
              if (!r.ok) alert(r.error);
              else router.refresh();
            });
          }}
        >
          <input name="title" required className="admin-input w-full" placeholder="Task title" />
          <input name="dueAt" type="date" className="admin-input w-full" />
        </QuickForm>

        {!activeLead ? (
          <button
            type="button"
            disabled={pending}
            className="admin-btn admin-btn-secondary text-sm"
            onClick={() => {
              const fd = new FormData();
              fd.set("contactId", contact.id);
              fd.set("source", contact.source);
              fd.set("temperature", "COLD");
              start(async () => {
                const r = await createLeadAction(fd);
                if (!r.ok) alert(r.error);
                else router.refresh();
              });
            }}
          >
            Create lead
          </button>
        ) : null}

        {activeLead?.status === "QUALIFIED" ? (
          <button
            type="button"
            disabled={pending}
            className="admin-btn admin-btn-secondary text-sm"
            onClick={() => {
              const fd = new FormData();
              fd.set("leadId", activeLead.id);
              start(async () => {
                const r = await createDealFromLeadAction(fd);
                if (!r.ok) alert(r.error);
                else if (r.id) router.push(`/admin/crm/deals/${r.id}`);
              });
            }}
          >
            Create deal
          </button>
        ) : null}

        {activeLead ? (
          <>
            <select
              className="admin-input text-sm"
              defaultValue={activeLead.status}
              onChange={(e) => {
                const fd = new FormData();
                fd.set("leadId", activeLead.id);
                fd.set("status", e.target.value);
                start(async () => {
                  const r = await updateLeadStatusAction(fd);
                  if (!r.ok) alert(r.error);
                  else router.refresh();
                });
              }}
            >
              {["NEW", "ATTEMPTING", "CONNECTED", "QUALIFIED", "UNQUALIFIED", "BAD_TIMING", "CLOSED"].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <select
              className="admin-input text-sm"
              defaultValue={activeLead.temperature}
              onChange={(e) => {
                const fd = new FormData();
                fd.set("leadId", activeLead.id);
                fd.set("temperature", e.target.value);
                start(async () => {
                  const r = await updateLeadTemperatureAction(fd);
                  if (!r.ok) alert(r.error);
                  else router.refresh();
                });
              }}
            >
              {["COLD", "WARM", "HOT"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </>
        ) : null}

        <select
          className="admin-input text-sm"
          defaultValue={contact.emailStatus}
          onChange={(e) => {
            const fd = new FormData();
            fd.set("contactId", contact.id);
            fd.set("emailStatus", e.target.value);
            start(async () => {
              const r = await updateEmailStatusAction(fd);
              if (!r.ok) alert(r.error);
              else router.refresh();
            });
          }}
        >
          {["SENDABLE", "DO_NOT_EMAIL", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED", "INVALID", "SUPPRESSED"].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>

        {canSendEmail && contact.email ? (
          <button
            type="button"
            className="admin-btn admin-btn-primary text-sm"
            onClick={() => setComposerOpen(true)}
          >
            Send email
          </button>
        ) : null}

        {canManageOutreach ? (
          <>
            {contact.outreachPaused ? (
              <button
                type="button"
                disabled={pending}
                className="admin-btn admin-btn-secondary text-sm"
                onClick={() => {
                  const fd = new FormData();
                  fd.set("contactId", contact.id);
                  start(async () => {
                    const r = await resumeContactOutreachAction(fd);
                    if (!r.ok) alert(r.error);
                    else router.refresh();
                  });
                }}
              >
                Resume outreach
              </button>
            ) : (
              <button
                type="button"
                disabled={pending}
                className="admin-btn admin-btn-secondary text-sm"
                onClick={() => {
                  const fd = new FormData();
                  fd.set("contactId", contact.id);
                  start(async () => {
                    const r = await pauseContactOutreachAction(fd);
                    if (!r.ok) alert(r.error);
                    else router.refresh();
                  });
                }}
              >
                Pause outreach
              </button>
            )}

            <QuickForm
              label="Mark reply (manual)"
              pending={pending}
              submitLabel="Mark reply"
              onSubmit={(fd) => {
                fd.set("contactId", contact.id);
                start(async () => {
                  const r = await markManualReplyAction(fd);
                  if (!r.ok) alert(r.error);
                  else router.refresh();
                });
              }}
            >
              <label className="flex items-center gap-2 text-sm">
                <input name="stopSequence" type="checkbox" defaultChecked />
                Stop active sequences
              </label>
            </QuickForm>
          </>
        ) : null}

        {canSendEmail && activeSequences.length ? (
          <QuickForm
            label="Enroll in sequence"
            pending={pending}
            submitLabel="Enroll"
            onSubmit={(fd) => {
              fd.set("contactId", contact.id);
              start(async () => {
                const r = await enrollContactAction(fd);
                if (!r.ok) alert(r.error);
                else router.refresh();
              });
            }}
          >
            <select name="sequenceId" required className="admin-input w-full">
              <option value="">Select sequence…</option>
              {activeSequences.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </QuickForm>
        ) : null}

        {canManageOutreach && enrollments.some((e) => e.status === "ACTIVE" || e.status === "PAUSED") ? (
          <div className="flex flex-wrap gap-2">
            {enrollments
              .filter((e) => e.status === "ACTIVE" || e.status === "PAUSED")
              .map((e) => (
                <button
                  key={e.id}
                  type="button"
                  disabled={pending}
                  className="admin-btn admin-btn-secondary text-sm"
                  onClick={() => {
                    if (!window.confirm(`Stop sequence "${e.sequence.name}"?`)) return;
                    const fd = new FormData();
                    fd.set("enrollmentId", e.id);
                    start(async () => {
                      const r = await stopEnrollmentAction(fd);
                      if (!r.ok) alert(r.error);
                      else router.refresh();
                    });
                  }}
                >
                  Stop {e.sequence.name}
                </button>
              ))}
          </div>
        ) : null}

        <button
          type="button"
          disabled={pending}
          className="admin-btn admin-btn-secondary text-sm text-red-700"
          onClick={() => {
            if (!window.confirm("Archive this contact? History is preserved.")) return;
            const fd = new FormData();
            fd.set("id", contact.id);
            start(async () => {
              const r = await archiveContactAction(fd);
              if (!r.ok) alert(r.error);
              else router.push("/admin/crm/contacts");
            });
          }}
        >
          Archive
        </button>
      </div>

      {canSendEmail && contact.email && composerOpen ? (
        <ContactEmailComposer
          contactId={contact.id}
          contactName={contactDisplayName(contact)}
          contactEmail={contact.email}
          canChooseSender={canChooseSender}
          sendingProfiles={sendingProfiles}
          defaultSendingProfileId={defaultSendingProfileId}
          templates={emailTemplates}
          initiallyOpen
          onRequestClose={() => setComposerOpen(false)}
        />
      ) : null}
    </div>
  );
}

function QuickForm({
  label,
  children,
  pending,
  onSubmit,
  submitLabel,
}: {
  label: string;
  children: React.ReactNode;
  pending: boolean;
  onSubmit: (fd: FormData) => void;
  submitLabel: string;
}) {
  return (
    <details className="rounded border bg-white">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">{label}</summary>
      <form
        className="space-y-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget));
        }}
      >
        {children}
        <button type="submit" disabled={pending} className="admin-btn admin-btn-primary text-sm">
          {submitLabel}
        </button>
      </form>
    </details>
  );
}
