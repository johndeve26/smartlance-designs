import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  SolutionCtaLink,
  SolutionServiceLink,
} from "@/components/solutions/solution-cta-link";
import {
  DecisionSection,
  DiagnosticFramework,
  NumberedCauseList,
  ProblemContrast,
  RecommendedServices,
  RelatedGuidance,
  RelatedInsights,
  RelatedSolutions,
  RelatedWork,
  SolutionBackLink,
  SolutionFaq,
  SolutionFinalCta,
  SolutionHero,
  SolutionPageChrome,
  SymptomList,
} from "@/components/solutions/solution-primitives";
import type { RankingSolutionPageContent } from "@/data/solution-pages";
import type { Solution } from "@/types";
import { cn } from "@/lib/utils";

type RankingSolutionPageProps = {
  solution: Solution;
  content: RankingSolutionPageContent;
};

export function RankingSolutionPage({
  solution,
  content,
}: RankingSolutionPageProps) {
  const causes = solution.possibleCauses ?? [];
  const symptoms = solution.problemSymptoms ?? [];
  const reviewAreas = solution.whatWeReview ?? [];

  return (
    <SolutionPageChrome solution={solution}>
      <SolutionHero solution={solution} visual={<SearchVisibilityHeroVisual />} />

      <ProblemContrast
        eyebrow="The core distinction"
        title="Being Online and Being Discoverable Are Different Things."
        intro={content.onlineVsDiscoverable.intro}
        left={content.onlineVsDiscoverable.exists}
        right={content.onlineVsDiscoverable.searchReady}
        tone="default"
      />

      <DiagnosticFramework
        eyebrow="Search visibility model"
        title="Where Search Visibility Breaks Down"
        description={content.visibilityModelIntro}
        stages={content.visibilityStages}
      />

      <NumberedCauseList
        eyebrow="Common causes"
        title="Common Reasons a Website Doesn’t Rank"
        description={content.causesIntro}
        causes={causes}
      />

      <Section className="!py-10 sm:!py-12">
        <Container>
          <div className="max-w-2xl border-l-2 border-accent pl-5 sm:pl-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {content.keywordsMyth.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.keywordsMyth.body}
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Technical access</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                {content.crawlIndex.title}
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {content.crawlIndex.intro}
              </p>
            </div>
            <ul className="grid gap-0 sm:grid-cols-2 sm:gap-x-8">
              {content.crawlIndex.issues.map((issue) => (
                <li
                  key={issue}
                  className="border-t border-border py-3 text-[0.9375rem] text-foreground sm:text-base"
                >
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="dark" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
              Important distinction
            </p>
            <h2 className="heading-section mt-3 font-display font-semibold text-white">
              {content.indexedNotCompetitive.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-white/75 sm:text-[1.0625rem]">
              {content.indexedNotCompetitive.body}
            </p>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {content.indexedNotCompetitive.points.map((point) => (
              <li
                key={point}
                className="border border-white/12 bg-white/[0.04] px-5 py-4 text-[0.9375rem] font-semibold text-white sm:text-base"
              >
                {point}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Search intent</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.searchIntent.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.searchIntent.body}
            </p>
          </div>
          <ul className="mt-10 space-y-6 border-t border-border pt-8">
            {content.searchIntent.examples.map((example) => (
              <li key={example.query} className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                  Someone searches
                </p>
                <p className="mt-2 font-display text-xl font-semibold tracking-tight">
                  “{example.query}”
                </p>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {example.mismatch}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-14 grid gap-10 border-t border-border pt-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {content.architecture.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.architecture.body}
              </p>
              <ul className="mt-5 space-y-2 text-[0.9375rem] text-foreground sm:text-base">
                {content.architecture.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="text-accent-text" aria-hidden>
                      ·
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {content.contentQuality.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.contentQuality.body}
              </p>
              <ul className="mt-5 space-y-2 text-[0.9375rem] text-foreground sm:text-base">
                {content.contentQuality.weaknesses.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-accent-text" aria-hidden>
                      ·
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 max-w-3xl border-t border-border pt-10">
            <h3 className="font-display text-2xl font-semibold tracking-tight">
              {content.onPage.title}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.onPage.body}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {content.onPage.signals.map((signal) => (
                <li
                  key={signal}
                  className="rounded-md border border-border bg-surface-muted/60 px-3 py-1.5 text-sm font-semibold text-foreground"
                >
                  {signal}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 max-w-3xl">
            <h3 className="font-display text-2xl font-semibold tracking-tight">
              {content.performance.title}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.performance.body}
            </p>
            <SolutionServiceLink
              href="/services/website-performance-optimization"
              slug={solution.slug}
              className="group mt-4 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
            >
              Explore Website Performance Optimization
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden
              />
            </SolutionServiceLink>
          </div>
        </Container>
      </Section>

      <ProblemContrast
        eyebrow="Diagnostic scope"
        title="Is the Whole Website Invisible — or Just Certain Pages?"
        intro={content.siteWideVsPage.intro}
        left={content.siteWideVsPage.siteWide}
        right={content.siteWideVsPage.pageSpecific}
        tone="muted"
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-3 lg:gap-10">
            <div className="lg:col-span-1">
              <p className="eyebrow">Local search</p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.localSearch.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.localSearch.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.localSearch.considerations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <SolutionServiceLink
                href="/seo/local-seo"
                slug={solution.slug}
                className="group mt-5 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Explore Local SEO
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </SolutionServiceLink>
            </div>

            <div className="border-t border-border pt-8 lg:col-span-1 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              <p className="eyebrow">New websites</p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.newWebsite.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.newWebsite.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.newWebsite.stillNeeds.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-accent-text" aria-hidden>
                      ·
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border pt-8 lg:col-span-1 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              <p className="eyebrow">Visibility decline</p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.rankingDrop.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.rankingDrop.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.rankingDrop.areas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-2">
                <SolutionServiceLink
                  href="/services/website-migration"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Website Migration →
                </SolutionServiceLink>
                <SolutionServiceLink
                  href="/seo/seo-audit"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  SEO Audit →
                </SolutionServiceLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <SymptomList
        eyebrow="Possible indicators"
        title="Signs the Website May Have a Search Visibility Problem"
        description="These are possible indicators — not a diagnosis on their own. The cause still needs reviewing in context."
        symptoms={symptoms}
      />

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Before recommending a fix</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                What We Look At Before Recommending an SEO Fix
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {content.diagnoseNote}
              </p>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.searchConsoleNote}
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
              {reviewAreas.map((area, index) => (
                <li
                  key={area}
                  className="flex items-baseline gap-2 border-b border-border py-3 text-[0.9375rem] font-semibold text-foreground sm:text-base"
                >
                  <span className="font-display text-xs tabular-nums text-accent-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <DecisionSection
        eyebrow="Scope decisions"
        title="Does Poor Ranking Mean You Need a New Website?"
        intro={`Not necessarily. ${content.rebuildIntro}`}
        levels={content.rebuildLevels}
      />

      <RecommendedServices
        solution={solution}
        description="Capabilities that may help once the visibility problem is clearer — starting with diagnosis when the cause is not obvious."
      />

      <Section tone="muted" className="!py-10 sm:!py-12">
        <Container>
          <div className="grid gap-8 border border-border bg-surface p-6 sm:p-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
                {content.seoAuditVsWebsiteAudit.seoAudit.title}
              </p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.seoAuditVsWebsiteAudit.seoAudit.description}
              </p>
              <SolutionServiceLink
                href="/seo/seo-audit"
                slug={solution.slug}
                className="group mt-4 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Explore SEO Audit
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </SolutionServiceLink>
            </div>
            <div className="border-t border-border pt-6 md:border-t-0 md:border-l md:pl-8 md:pt-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
                {content.seoAuditVsWebsiteAudit.websiteAudit.title}
              </p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.seoAuditVsWebsiteAudit.websiteAudit.description}
              </p>
              <SolutionServiceLink
                href="/services/website-audit"
                slug={solution.slug}
                className="group mt-4 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Explore Website Audit
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </SolutionServiceLink>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-l-2 border-accent pl-5 sm:flex-row sm:items-center sm:justify-between sm:pl-6">
            <p className="text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.freeReviewPrompt}
            </p>
            <SolutionCtaLink
              href="/free-website-review"
              label="Get a Free Website Review"
              slug={solution.slug}
              size="md"
              location="solution-free-review-prompt"
              className="shrink-0"
            />
          </div>
        </Container>
      </Section>

      <RelatedWork
        solution={solution}
        heading={content.relatedWorkHeading}
        description="Selected projects that include website and SEO foundations — without fabricated ranking outcomes."
      />
      <RelatedInsights solution={solution} />

      <RelatedGuidance solution={solution} />
      <SolutionFaq
        solution={solution}
        title="Questions about websites that aren’t ranking"
        description="Practical answers for when the site exists but search visibility stays weak."
      />
      <SolutionFinalCta solution={solution} />
      <RelatedSolutions solution={solution} />
      <SolutionBackLink />
    </SolutionPageChrome>
  );
}

function SearchVisibilityHeroVisual() {
  const stages = [
    "Website",
    "Discoverable?",
    "Crawlable?",
    "Understandable?",
    "Matches a real need?",
    "Strong enough to compete?",
  ];

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
      aria-hidden
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-border" />
        <span className="h-2 w-2 rounded-full bg-border" />
        <span className="h-2 w-2 rounded-full bg-border" />
        <div className="ml-3 flex h-6 flex-1 items-center rounded-md border border-border bg-surface px-2.5">
          <span className="text-[0.625rem] font-medium text-subtle">
            search visibility check
          </span>
        </div>
      </div>
      <ol className="space-y-0 p-4 sm:p-5">
        {stages.map((stage, index) => (
          <li key={stage} className="flex flex-col">
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3.5 py-2.5",
                index === 0
                  ? "border-border bg-surface-muted/70"
                  : index === stages.length - 1
                    ? "border-dashed border-accent/45 bg-accent/5"
                    : "border-border bg-surface",
              )}
            >
              <span className="font-display text-xs font-semibold tabular-nums text-accent-text">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[0.9375rem] font-semibold text-foreground">
                {stage}
              </span>
            </div>
            {index < stages.length - 1 ? (
              <div className="flex justify-center py-1">
                <span className="text-accent-text">↓</span>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
