"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { AttentionListCompact } from "@/components/portal/AttentionList";
import { ProjectMilestoneProgress } from "@/components/portal/ProjectMilestoneProgress";
import { PortalTimelineList } from "@/components/portal/PortalTimelineList";
import { PortalDeliverableReview } from "@/components/portal/PortalDeliverableReview";
import { PortalFileListCompact } from "@/components/portal/PortalFileListCompact";
import {
  PortalCard,
  PortalPrimaryButton,
  PortalSecondaryButton,
} from "@/components/portal/PortalShell";
import type { getPortalProjectWorkspace } from "@/lib/portal/project-workspace";
import type { PortalFileItem } from "@/lib/portal/files";

type Workspace = NonNullable<Awaited<ReturnType<typeof getPortalProjectWorkspace>>>;

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "files", label: "Files" },
  { id: "changes", label: "Changes" },
] as const;

export function ProjectWorkspaceView({
  workspace,
  projectFiles,
  projectId,
}: {
  workspace: Workspace;
  projectFiles: PortalFileItem[];
  projectId: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") ?? "overview") as (typeof TABS)[number]["id"];
  const { project, milestones, needsFromYou, awaitingApproval, deliverables, latestUpdate, changes, quickActions, onboardingHref } =
    workspace;

  function tabHref(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/projects" className="text-sm text-neutral-600 hover:underline">
          ← Projects
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {project.serviceLabel}
            </p>
            <h1 className="text-2xl font-semibold text-[#535353]">{project.name}</h1>
            <p className="text-sm text-neutral-600">
              {project.statusLabel}
              {project.currentStage ? ` · ${project.currentStage}` : ""}
            </p>
          </div>
          <div className="text-sm text-neutral-600">
            {project.targetDueLabel ? (
              <p>
                Target completion: <span className="font-medium">{project.targetDueLabel}</span>
              </p>
            ) : null}
            {project.contact ? (
              <p className="mt-1">
                Your contact:{" "}
                <a href={`mailto:${project.contact.email}`} className="text-[#F47A48] hover:underline">
                  {project.contact.name}
                </a>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-neutral-600">Progress</span>
            <span className="font-medium">{project.progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-[#F47A48]"
              style={{ width: `${Math.min(100, project.progressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-neutral-200">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={tabHref(t.id)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-[#F47A48] text-[#535353]"
                : "border-transparent text-neutral-500 hover:text-neutral-700",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="space-y-6">
          {workspace.attention.length ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-[#535353]">Needs your attention</h2>
              <AttentionListCompact items={workspace.attention} />
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#535353]">Project stages</h2>
            <PortalCard>
              <ProjectMilestoneProgress milestones={milestones} />
            </PortalCard>
          </section>

          {needsFromYou.length ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-[#535353]">What we need from you</h2>
              <PortalCard>
                <ul className="divide-y divide-neutral-100">
                  {needsFromYou.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-medium">{r.title}</p>
                        <p className="text-neutral-600">
                          {r.statusLabel}
                          {r.dueLabel ? ` · Due ${r.dueLabel}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </PortalCard>
            </section>
          ) : null}

          {awaitingApproval.length ? (
            <section id="approvals">
              <h2 className="mb-3 text-lg font-semibold text-[#535353]">Awaiting your approval</h2>
              <div className="space-y-4">
                {deliverables
                  .filter((d) => ["READY_FOR_REVIEW", "CHANGES_REQUESTED"].includes(d.status))
                  .map((d) => (
                    <PortalCard key={d.id}>
                      <div id={`deliverable-${d.id}`}>
                      <p className="font-medium">{d.title}</p>
                      <p className="text-sm text-neutral-600">{d.statusLabel}</p>
                      {d.version?.externalUrl ? (
                        <a
                          href={d.version.externalUrl}
                          className="mt-2 inline-block text-sm text-[#F47A48] hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open preview
                        </a>
                      ) : d.version?.file ? (
                        <a
                          href={`/api/agency/files/${d.version.file.id}`}
                          className="mt-2 inline-block text-sm text-[#F47A48] hover:underline"
                        >
                          Download {d.version.file.filename}
                        </a>
                      ) : null}
                      <PortalDeliverableReview
                        deliverableId={d.id}
                        versionId={d.version?.id}
                        status={d.status}
                      />
                      </div>
                    </PortalCard>
                  ))}
              </div>
            </section>
          ) : null}

          {latestUpdate ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-[#535353]">Latest update</h2>
              <PortalCard>
                <p className="font-medium">{latestUpdate.title}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{latestUpdate.body}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  {latestUpdate.dateLabel} · {latestUpdate.author}
                </p>
              </PortalCard>
            </section>
          ) : null}

          <section className="flex flex-wrap gap-2">
            {quickActions.onboarding && onboardingHref ? (
              <PortalPrimaryButton href={onboardingHref}>Continue onboarding</PortalPrimaryButton>
            ) : null}
            {quickActions.changes ? (
              <PortalSecondaryButton href={`${pathname}?tab=changes`}>
                Request a change
              </PortalSecondaryButton>
            ) : null}
            {quickActions.files ? (
              <PortalSecondaryButton href={`${pathname}?tab=files`}>View files</PortalSecondaryButton>
            ) : null}
            {quickActions.billing ? (
              <PortalSecondaryButton href="/portal/billing">View billing</PortalSecondaryButton>
            ) : null}
          </section>
        </div>
      )}

      {tab === "timeline" && (
        <PortalCard>
          <PortalTimelineList events={workspace.timeline} />
        </PortalCard>
      )}

      {tab === "files" && (
        <PortalCard>
          <PortalFileListCompact files={projectFiles} />
        </PortalCard>
      )}

      {tab === "changes" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#535353]">Change requests</h2>
            <PortalPrimaryButton href={`${pathname.replace(/\/$/, "")}/changes`}>
              View all changes
            </PortalPrimaryButton>
          </div>
          {changes.length ? (
            <PortalCard>
              <ul className="divide-y divide-neutral-100">
                {changes.map((cr) => (
                  <li key={cr.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium">{cr.title}</p>
                      <p className="text-neutral-600">{cr.statusLabel}</p>
                    </div>
                    <Link
                      href={`/portal/projects/${projectId}/changes/${cr.id}`}
                      className="text-[#F47A48] hover:underline"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            </PortalCard>
          ) : (
            <PortalCard>
              <p className="text-sm text-neutral-600">
                No change requests yet. Use the changes page to request scope adjustments.
              </p>
              <div className="mt-3">
                <PortalSecondaryButton href={`${pathname.replace(/\/$/, "")}/changes`}>
                  Request a change
                </PortalSecondaryButton>
              </div>
            </PortalCard>
          )}
        </section>
      )}
    </div>
  );
}
