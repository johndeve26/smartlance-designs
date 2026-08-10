import Link from "next/link";
import type { PortalTimelineEvent } from "@/lib/portal/timeline";
import { formatPortalDate } from "@/lib/portal/status-labels";

const ICON: Record<string, string> = {
  project: "●",
  proposal: "◆",
  contract: "■",
  billing: "₦",
  onboarding: "○",
  change: "▲",
  deliverable: "✓",
  update: "→",
  website: "◎",
  support: "?",
};

export function PortalTimelineList({ events }: { events: PortalTimelineEvent[] }) {
  if (!events.length) {
    return <p className="text-sm text-neutral-600">No recent activity yet.</p>;
  }

  const byDate = new Map<string, PortalTimelineEvent[]>();
  for (const e of events) {
    const key = formatPortalDate(e.occurredAt) ?? "";
    const list = byDate.get(key) ?? [];
    list.push(e);
    byDate.set(key, list);
  }

  return (
    <div className="space-y-6">
      {Array.from(byDate.entries()).map(([date, group]) => (
        <div key={date}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            {date}
          </p>
          <ul className="space-y-3">
            {group.map((event) => (
              <li key={event.id} className="flex gap-3 text-sm">
                <span className="mt-0.5 w-4 shrink-0 text-center text-neutral-400">
                  {ICON[event.iconType] ?? "•"}
                </span>
                <div className="min-w-0 flex-1">
                  {event.href ? (
                    <Link href={event.href} className="font-medium text-[#535353] hover:underline">
                      {event.title}
                    </Link>
                  ) : (
                    <p className="font-medium text-[#535353]">{event.title}</p>
                  )}
                  {event.projectName ? (
                    <p className="text-neutral-500">{event.projectName}</p>
                  ) : null}
                  {event.description ? (
                    <p className="mt-0.5 line-clamp-2 text-neutral-600">{event.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
