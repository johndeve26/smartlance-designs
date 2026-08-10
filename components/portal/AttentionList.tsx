import Link from "next/link";
import type { PortalAttentionItem } from "@/lib/portal/attention";
import { PORTAL_ATTENTION_TYPE_LABELS } from "@/lib/portal/status-labels";
import { PortalCard, PortalPrimaryButton, PortalSecondaryButton } from "@/components/portal/PortalShell";

function urgencyBorder(urgency: PortalAttentionItem["urgency"]) {
  if (urgency === "OVERDUE") return "border-l-4 border-l-red-500";
  if (urgency === "IMPORTANT") return "border-l-4 border-l-[#F47A48]";
  return "border-l-4 border-l-neutral-300";
}

export function AttentionList({ items }: { items: PortalAttentionItem[] }) {
  if (!items.length) {
    return (
      <PortalCard>
        <p className="text-sm font-medium text-[#535353]">You&apos;re all caught up.</p>
        <p className="mt-1 text-sm text-neutral-600">
          Nothing needs your attention right now. Check recent updates below.
        </p>
      </PortalCard>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className={`rounded-lg border border-neutral-200 bg-white p-4 shadow-sm ${urgencyBorder(item.urgency)}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {PORTAL_ATTENTION_TYPE_LABELS[item.type] ?? "Action needed"}
              </p>
              <h3 className="mt-1 font-semibold text-[#535353]">{item.title}</h3>
              <p className="mt-0.5 text-sm text-neutral-600">{item.description}</p>
              {item.projectName ? (
                <p className="mt-1 text-sm text-neutral-500">{item.projectName}</p>
              ) : null}
            </div>
            <div className="shrink-0">
              {item.canAct ? (
                <PortalPrimaryButton href={item.ctaHref}>{item.ctaLabel}</PortalPrimaryButton>
              ) : (
                <PortalSecondaryButton href={item.ctaHref}>View</PortalSecondaryButton>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function AttentionListCompact({ items }: { items: PortalAttentionItem[] }) {
  return (
    <ul className="divide-y divide-neutral-100">
      {items.slice(0, 5).map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <Link href={item.ctaHref} className="font-medium text-[#535353] hover:underline">
              {item.title}
            </Link>
            <p className="truncate text-sm text-neutral-600">{item.description}</p>
          </div>
          {item.canAct ? (
            <Link
              href={item.ctaHref}
              className="shrink-0 text-sm font-medium text-[#F47A48] hover:underline"
            >
              {item.ctaLabel}
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
