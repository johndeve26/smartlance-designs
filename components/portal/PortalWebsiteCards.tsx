import Link from "next/link";
import type { PortalWebsiteSummary } from "@/lib/portal/websites";
import { PortalCard, PortalPrimaryButton, PortalSecondaryButton } from "@/components/portal/PortalShell";

export function PortalWebsiteCard({ website }: { website: PortalWebsiteSummary }) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[#535353]">{website.name}</h3>
          <p className="text-sm text-neutral-600">{website.domain}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Managed by Smartlance
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded bg-neutral-100 px-2 py-0.5 text-neutral-700">
              Website Care · {website.careStatusLabel}
            </span>
            {website.lastMaintenanceLabel ? (
              <span className="text-neutral-600">Last maintenance · {website.lastMaintenanceLabel}</span>
            ) : null}
            {website.openSupportCount > 0 ? (
              <span className="rounded bg-[#F47A48]/10 px-2 py-0.5 text-[#535353]">
                {website.openSupportCount} open support
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <PortalPrimaryButton href={website.href}>Open website</PortalPrimaryButton>
          <PortalSecondaryButton href={`/portal/support/new?website=${website.id}`}>
            Request support
          </PortalSecondaryButton>
          {website.visitHref ? (
            <a
              href={website.visitHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-[#535353] hover:bg-neutral-50"
            >
              Visit website
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function PortalWebsiteList({ websites }: { websites: PortalWebsiteSummary[] }) {
  if (!websites.length) {
    return (
      <PortalCard>
        <p className="text-sm font-medium text-[#535353]">No managed websites yet.</p>
        <p className="mt-1 text-sm text-neutral-600">
          When Smartlance begins ongoing website management for you, your websites will appear here.
        </p>
      </PortalCard>
    );
  }

  return (
    <div className="space-y-4">
      {websites.map((w) => (
        <PortalWebsiteCard key={w.id} website={w} />
      ))}
    </div>
  );
}

export function PortalWebsiteHomeCards({ websites }: { websites: PortalWebsiteSummary[] }) {
  if (!websites.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {websites.map((w) => (
        <Link key={w.id} href={w.href} className="block">
          <PortalCard className="transition-colors hover:bg-neutral-50">
            <h3 className="font-semibold text-[#535353]">{w.name}</h3>
            <p className="text-sm text-neutral-600">{w.domain}</p>
            <p className="mt-2 text-sm text-neutral-500">
              Website Care · {w.careStatusLabel}
              {w.lastMaintenanceLabel ? ` · Last maintenance ${w.lastMaintenanceLabel}` : ""}
            </p>
          </PortalCard>
        </Link>
      ))}
    </div>
  );
}
