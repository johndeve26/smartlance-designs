import Link from "next/link";
import type { PortalApprovalHistoryItem, PortalApprovalItem } from "@/lib/portal/approvals";
import { formatPortalDate } from "@/lib/portal/status-labels";
import {
  PortalCard,
  PortalPrimaryButton,
  PortalSecondaryButton,
} from "@/components/portal/PortalShell";

const KIND_LABEL: Record<string, string> = {
  deliverable: "Deliverable",
  proposal: "Proposal",
  contract: "Contract",
  change_request: "Change request",
};

function ApprovalCard({ item }: { item: PortalApprovalItem }) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {KIND_LABEL[item.kind] ?? "Review"}
          </p>
          <h3 className="mt-1 font-semibold text-[#535353]">{item.title}</h3>
          <p className="text-sm text-neutral-600">{item.subtitle}</p>
          {item.projectName ? (
            <p className="mt-1 text-sm text-neutral-500">{item.projectName}</p>
          ) : null}
          {item.submittedLabel ? (
            <p className="mt-1 text-xs text-neutral-500">Submitted {item.submittedLabel}</p>
          ) : null}
          {item.meta ? <p className="mt-1 text-sm font-medium text-[#535353]">{item.meta}</p> : null}
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
  );
}

export function ApprovalCenter({
  pending,
  history,
}: {
  pending: PortalApprovalItem[];
  history: PortalApprovalHistoryItem[];
}) {
  const actionable = pending.filter((p) => p.canAct);
  const awaiting = pending.filter((p) => !p.canAct);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#535353]">Needs your review</h2>
        {actionable.length ? (
          <div className="space-y-3">
            {actionable.map((item) => (
              <ApprovalCard key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <PortalCard>
            <p className="text-sm text-neutral-600">Nothing waiting for your review right now.</p>
          </PortalCard>
        )}
      </section>

      {awaiting.length ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#535353]">Awaiting others</h2>
          <div className="space-y-3">
            {awaiting.map((item) => (
              <ApprovalCard key={`await-${item.kind}-${item.id}`} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#535353]">Previously approved</h2>
        {history.length ? (
          <PortalCard>
            <ul className="divide-y divide-neutral-100">
              {history.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    {item.href ? (
                      <Link href={item.href} className="font-medium text-[#535353] hover:underline">
                        {item.title}
                      </Link>
                    ) : (
                      <span className="font-medium">{item.title}</span>
                    )}
                    <p className="text-neutral-600">
                      {item.outcome} · {formatPortalDate(item.occurredAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </PortalCard>
        ) : (
          <PortalCard>
            <p className="text-sm text-neutral-600">Your approval history will appear here.</p>
          </PortalCard>
        )}
      </section>
    </div>
  );
}
