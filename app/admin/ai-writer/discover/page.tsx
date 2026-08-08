import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AIWriterSubnav } from "@/components/admin/ai-writer/AIWriterSubnav";
import { TopicDiscoveryExploreForm } from "@/components/admin/ai-writer/TopicDiscoveryExploreForm";
import {
  bulkImportSeedsAction,
  ensureDiscoveryDefaultsAction,
  saveTopicStrategyAction,
} from "@/lib/admin/topic-intelligence-actions";
import { getDiscoveryProviderStatus } from "@/lib/ai/topic-intelligence/providers";
import { buildContentIndex } from "@/lib/ai/topic-intelligence/content-index";
import {
  buildCommercialCoverageMap,
  buildContentBalance,
  detectCoverageImbalance,
} from "@/lib/ai/topic-intelligence/coverage-map";
import {
  ensureDefaultSourcePacks,
  getOrCreateTopicStrategy,
} from "@/lib/ai/topic-intelligence/strategy";
import { DEFAULT_SOURCE_PACKS } from "@/lib/ai/topic-intelligence/default-packs";
import { DISCOVERY_MARKETS } from "@/lib/ai/topic-intelligence/types";
import { industries } from "@/data/industries";

export const dynamic = "force-dynamic";

function spString(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  return typeof v === "string" ? v : undefined;
}

function gapSupportLabel(level: "strong" | "moderate" | "weak" | "none"): string {
  switch (level) {
    case "strong":
      return "Well supported";
    case "moderate":
      return "Moderate support";
    case "weak":
      return "Limited support";
    default:
      return "No supporting content";
  }
}

export default async function TopicDiscoveryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminUser("use_ai_writer");
  await ensureDefaultSourcePacks();
  await getOrCreateTopicStrategy();

  const sp = (await searchParams) || {};
  const statusFilter = spString(sp, "status");
  const recFilter = spString(sp, "recommendation");
  const q = spString(sp, "q");

  const weekAgo = new Date();
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

  const [providerStatus, counts, opportunities, strategy, index, existingPackSlugs] =
    await Promise.all([
      getDiscoveryProviderStatus(),
      Promise.all([
        prisma.editorialOpportunity.count({ where: { status: "NEW" } }),
        prisma.editorialOpportunity.count({ where: { status: "MONITORING" } }),
        prisma.editorialOpportunity.count({ where: { status: "REVIEWING" } }),
        prisma.editorialOpportunity.count({ where: { status: "APPROVED" } }),
        prisma.topicDiscoveryRun.count({
          where: { createdAt: { gte: weekAgo } },
        }),
      ]),
      prisma.editorialOpportunity.findMany({
        where: {
          ...(statusFilter
            ? { status: statusFilter as never }
            : { status: { not: "ARCHIVED" } }),
          ...(recFilter ? { recommendation: recFilter as never } : {}),
          ...(q
            ? {
                OR: [
                  { workingTitle: { contains: q, mode: "insensitive" } },
                  { coreTopic: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        take: 50,
      }),
      getOrCreateTopicStrategy(),
      buildContentIndex(),
      prisma.topicSourcePack.findMany({ select: { slug: true } }),
    ]);

  const [newCount, monitoringCount, reviewingCount, approvedCount, recentRuns] = counts;
  const coverage = buildCommercialCoverageMap(index);
  const balance = buildContentBalance(index);
  const imbalanceDetail = detectCoverageImbalance(balance);
  const weakCoverage = coverage
    .filter((c) => c.gapLevel === "none" || c.gapLevel === "weak")
    .slice(0, 8);

  const priorityList = Array.isArray(strategy.priorityThemesJson)
    ? (strategy.priorityThemesJson as string[])
    : [];
  const lowerList = Array.isArray(strategy.lowerPriorityThemesJson)
    ? (strategy.lowerPriorityThemesJson as string[])
    : [];
  const pausedList = Array.isArray(strategy.pausedTopicsJson)
    ? (strategy.pausedTopicsJson as string[])
    : [];

  const priorityThemes = priorityList.join("\n");
  const lowerThemes = lowerList.join("\n");
  const paused = pausedList.join("\n");

  const strategyConfigured = priorityList.length > 0 || lowerList.length > 0;
  const isFirstUse =
    newCount + monitoringCount + reviewingCount + approvedCount + recentRuns === 0 &&
    opportunities.length === 0;

  const packSlugSet = new Set(existingPackSlugs.map((p) => p.slug));
  const needsRecommendedPacks = DEFAULT_SOURCE_PACKS.some((p) => !packSlugSet.has(p.slug));

  const externalSparse =
    !providerStatus.webSearch.configured && !providerStatus.news.configured;

  const industryOptions = industries.map((i) => ({ slug: i.slug, title: i.name }));

  const notice =
    spString(sp, "strategy") === "saved"
      ? "Topic strategy saved"
      : spString(sp, "seeds")
        ? `${spString(sp, "seeds")} topic ideas added`
        : spString(sp, "created")
          ? `Discovery complete — ${spString(sp, "created")} opportunities created`
          : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <header className="space-y-3">
        <nav className="text-sm text-neutral-500">
          <Link href="/admin/ai-writer" className="hover:text-neutral-800">
            AI Writer
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-neutral-800">Topic Intelligence</span>
        </nav>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Topic Intelligence
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Find worthwhile topics to write, update, expand, monitor, or ignore by combining
            Smartlance content gaps with current industry and search signals.
          </p>
        </div>
        <AIWriterSubnav current="/admin/ai-writer/discover" />
      </header>

      {notice ? (
        <p className="text-sm text-emerald-800">✓ {notice}</p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat
          label="New opportunities"
          value={newCount}
          title="Newly discovered editorial opportunities that have not been reviewed."
        />
        <Stat
          label="Monitoring"
          value={monitoringCount}
          title="Topics worth watching but not ready for action."
        />
        <Stat
          label="Needs review"
          value={reviewingCount}
          title="Opportunities waiting for an editorial decision."
        />
        <Stat
          label="Approved backlog"
          value={approvedCount}
          title="Approved opportunities ready to become Editorial Studio projects."
        />
        <Stat
          label="Discovery runs"
          secondary="Last 7 days"
          value={recentRuns}
          title="Manual discovery runs completed in the last 7 days."
        />
      </section>

      {isFirstUse ? (
        <p className="text-sm text-neutral-600">
          Start by researching a topic or scanning a Watchlist. Opportunities you keep will appear
          in the approved backlog.
        </p>
      ) : null}

      <section className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800">Discovery sources</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Signals available to Topic Intelligence when researching opportunities.
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-sm">
          <SourceStat
            label="Web research"
            value={
              providerStatus.webSearch.configured
                ? providerStatus.webSearch.label
                : "Not configured"
            }
            ok={providerStatus.webSearch.configured}
            title="A piece of evidence may come from web research providers when configured."
          />
          <SourceStat
            label="News"
            value={providerStatus.news.configured ? providerStatus.news.label : "Not configured"}
            ok={providerStatus.news.configured}
          />
          <SourceStat
            label="Search trends"
            value={providerStatus.trends.configured ? providerStatus.trends.label : "Unavailable"}
            ok={providerStatus.trends.configured}
          />
          <SourceStat
            label="Trusted feeds"
            value="Enabled"
            ok
            title="Source Pack: a curated group of trusted sources used when researching a subject area."
          />
          <SourceStat
            label="Source Packs"
            value={`${providerStatus.industryPacksActive} active`}
            ok={providerStatus.industryPacksActive > 0}
            title="Source Pack: a curated group of trusted sources used when researching a subject area."
          />
        </div>
        {externalSparse ? (
          <p className="mt-3 text-xs text-neutral-600">
            Discovery still works with your site content, trusted feeds, Source Packs, and manual
            suggestions. Connect additional providers for broader external research.
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link
            href="/admin/ai-writer/source-packs"
            className="text-neutral-700 underline-offset-2 hover:underline"
            title="Source Pack: a curated group of trusted sources used when researching a subject area."
          >
            Source Packs
          </Link>
          <Link
            href="/admin/ai-writer/watchlists"
            className="text-neutral-700 underline-offset-2 hover:underline"
            title="Watchlist: a topic Smartlance checks repeatedly for useful developments."
          >
            Watchlists
          </Link>
          {needsRecommendedPacks ? (
            <form action={ensureDiscoveryDefaultsAction}>
              <button
                type="submit"
                className="text-neutral-700 underline-offset-2 hover:underline"
              >
                Set up recommended packs
              </button>
            </form>
          ) : null}
        </div>
      </section>

      {/* Primary: research */}
      <section id="explore" className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">What should we explore?</h2>
        <p className="mt-1 max-w-2xl text-sm text-neutral-600">
          Start with a topic, question, platform, industry, or editorial idea. Topic Intelligence
          will research the opportunity before recommending what to do with it.
        </p>
        <div className="mt-4">
          <TopicDiscoveryExploreForm
            industries={industryOptions}
            showFirstRunHint={isFirstUse}
          />
        </div>
      </section>

      {/* Primary once populated / secondary otherwise: opportunities */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-lg font-semibold text-neutral-900"
              title="Editorial opportunity: a reviewed candidate for new content, an update, an expansion, monitoring, or rejection."
            >
              Editorial opportunities
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Topics worth writing, updating, expanding, monitoring, or rejecting. Nothing here is
              written or published automatically.
            </p>
          </div>
          <form className="flex flex-wrap items-center gap-2">
            <input
              name="q"
              defaultValue={q || ""}
              placeholder="Search opportunities…"
              className="admin-input"
              aria-label="Search opportunities"
            />
            <select
              name="status"
              defaultValue={statusFilter || ""}
              className="admin-input"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="NEW">New</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="APPROVED">Approved</option>
              <option value="MONITORING">Monitoring</option>
              <option value="REJECTED">Rejected</option>
              <option value="CONVERTED_TO_PROJECT">Converted</option>
            </select>
            <button type="submit" className="admin-btn">
              Filter
            </button>
          </form>
        </div>

        <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {opportunities.map((opp) => (
            <Link
              key={opp.id}
              href={`/admin/ai-writer/discover/${opp.id}`}
              className="block px-4 py-3 hover:bg-neutral-50"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900">{opp.workingTitle}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {opp.recommendation.replace(/_/g, " ")} · {opp.timeliness} ·{" "}
                    {opp.market || "global_en"}
                    {opp.recurringSignal ? " · Recurring signal" : ""}
                  </p>
                  {opp.whyNow ? (
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{opp.whyNow}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded border border-neutral-200 px-2 py-0.5 text-xs text-neutral-700">
                  {opp.badge || opp.status}
                </span>
              </div>
            </Link>
          ))}
          {!opportunities.length ? (
            <div className="px-4 py-5 text-sm">
              <p className="font-medium text-neutral-900">No editorial opportunities yet</p>
              <p className="mt-1 text-neutral-600">
                Research a topic above or scan a Watchlist to find potential new articles, content
                updates, and areas worth monitoring.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a href="#explore" className="text-sm font-medium text-neutral-800 underline-offset-2 hover:underline">
                  Research a topic
                </a>
                <Link
                  href="/admin/ai-writer/watchlists"
                  className="text-sm text-neutral-600 underline-offset-2 hover:underline"
                >
                  View Watchlists
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Secondary: coverage */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-base font-semibold text-neutral-900">Commercial authority gaps</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Important Services, Solutions, Platforms, and Industries that currently have limited
            supporting editorial content.
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Linked counts reflect content associated with this commercial page, not every article
            in the broader topic category.
          </p>
          {imbalanceDetail ? (
            <div className="mt-3 rounded-md border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
              <p className="font-medium">Coverage imbalance detected</p>
              <p className="mt-0.5">{imbalanceDetail}</p>
              <p className="mt-1 text-xs text-amber-900/80">
                This is an editorial observation, not a quota. New content should still earn its
                place.
              </p>
            </div>
          ) : null}
          <ul className="mt-3 divide-y divide-neutral-100 text-sm">
            {weakCoverage.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    {row.entityType}
                  </p>
                  <p className="font-medium text-neutral-900">{row.title}</p>
                  <p className="text-xs text-neutral-500">
                    {row.insightCount} linked Insights · {row.resourceCount} linked Resources ·{" "}
                    {gapSupportLabel(row.gapLevel)}
                  </p>
                </div>
                <Link
                  href={row.path}
                  className="shrink-0 text-xs text-neutral-700 underline-offset-2 hover:underline"
                >
                  View
                </Link>
              </li>
            ))}
            {!weakCoverage.length ? (
              <li className="py-2 text-neutral-500">
                No limited-support commercial pages detected from the current content index.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-base font-semibold text-neutral-900">Content balance</h2>
          <p className="mt-1 text-sm text-neutral-600">
            A directional view of where Smartlance publishes most and least. Use it to spot gaps,
            not to force equal coverage.
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Topic categories (editorial themes). These are not the same as Industry commercial
            pages above.
          </p>
          <ul className="mt-3 space-y-2">
            {balance.map((row) => {
              const max = Math.max(1, ...balance.map((b) => b.insightCount));
              const pct = Math.round((row.insightCount / max) * 100);
              return (
                <li key={row.topicId} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-800">
                      {row.label}
                      <span className="ml-1 text-[10px] uppercase tracking-wide text-neutral-400">
                        Topic
                      </span>
                    </span>
                    <span className="text-xs text-neutral-500">
                      {row.insightCount} Insights · {row.resourceCount} Resources
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-neutral-100">
                    <div
                      className="h-1.5 rounded bg-neutral-400"
                      style={{ width: `${pct}%` }}
                      title="Longer bars show relative Insight volume — not automatic priority."
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Tertiary: utilities */}
      <section className="grid gap-3 lg:grid-cols-2">
        <details className="rounded-lg border border-neutral-200 bg-white open:shadow-sm">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-neutral-800 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              Add topic ideas
              <span className="text-xs font-normal text-neutral-500">Bulk utility</span>
            </span>
          </summary>
          <div className="border-t border-neutral-100 px-4 pb-4 pt-3">
            <p className="text-sm text-neutral-600">
              Add one idea per line. These become research starting points — not drafts.
            </p>
            <form action={bulkImportSeedsAction} className="mt-3 space-y-3">
              <textarea
                name="seeds"
                rows={5}
                className="admin-input text-sm"
                placeholder={
                  "Redesign vs rebuild\nWhy website traffic doesn't become enquiries\nWebsite migration without ranking loss\nCore Web Vitals for business owners\nLocal SEO for service businesses"
                }
                defaultValue=""
              />
              <button type="submit" className="admin-btn">
                Add ideas
              </button>
            </form>
          </div>
        </details>

        <details
          className="rounded-lg border border-neutral-200 bg-white open:shadow-sm"
          open={!strategyConfigured}
        >
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-neutral-800 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex flex-wrap items-center justify-between gap-2">
              Editorial strategy settings
              <span className="text-xs font-normal text-neutral-500">
                {priorityList.length} priority · {lowerList.length} lower · {pausedList.length}{" "}
                paused
              </span>
            </span>
          </summary>
          <div className="border-t border-neutral-100 px-4 pb-4 pt-3">
            <p className="text-sm text-neutral-600">
              Guide what Topic Intelligence should pay more or less attention to. Strategy
              influences prioritisation but never overrides duplication or quality checks.
            </p>
            <form action={saveTopicStrategyAction} className="mt-3 space-y-3">
              <label className="block text-sm">
                <span className="text-xs font-medium text-neutral-600">Default market</span>
                <select
                  name="defaultMarket"
                  defaultValue={strategy.defaultMarket}
                  className="admin-input mt-1"
                >
                  {DISCOVERY_MARKETS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-neutral-500">
                  Primary audience: US, UK, Europe, Canada, Australia, and other international
                  English-speaking markets.
                </span>
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-neutral-600">Priority themes</span>
                <textarea
                  name="priorityThemes"
                  defaultValue={priorityThemes}
                  rows={4}
                  className="admin-input mt-1 font-mono text-xs"
                  placeholder={
                    "website-redesign\nseo\nconversion\nwebsite-performance\necommerce"
                  }
                />
                <span className="mt-1 block text-xs text-neutral-500">
                  Areas Smartlance currently wants to build stronger editorial authority around.
                  One theme per line.
                </span>
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-neutral-600">Lower-priority themes</span>
                <textarea
                  name="lowerPriorityThemes"
                  defaultValue={lowerThemes}
                  rows={3}
                  className="admin-input mt-1 font-mono text-xs"
                  placeholder={"short-term-rentals\nairbnb\npricelabs"}
                />
                <span className="mt-1 block text-xs text-neutral-500">
                  Topics that may still be worth covering, but should need a stronger reason or
                  more distinctive angle. Prefer this over pausing hospitality as a whole.
                </span>
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-neutral-600">Paused topics</span>
                <textarea
                  name="pausedTopics"
                  defaultValue={paused}
                  rows={2}
                  className="admin-input mt-1 font-mono text-xs"
                  placeholder="Leave empty unless you intentionally pause a theme"
                />
                <span className="mt-1 block text-xs text-neutral-500">
                  Topics Topic Intelligence should not recommend for new content until removed
                  from this list.
                </span>
              </label>
              <button type="submit" className="admin-btn-primary">
                Save strategy
              </button>
            </form>
          </div>
        </details>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  secondary,
  title,
}: {
  label: string;
  value: number;
  secondary?: string;
  title?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3" title={title}>
      <p className="text-xs text-neutral-500">{label}</p>
      {secondary ? <p className="text-[10px] text-neutral-400">{secondary}</p> : null}
      <p className="mt-1 text-xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

function SourceStat({
  label,
  value,
  ok,
  title,
}: {
  label: string;
  value: string;
  ok?: boolean;
  title?: string;
}) {
  return (
    <div title={title}>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-0.5 text-sm ${ok ? "text-neutral-900" : "text-neutral-500"}`}>{value}</p>
    </div>
  );
}
