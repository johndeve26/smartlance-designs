import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BlogCard } from "@/components/ui/blog-card";
import { Button } from "@/components/ui/button";
import { ResourceTrackedLink } from "@/components/resources/resource-tracked-link";
import { GuideCard } from "@/components/guides/guide-body";
import { ComparisonCard } from "@/components/comparisons/comparison-hero";
import {
  explainedResourceTypes,
  getGuideCount,
  getInsightCount,
  getComparisonCount,
  getChecklistCount,
  getGlossaryCount,
  getTemplateCount,
  getToolCount,
  getPublishedResourceTypes,
  getResourceTypeConfig,
  getTopicHref,
  resourceGoals,
  resourceTopics,
} from "@/data/resources";
import type { BlogPostMeta } from "@/types";
import type { GuideContent, ComparisonContent } from "@/data/resource-content-types";
import { cn } from "@/lib/utils";

export function ResourcesHero() {
  const publishedTypes = getPublishedResourceTypes();
  const insightCount = getInsightCount();
  const guideCount = getGuideCount();
  const comparisonCount = getComparisonCount();
  const checklistCount = getChecklistCount();
  const glossaryCount = getGlossaryCount();
  const templateCount = getTemplateCount();
  const toolCount = getToolCount();

  return (
    <section className="border-b border-border bg-surface-muted">
      <Container className="!pt-10 !pb-12 sm:!pb-14">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Resources" }]}
        />

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] lg:gap-14">
          <div className="min-w-0">
            <p className="eyebrow">Resources</p>
            <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              Practical Resources for Better Website Decisions
            </h1>
            <p className="mt-5 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
              Explore practical guidance on website planning, design, SEO,
              conversion, performance and platforms — whether you&apos;re
              building from scratch or improving an existing site.
            </p>

            <nav
              aria-label="Resource types"
              className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              <span
                aria-current="page"
                className="text-sm font-semibold text-foreground"
              >
                All Resources
              </span>
              {publishedTypes.map((type) => {
                const count =
                  type.type === "insight"
                    ? insightCount
                    : type.type === "guide"
                      ? guideCount
                      : type.type === "comparison"
                        ? comparisonCount
                        : type.type === "checklist"
                          ? checklistCount
                          : type.type === "glossary"
                            ? glossaryCount
                            : type.type === "template"
                              ? templateCount
                              : type.type === "tool"
                                ? toolCount
                                : 0;
                return (
                <Link
                  key={type.type}
                  href={type.archivePath!}
                  className="text-sm font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {type.label}
                  {count > 1 ? (
                    <span className="ml-1.5 font-normal text-subtle">
                      ({count})
                    </span>
                  ) : null}
                </Link>
                );
              })}
            </nav>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <ResourcesHeroVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}

function ResourcesHeroVisual() {
  const panels = [
    { label: "GUIDE", lines: ["w-[92%]", "w-[70%]", "w-[84%]"] },
    { label: "CHECKLIST", lines: ["w-[88%]", "w-[64%]", "w-[76%]"] },
    { label: "COMPARISON", lines: ["w-[80%]", "w-[90%]", "w-[58%]"] },
    { label: "TOOL", lines: ["w-[86%]", "w-[72%]", "w-[68%]"] },
  ] as const;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
      aria-hidden
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-border" />
        <span className="h-2 w-2 rounded-full bg-border" />
        <span className="h-2 w-2 rounded-full bg-border" />
        <span className="ml-3 h-2 flex-1 rounded-full bg-border/80" />
      </div>

      <div className="relative grid grid-cols-2 gap-3 p-4 sm:p-5">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            background:
              "linear-gradient(145deg, rgba(244,122,72,0.08) 0%, transparent 48%)",
          }}
        />
        {panels.map((panel, index) => (
          <div
            key={panel.label}
            className={cn(
              "relative rounded-lg border border-border bg-surface-muted/70 p-3.5",
              index === 0 && "border-accent/35 bg-accent/[0.06]",
            )}
          >
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
              {panel.label}
            </p>
            <div className="mt-3 space-y-2">
              {panel.lines.map((width) => (
                <div
                  key={width}
                  className={cn("h-1.5 rounded-full bg-border/80", width)}
                />
              ))}
            </div>
            {index === 2 ? (
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <span className="h-6 rounded-md border border-border bg-surface" />
                <span className="h-6 rounded-md border border-dashed border-accent/40 bg-accent/10" />
              </div>
            ) : null}
            {index === 1 ? (
              <div className="mt-3 space-y-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-[3px] border border-border bg-surface" />
                    <span className="h-1.5 flex-1 rounded-full bg-border/70" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResourcesFeatured({
  leadGuide,
  supportingComparison,
  supportingInsights,
}: {
  leadGuide?: GuideContent | null;
  supportingComparison?: ComparisonContent | null;
  supportingInsights: BlogPostMeta[];
}) {
  if (!leadGuide && !supportingComparison && supportingInsights.length === 0) {
    return null;
  }

  const supportingPosts = supportingInsights.slice(
    0,
    supportingComparison ? 1 : 2,
  );

  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow="Featured"
          title="Start Here"
          description="A cornerstone Guide, a platform Comparison and practical Insights — foundations for better website decisions."
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12 lg:items-start">
          {leadGuide ? (
            <GuideCard guide={leadGuide} variant="featured" />
          ) : supportingInsights[0] ? (
            <BlogCard post={supportingInsights[0]} variant="lead" priority />
          ) : null}
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-1 lg:gap-9">
            {supportingComparison ? (
              <ComparisonCard
                comparison={supportingComparison}
                variant="compact"
              />
            ) : null}
            {(leadGuide
              ? supportingPosts
              : supportingInsights.slice(1, supportingComparison ? 2 : 3)
            ).map((post, index) => (
              <BlogCard
                key={post.slug}
                post={post}
                variant="featured"
                fallbackIndex={index + 1}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function ResourcesPlatformSelectorCallout() {
  return (
    <section className="border-b border-border">
      <Container className="py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
              Tool
            </p>
            <p className="mt-2 font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]">
              Not sure which platform fits your project?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
              Answer a few requirements questions and get a shortlist with
              trade-offs — not a fake winner.
            </p>
          </div>
          <Link
            href="/tools/website-platform-selector"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Try the Website Platform Selector
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

export function ResourcesBrowseByGoal() {
  return (
    <Section tone="muted">
      <Container>
        <SectionHeader
          eyebrow="By goal"
          title="What Are You Trying to Improve?"
          description="Start with the outcome you need. Each path connects to a practical Solutions page or platform guidance."
        />

        <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {resourceGoals.map((goal) => (
            <li key={goal.id} className="bg-surface">
              <ResourceTrackedLink
                href={goal.href}
                event="resource_goal_click"
                payload={{ goal: goal.id }}
                className="group flex h-full flex-col p-5 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:p-6"
              >
                <span className="font-display text-[1.125rem] font-semibold leading-snug text-foreground transition-colors group-hover:text-accent-text sm:text-[1.1875rem]">
                  {goal.label}
                </span>
                <span className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                  {goal.description}
                </span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text">
                  Explore
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-[2px] motion-reduce:transition-none" />
                </span>
              </ResourceTrackedLink>
            </li>
          ))}
        </ul>

        <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href="/project-planner"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Not sure what to plan? Use Project Planner
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/solutions"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Explore All Website Solutions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </p>
      </Container>
    </Section>
  );
}

export function ResourcesBrowseByTopic() {
  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow="By topic"
          title="Browse by Topic"
          description="Topics span Insights and future Resources. Links use existing Blog filters or hub pages — not thin archive shells."
        />

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resourceTopics.map((topic) => {
            const href = getTopicHref(topic);
            return (
              <li key={topic.id}>
                <ResourceTrackedLink
                  href={href}
                  event="resource_topic_click"
                  payload={{ topic: topic.id }}
                  className="group block border-b border-border pb-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="font-display text-[1.1875rem] font-semibold text-foreground transition-colors group-hover:text-accent-text sm:text-[1.25rem]">
                    {topic.label}
                  </span>
                  <span className="mt-1.5 block text-[0.9375rem] leading-relaxed text-muted">
                    {topic.description}
                  </span>
                </ResourceTrackedLink>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

export function ResourcesLatestInsights({ posts }: { posts: BlogPostMeta[] }) {
  if (posts.length === 0) return null;

  return (
    <Section tone="muted">
      <Container>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Insights"
            title="Latest Insights"
            description="Recent articles from the Smartlance Designs blog."
            className="mb-0"
          />
          <Button asChild variant="outline" className="shrink-0 self-start">
            <Link href="/blog">View All Insights</Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {posts.map((post, index) => (
            <BlogCard
              key={post.slug}
              post={post}
              variant="editorial"
              fallbackIndex={index}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function ResourcesTypeExplainer() {
  const items = explainedResourceTypes
    .map((type) => getResourceTypeConfig(type))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow="Formats"
          title="Different Questions Need Different Resources"
          description="Seven formats for different questions — articles, deep guides, trade-offs, verification, definitions, worksheets and decision tools."
        />

        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const showCta = item.published && item.archivePath;
            return (
              <li key={item.type} className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                  {item.shortLabel ?? item.label}
                </p>
                <h3 className="mt-2.5 font-display text-[1.25rem] font-semibold text-foreground sm:text-[1.3125rem]">
                  {item.label}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {item.description}
                </p>
                {showCta ? (
                  <Link
                    href={item.archivePath!}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Explore {item.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

export function ResourcesReviewCta() {
  return (
    <section className="section-padding-compact border-y border-border bg-surface-muted">
      <Container>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
              Not Sure Which Resource Applies to Your Website?
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
              If you&apos;d rather start with the website itself, request a free
              review and we&apos;ll help identify the areas worth looking at
              first.
            </p>
          </div>
          <Button asChild className="shrink-0 self-start">
            <Link href="/free-website-review">Get a Free Website Review</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
