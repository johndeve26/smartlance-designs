"use client";

import { useTransition } from "react";
import { updateAgencyProjectHealthAction } from "@/lib/admin/agency-actions";
import {
  AGENCY_ACTIVITY_TYPE_LABELS,
  AGENCY_CLIENT_ROLE_LABELS,
  AGENCY_DELIVERABLE_STATUS_LABELS,
  AGENCY_MEMBER_ROLE_LABELS,
  AGENCY_MILESTONE_STATUS_LABELS,
  AGENCY_PROJECT_HEALTH_LABELS,
  AGENCY_PROJECT_STATUS_LABELS,
  AGENCY_REQUIREMENT_STATUS_LABELS,
  AGENCY_TASK_STATUS_LABELS,
} from "@/lib/agency/constants";
import {
  formatDate,
  formatDateTime,
  healthTone,
  statusTone,
} from "@/lib/agency/display";
import { AgencyBadge } from "@/components/admin/agency/AgencySubNavBar";
import { contactDisplayName } from "@/lib/crm/normalize";
import Link from "next/link";
import type { getProjectAdminDetail } from "@/lib/agency/projects";

type Project = NonNullable<Awaited<ReturnType<typeof getProjectAdminDetail>>>;

export function ProjectDetailPanels({
  project,
  canManage,
}: {
  project: Project;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      <section className="admin-card grid gap-4 p-4 lg:grid-cols-2">
        <div className="space-y-2 text-sm">
          <p><strong>Number:</strong> {project.projectNumber}</p>
          <p>
            <strong>Client:</strong>{" "}
            <Link href={`/admin/crm/contacts/${project.primaryContactId}`} className="hover:underline">
              {contactDisplayName(project.primaryContact)}
            </Link>
          </p>
          <p><strong>Company:</strong> {project.clientCompany?.name ?? "—"}</p>
          <p><strong>Owner:</strong> {project.owner.name}</p>
          <p><strong>Start:</strong> {formatDate(project.startDate)}</p>
          <p><strong>Target due:</strong> {formatDate(project.targetDueDate)}</p>
          {project.summary ? <p className="whitespace-pre-wrap text-neutral-700">{project.summary}</p> : null}
        </div>
        {canManage ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                const r = await updateAgencyProjectHealthAction(fd);
                if (!r.ok) alert(r.error);
              });
            }}
          >
            <input type="hidden" name="projectId" value={project.id} />
            <div>
              <label className="admin-field-label">Health</label>
              <select name="health" defaultValue={project.health} className="admin-input w-full">
                {Object.entries(AGENCY_PROJECT_HEALTH_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={pending} className="admin-btn admin-btn-secondary">
              Update health
            </button>
            <div className="flex gap-2">
              <AgencyBadge tone={statusTone(project.status)}>
                {AGENCY_PROJECT_STATUS_LABELS[project.status]}
              </AgencyBadge>
              <AgencyBadge tone={healthTone(project.health)}>
                {AGENCY_PROJECT_HEALTH_LABELS[project.health]}
              </AgencyBadge>
            </div>
          </form>
        ) : (
          <div className="flex gap-2">
            <AgencyBadge tone={statusTone(project.status)}>
              {AGENCY_PROJECT_STATUS_LABELS[project.status]}
            </AgencyBadge>
            <AgencyBadge tone={healthTone(project.health)}>
              {AGENCY_PROJECT_HEALTH_LABELS[project.health]}
            </AgencyBadge>
          </div>
        )}
      </section>

      <Panel title={`Milestones (${project.milestones.length})`}>
        <ul className="divide-y text-sm">
          {project.milestones.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <p className="font-medium">{m.title}</p>
                <p className="text-neutral-600">
                  Due {formatDate(m.dueDate)} · {m.tasks.length} tasks
                </p>
              </div>
              <AgencyBadge tone={statusTone(m.status)}>
                {AGENCY_MILESTONE_STATUS_LABELS[m.status]}
              </AgencyBadge>
            </li>
          ))}
          {!project.milestones.length ? (
            <li className="py-2 text-neutral-500">No milestones yet.</li>
          ) : null}
        </ul>
      </Panel>

      <Panel title={`Tasks (${project.tasks.length + project.milestones.reduce((n, m) => n + m.tasks.length, 0)})`}>
        <ul className="space-y-2 text-sm">
          {project.milestones.flatMap((m) =>
            m.tasks.map((t) => (
              <li key={t.id} className="rounded border px-3 py-2">
                <p className="font-medium">{t.title}</p>
                <p className="text-neutral-600">
                  {m.title} · {AGENCY_TASK_STATUS_LABELS[t.status]}
                  {t.assignee ? ` · ${t.assignee.name}` : ""}
                </p>
              </li>
            )),
          )}
          {project.tasks.map((t) => (
            <li key={t.id} className="rounded border px-3 py-2">
              <p className="font-medium">{t.title}</p>
              <p className="text-neutral-600">
                Unassigned milestone · {AGENCY_TASK_STATUS_LABELS[t.status]}
                {t.assignee ? ` · ${t.assignee.name}` : ""}
              </p>
            </li>
          ))}
          {!project.tasks.length && !project.milestones.some((m) => m.tasks.length) ? (
            <li className="text-neutral-500">No tasks yet.</li>
          ) : null}
        </ul>
      </Panel>

      <Panel title={`Requirements (${project.requirements.length})`}>
        <ul className="divide-y text-sm">
          {project.requirements.map((r) => (
            <li key={r.id} className="flex justify-between gap-2 py-2">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-neutral-600">Due {formatDate(r.dueDate)}</p>
              </div>
              <AgencyBadge tone={statusTone(r.status)}>
                {AGENCY_REQUIREMENT_STATUS_LABELS[r.status]}
              </AgencyBadge>
            </li>
          ))}
          {!project.requirements.length ? (
            <li className="py-2 text-neutral-500">No requirements yet.</li>
          ) : null}
        </ul>
      </Panel>

      <Panel title={`Deliverables (${project.deliverables.length})`}>
        <ul className="divide-y text-sm">
          {project.deliverables.map((d) => (
            <li key={d.id} className="flex justify-between gap-2 py-2">
              <div>
                <p className="font-medium">{d.title}</p>
                {d.versions[0]?.externalUrl ? (
                  <a href={d.versions[0].externalUrl} className="text-neutral-600 underline" target="_blank" rel="noopener noreferrer">
                    View latest version
                  </a>
                ) : null}
              </div>
              <AgencyBadge tone={statusTone(d.status)}>
                {AGENCY_DELIVERABLE_STATUS_LABELS[d.status]}
              </AgencyBadge>
            </li>
          ))}
          {!project.deliverables.length ? (
            <li className="py-2 text-neutral-500">No deliverables yet.</li>
          ) : null}
        </ul>
      </Panel>

      <Panel title={`Team (${project.members.length})`}>
        <ul className="divide-y text-sm">
          {project.members.map((m) => (
            <li key={m.id} className="flex justify-between gap-2 py-2">
              <span>{m.user.name}</span>
              <AgencyBadge>{AGENCY_MEMBER_ROLE_LABELS[m.role]}</AgencyBadge>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title={`Client access (${project.clientAccess.length})`}>
        <ul className="divide-y text-sm">
          {project.clientAccess.map((a) => (
            <li key={a.id} className="flex justify-between gap-2 py-2">
              <Link href={`/admin/crm/contacts/${a.contactId}`} className="hover:underline">
                {contactDisplayName(a.contact)}
              </Link>
              <AgencyBadge>{AGENCY_CLIENT_ROLE_LABELS[a.role]}</AgencyBadge>
            </li>
          ))}
          {!project.clientAccess.length ? (
            <li className="py-2 text-neutral-500">No client access granted yet.</li>
          ) : null}
        </ul>
      </Panel>

      <Panel title="Activity">
        <ul className="divide-y text-sm">
          {project.activities.map((a) => (
            <li key={a.id} className="flex justify-between gap-2 py-2">
              <div>
                <p className="font-medium">
                  {AGENCY_ACTIVITY_TYPE_LABELS[a.type] ?? a.type}
                </p>
                <p className="text-neutral-600">{a.summary}</p>
              </div>
              <time className="text-neutral-500">{formatDateTime(a.createdAt)}</time>
            </li>
          ))}
          {!project.activities.length ? (
            <li className="py-2 text-neutral-500">No activity yet.</li>
          ) : null}
        </ul>
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="admin-card p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
