type Milestone = {
  id: string;
  title: string;
  status: string;
  statusLabel: string;
  dueLabel: string | null;
  isComplete: boolean;
  isCurrent: boolean;
};

export function ProjectMilestoneProgress({ milestones }: { milestones: Milestone[] }) {
  if (!milestones.length) {
    return <p className="text-sm text-neutral-600">Project stages will appear here.</p>;
  }

  return (
    <ol className="space-y-0">
      {milestones.map((m, i) => {
        const isLast = i === milestones.length - 1;
        return (
          <li key={m.id} className="relative flex gap-4 pb-6">
            {!isLast ? (
              <span
                className="absolute left-[11px] top-6 h-full w-px bg-neutral-200"
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                m.isComplete
                  ? "bg-[#F47A48] text-white"
                  : m.isCurrent
                    ? "border-2 border-[#F47A48] bg-white text-[#F47A48]"
                    : "border border-neutral-300 bg-white text-neutral-400"
              }`}
              aria-hidden
            >
              {m.isComplete ? "✓" : m.isCurrent ? "●" : ""}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={`font-medium ${m.isCurrent ? "text-[#535353]" : "text-neutral-700"}`}
              >
                {m.title}
              </p>
              <p className="text-sm text-neutral-500">{m.statusLabel}</p>
              {m.dueLabel ? <p className="text-xs text-neutral-400">Due {m.dueLabel}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
