import Link from "next/link";
import type { PortalProjectSummary } from "@/lib/portal/home";
import { PortalCard, PortalSecondaryButton } from "@/components/portal/PortalShell";

export function ProjectSummaryCard({ project }: { project: PortalProjectSummary }) {
  return (
    <PortalCard className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {project.serviceLabel}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[#535353]">{project.name}</h3>
        <p className="text-sm text-neutral-600">{project.statusLabel}</p>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-neutral-600">{project.currentStage ?? "In progress"}</span>
          <span className="font-medium">{project.progressPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-[#F47A48] transition-all"
            style={{ width: `${Math.min(100, project.progressPercent)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
        {project.targetDueLabel ? (
          <div>
            <span className="block text-xs text-neutral-500">Target</span>
            {project.targetDueLabel}
          </div>
        ) : null}
        {project.nextAction ? (
          <div className="min-w-0 flex-1">
            <span className="block text-xs text-neutral-500">Next</span>
            <span className="line-clamp-1">{project.nextAction}</span>
          </div>
        ) : null}
      </div>

      <PortalSecondaryButton href={project.href}>View project</PortalSecondaryButton>
    </PortalCard>
  );
}

export function ProjectSummaryList({
  projects,
}: {
  projects: Array<{
    id: string;
    name: string;
    projectNumber: string;
    serviceLabel: string;
    statusLabel: string;
    progressPercent: number;
    targetDueLabel: string | null;
    href: string;
  }>;
}) {
  if (!projects.length) {
    return (
      <p className="text-sm text-neutral-600">No projects are shared with you yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {projects.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 py-4">
          <div>
            <Link href={p.href} className="font-medium text-[#535353] hover:underline">
              {p.name}
            </Link>
            <p className="text-sm text-neutral-600">
              {p.serviceLabel} · {p.statusLabel} · {p.progressPercent}%
            </p>
          </div>
          {p.targetDueLabel ? (
            <span className="text-sm text-neutral-500">Due {p.targetDueLabel}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
