"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { PortalCard, PortalPrimaryButton, PortalSecondaryButton } from "@/components/portal/PortalShell";

type WebsiteDetail = NonNullable<Awaited<ReturnType<typeof import("@/lib/portal/websites").getPortalWebsiteDetail>>>;

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "care", label: "Care" },
  { id: "support", label: "Support" },
] as const;

export function PortalWebsiteHub({
  websiteId,
  detail,
  careEvents,
  support,
}: {
  websiteId: string;
  detail: WebsiteDetail;
  careEvents: Awaited<ReturnType<typeof import("@/lib/portal/websites").listPortalWebsiteCareEvents>>;
  support: Awaited<ReturnType<typeof import("@/lib/portal/websites").listPortalWebsiteSupport>>;
}) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  const { website, openSupport, recentCare } = detail;

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Managed by Smartlance
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[#535353]">{website.name}</h1>
        <p className="text-neutral-600">{website.domain}</p>
        <div className="mt-4 flex flex-wrap gap-2">
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
          {website.canSubmitSupport ? (
            <PortalPrimaryButton href={`/portal/support/new?website=${websiteId}`}>
              Request support
            </PortalPrimaryButton>
          ) : null}
        </div>
      </header>

      <nav className="flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/portal/websites/${websiteId}?tab=${t.id}`}
            className={cn(
              "px-4 py-2 text-sm font-medium",
              tab === t.id
                ? "border-b-2 border-[#F47A48] text-[#535353]"
                : "text-neutral-500 hover:text-[#535353]",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <PortalCard>
            <h2 className="font-semibold text-[#535353]">Website status</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Management</dt>
                <dd className="font-medium">{website.statusLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Availability</dt>
                <dd className="font-medium">{website.observedLabel}</dd>
              </div>
              {website.sslStatusLabel ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-600">SSL</dt>
                  <dd className="font-medium">{website.sslStatusLabel}</dd>
                </div>
              ) : null}
              {website.lastCheckedLabel ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-600">Last checked</dt>
                  <dd>{website.lastCheckedLabel}</dd>
                </div>
              ) : null}
            </dl>
          </PortalCard>

          <PortalCard>
            <h2 className="font-semibold text-[#535353]">Website care</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Care status</dt>
                <dd className="font-medium">{website.careStatusLabel}</dd>
              </div>
              {website.carePlanName ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-600">Care plan</dt>
                  <dd>{website.carePlanName}</dd>
                </div>
              ) : null}
              {website.nextMaintenanceLabel ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-600">Next scheduled maintenance</dt>
                  <dd>{website.nextMaintenanceLabel}</dd>
                </div>
              ) : null}
              {website.lastMaintenanceLabel ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-600">Last maintenance</dt>
                  <dd>{website.lastMaintenanceLabel}</dd>
                </div>
              ) : null}
            </dl>
          </PortalCard>

          <PortalCard className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-[#535353]">Open support</h2>
              <Link href={`/portal/websites/${websiteId}?tab=support`} className="text-sm text-[#F47A48] hover:underline">
                View all
              </Link>
            </div>
            {openSupport.length ? (
              <ul className="divide-y divide-neutral-100">
                {openSupport.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <Link href={s.href} className="font-medium hover:underline">
                        {s.subject}
                      </Link>
                      <p className="text-sm text-neutral-600">
                        {s.supportNumber} · {s.statusLabel}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-600">No open support requests.</p>
            )}
          </PortalCard>

          <PortalCard className="lg:col-span-2">
            <h2 className="mb-3 font-semibold text-[#535353]">Recent care</h2>
            {recentCare.length ? (
              <ul className="space-y-3">
                {recentCare.map((e) => (
                  <li key={e.id} className="text-sm">
                    <p className="font-medium text-[#535353]">{e.title}</p>
                    <p className="text-neutral-600">{e.dateLabel}</p>
                    {e.summary ? <p className="mt-0.5 text-neutral-600">{e.summary}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-600">No recent care activity yet.</p>
            )}
          </PortalCard>

          <PortalCard className="lg:col-span-2">
            <h2 className="mb-3 font-semibold text-[#535353]">Website information</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-neutral-600">Domain</dt>
                <dd className="font-medium">{website.domain}</dd>
              </div>
              {website.platformLabel ? (
                <div>
                  <dt className="text-neutral-600">Platform</dt>
                  <dd>{website.platformLabel}</dd>
                </div>
              ) : null}
              {website.launchLabel ? (
                <div>
                  <dt className="text-neutral-600">Launch date</dt>
                  <dd>{website.launchLabel}</dd>
                </div>
              ) : null}
              {website.primaryProject ? (
                <div>
                  <dt className="text-neutral-600">Primary project</dt>
                  <dd>{website.primaryProject.name}</dd>
                </div>
              ) : null}
              {website.hostingLabel ? (
                <div>
                  <dt className="text-neutral-600">Hosting</dt>
                  <dd>{website.hostingLabel}</dd>
                </div>
              ) : null}
            </dl>
            {website.clientSummary ? (
              <p className="mt-3 text-sm text-neutral-600">{website.clientSummary}</p>
            ) : null}
          </PortalCard>
        </div>
      ) : null}

      {tab === "care" ? (
        <PortalCard>
          <h2 className="mb-4 font-semibold text-[#535353]">Care history</h2>
          {careEvents.length ? (
            <ul className="space-y-4">
              {careEvents.map((e) => (
                <li key={e.id} className="border-b border-neutral-100 pb-4 last:border-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-[#535353]">{e.title}</p>
                    <span className="text-sm text-neutral-500">{e.dateLabel}</span>
                  </div>
                  <p className="text-sm text-neutral-600">{e.typeLabel}</p>
                  {e.summary ? <p className="mt-1 text-sm text-neutral-600">{e.summary}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-600">No care history yet.</p>
          )}
        </PortalCard>
      ) : null}

      {tab === "support" ? (
        <div className="space-y-4">
          {website.canSubmitSupport ? (
            <div className="flex justify-end">
              <PortalPrimaryButton href={`/portal/support/new?website=${websiteId}`}>
                New request
              </PortalPrimaryButton>
            </div>
          ) : null}
          <PortalSupportSection title="Open" items={support.open} empty="No open support requests." />
          <PortalSupportSection title="Resolved" items={support.resolved.slice(0, 10)} empty="No resolved requests yet." />
        </div>
      ) : null}
    </div>
  );
}

function PortalSupportSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: {
    id: string;
    supportNumber: string;
    subject: string;
    statusLabel: string;
    needsResponse: boolean;
    href: string;
  }[];
  empty: string;
}) {
  return (
    <PortalCard>
      <h2 className="mb-3 font-semibold text-[#535353]">{title}</h2>
      {items.length ? (
        <ul className="divide-y divide-neutral-100">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <Link href={s.href} className="font-medium hover:underline">
                  {s.subject}
                </Link>
                <p className="text-sm text-neutral-600">
                  {s.supportNumber} · {s.statusLabel}
                  {s.needsResponse ? " · Waiting for you" : ""}
                </p>
              </div>
              <PortalSecondaryButton href={s.href}>View</PortalSecondaryButton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-600">{empty}</p>
      )}
    </PortalCard>
  );
}
