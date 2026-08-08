import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import Link from "next/link";
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
import type { PerformanceSolutionPageContent } from "@/data/solution-pages";
import type { Solution } from "@/types";
import { cn } from "@/lib/utils";

type PerformanceSolutionPageProps = {
  solution: Solution;
  content: PerformanceSolutionPageContent;
};

export function PerformanceSolutionPage({
  solution,
  content,
}: PerformanceSolutionPageProps) {
  const causes = solution.possibleCauses ?? [];
  const symptoms = solution.problemSymptoms ?? [];
  const reviewAreas = solution.whatWeReview ?? [];

  return (
    <SolutionPageChrome solution={solution}>
      <SolutionHero
        solution={solution}
        visual={<PerformanceHeroVisual />}
      />

      <ProblemContrast
        eyebrow="Two kinds of speed"
        title="Fast Enough Technically Is Not Always Fast Enough for Users."
        intro={content.measuredVsPerceived.intro}
        left={content.measuredVsPerceived.measured}
        right={content.measuredVsPerceived.perceived}
        tone="muted"
      />

      <DiagnosticFramework
        eyebrow="Performance journey"
        title="Where Website Performance Breaks Down"
        description={content.journeyIntro}
        stages={content.journeyStages}
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Core Web Vitals</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              What Are Core Web Vitals?
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              <Link
                href="/glossary/core-web-vitals"
                className="font-medium text-accent-text underline-offset-2 hover:underline"
              >
                Core Web Vitals
              </Link>{" "}
              are a useful way to talk about whether a page appears, stays
              stable and responds. They are important clues — not the whole
              performance story.
            </p>
          </div>
          <ol className="mt-10 grid gap-0 border-t border-border lg:grid-cols-3">
            {content.coreWebVitals.items.map((item, index) => {
              const glossaryHref =
                item.abbr === "LCP"
                  ? "/glossary/lcp"
                  : item.abbr === "INP"
                    ? "/glossary/inp"
                    : item.abbr === "CLS"
                      ? "/glossary/cls"
                      : null;
              return (
              <li
                key={item.abbr}
                className={cn(
                  "border-b border-border py-7 lg:border-b-0 lg:px-6 lg:py-8 lg:first:pl-0",
                  index < content.coreWebVitals.items.length - 1 &&
                    "lg:border-r",
                )}
              >
                <p className="font-display text-4xl font-semibold tracking-tight text-accent-text sm:text-5xl">
                  {glossaryHref ? (
                    <Link
                      href={glossaryHref}
                      className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {item.abbr}
                    </Link>
                  ) : (
                    item.abbr
                  )}
                </p>
                <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
                  {item.name}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {item.description}
                </p>
              </li>
              );
            })}
          </ol>
        </Container>
      </Section>

      <Section tone="dark" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
              Tooling in context
            </p>
            <h2 className="heading-section mt-3 font-display font-semibold text-white">
              {content.scoreClue.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-white/75 sm:text-[1.0625rem]">
              {content.scoreClue.body}
            </p>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {content.scoreClue.factors.map((factor) => (
              <li
                key={factor}
                className="rounded-md border border-white/15 bg-white/[0.04] px-3.5 py-2 text-[0.9375rem] font-semibold text-white"
              >
                {factor}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <NumberedCauseList
        eyebrow="Common causes"
        title="What Commonly Makes a Website Slow?"
        description={content.causesIntro}
        causes={causes}
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-3 lg:gap-10">
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {content.imagesNote.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.imagesNote.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.imagesNote.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="text-accent-text" aria-hidden>
                      ·
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {content.javascriptNote.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.javascriptNote.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.javascriptNote.examples.map((example) => (
                  <li
                    key={example}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {example}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {content.thirdPartyNote.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.thirdPartyNote.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.thirdPartyNote.examples.map((example) => (
                  <li
                    key={example}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <ProblemContrast
        eyebrow="Where the bottleneck sits"
        title="Is the Problem Hosting — or the Website Itself?"
        intro={content.hostingVsFrontend.intro}
        left={content.hostingVsFrontend.hosting}
        right={content.hostingVsFrontend.frontend}
        tone="muted"
      />

      <Section className="!py-8 sm:!py-10">
        <Container>
          <p className="max-w-3xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">
            {content.hostingVsFrontend.closing}
          </p>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:items-end lg:gap-14">
            <div>
              <p className="eyebrow">Mobile experience</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                {content.mobileNote.title}
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {content.mobileNote.body}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {content.mobileNote.factors.map((factor) => (
                <li
                  key={factor}
                  className="border-t border-border pt-3 text-[0.9375rem] font-semibold text-foreground sm:text-base"
                >
                  {factor}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-14 grid gap-10 border-t border-border pt-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {content.layoutShift.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.layoutShift.body}
              </p>
              <LayoutShiftVisual examples={content.layoutShift.examples} />
            </div>
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {content.interactionDelay.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.interactionDelay.body}
              </p>
              <ul className="mt-5 space-y-2 text-[0.9375rem] text-foreground sm:text-base">
                {content.interactionDelay.examples.map((example) => (
                  <li key={example} className="flex gap-2">
                    <span className="text-accent-text" aria-hidden>
                      ·
                    </span>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 max-w-3xl border-t border-border pt-10">
            <h3 className="font-display text-2xl font-semibold tracking-tight">
              {content.perceivedSpeed.title}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.perceivedSpeed.body}
            </p>
            <ul className="mt-5 space-y-2 text-[0.9375rem] text-foreground sm:text-base">
              {content.perceivedSpeed.ideas.map((idea) => (
                <li key={idea} className="flex gap-2">
                  <span className="text-accent-text" aria-hidden>
                    ·
                  </span>
                  {idea}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <SymptomList
        eyebrow="Possible indicators"
        title="Signs Your Website May Have a Performance Problem"
        description="These are possible indicators — not a diagnosis on their own. The cause still needs reviewing in context."
        symptoms={symptoms}
      />

      <ProblemContrast
        eyebrow="Diagnostic scope"
        title="Is the Whole Website Slow — or Just Certain Pages?"
        intro={content.siteWideVsPage.intro}
        left={content.siteWideVsPage.siteWide}
        right={content.siteWideVsPage.pageSpecific}
        tone="muted"
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.seoRelationship.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.seoRelationship.body}
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <SolutionServiceLink
                  href="/seo/technical-seo"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Technical SEO →
                </SolutionServiceLink>
                <SolutionServiceLink
                  href="/solutions/website-not-ranking"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Website Not Ranking →
                </SolutionServiceLink>
              </div>
            </div>
            <div className="border-t border-border pt-8 lg:border-t-0 lg:pt-0">
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.conversionRelationship.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.conversionRelationship.body}
              </p>
              <SolutionServiceLink
                href="/solutions/website-not-generating-leads"
                slug={solution.slug}
                className="mt-5 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Website Not Generating Leads →
              </SolutionServiceLink>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Before recommending a fix</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                What We Look At Before Recommending a Performance Fix
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {content.diagnoseNote}
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
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

          <div className="mt-14">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
              Diagnostic layers
            </p>
            <ol className="mt-6 flex flex-col">
              {content.diagnosticLayers.map((layer, index) => (
                <li key={layer.title} className="flex flex-col">
                  <div className="flex items-start gap-4 border-t border-border py-5">
                    <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                        {layer.title}
                      </h3>
                      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                        {layer.description}
                      </p>
                    </div>
                  </div>
                  {index < content.diagnosticLayers.length - 1 ? (
                    <span className="pl-10 text-accent-text" aria-hidden>
                      ↓
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <DecisionSection
        eyebrow="Scope decisions"
        title="Does a Slow Website Mean You Need to Rebuild It?"
        intro={`Not necessarily. ${content.rebuildIntro}`}
        levels={content.rebuildLevels}
      />

      <Section tone="muted" className="!py-10 sm:!py-12">
        <Container>
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {content.platformNote.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.platformNote.body}
            </p>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.platformNote.platforms.map((platform) => (
              <li
                key={platform.name}
                className="border-t border-border pt-4"
              >
                <p className="font-display text-lg font-semibold">
                  {platform.name}
                </p>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">
                  {platform.note}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <RecommendedServices
        solution={solution}
        description="Capabilities that may help once the performance problem is clearer — starting with optimization when the foundation is sound."
      />

      <Section className="!py-10 sm:!py-12">
        <Container>
          <div className="grid gap-8 border border-border bg-surface p-6 sm:p-8 md:grid-cols-3">
            {(
              [
                content.serviceDistinctions.performance,
                content.serviceDistinctions.technicalSeo,
                content.serviceDistinctions.websiteAudit,
              ] as const
            ).map((item, index) => (
              <div
                key={item.title}
                className={cn(
                  index > 0 && "border-t border-border pt-6 md:border-t-0 md:border-l md:pl-6 md:pt-0",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
                  {item.title}
                </p>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {item.description}
                </p>
              </div>
            ))}
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
        description="Selected website projects — without fabricated load-time or score claims."
      />
      <RelatedInsights solution={solution} />

      <RelatedGuidance solution={solution} />
      <SolutionFaq
        solution={solution}
        title="Questions about slow websites"
        description="Practical answers for when pages load slowly, feel heavy or struggle on mobile."
      />
      <SolutionFinalCta solution={solution} />
      <RelatedSolutions solution={solution} />
      <SolutionBackLink />
    </SolutionPageChrome>
  );
}

function PerformanceHeroVisual() {
  const layers = [
    { label: "Images", width: "w-[92%]" },
    { label: "Scripts", width: "w-[78%]" },
    { label: "Fonts", width: "w-[64%]" },
    { label: "Third-party", width: "w-[70%]" },
    { label: "Layout move", width: "w-[54%]" },
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
        <span className="ml-3 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-subtle">
          Loading sequence
        </span>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="rounded-lg border border-dashed border-accent/40 bg-accent/5 px-3.5 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
            First paint waiting
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border/70">
            <div className="h-full w-2/5 rounded-full bg-accent/60" />
          </div>
        </div>
        {layers.map((layer) => (
          <div key={layer.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm font-semibold text-foreground">
              {layer.label}
            </span>
            <div className="h-2.5 flex-1 rounded-full bg-surface-muted">
              <div
                className={cn(
                  "h-full rounded-full bg-border",
                  layer.width,
                  layer.label === "Scripts" && "bg-accent/45",
                  layer.label === "Third-party" && "bg-accent/30",
                )}
              />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface-muted/50 px-3.5 py-3">
          <span className="text-sm font-semibold text-foreground">
            Interaction delay
          </span>
          <span className="text-xs font-medium text-muted">Tap → wait</span>
        </div>
      </div>
    </div>
  );
}

function LayoutShiftVisual({ examples }: { examples: string[] }) {
  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-2 divide-x divide-border">
        <div className="bg-surface-muted/40 p-3">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
            While loading
          </p>
          <div className="mt-3 space-y-2" aria-hidden>
            <div className="h-3 w-4/5 translate-y-1 rounded bg-border" />
            <div className="h-16 translate-y-2 rounded border border-dashed border-accent/40 bg-accent/10" />
            <div className="h-8 w-1/2 -translate-y-1 rounded bg-border/80" />
          </div>
        </div>
        <div className="bg-surface p-3">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
            After settle
          </p>
          <div className="mt-3 space-y-2" aria-hidden>
            <div className="h-3 w-4/5 rounded bg-border" />
            <div className="h-16 rounded border border-border bg-surface-muted" />
            <div className="h-8 w-1/2 rounded bg-border/80" />
          </div>
        </div>
      </div>
      <ul className="space-y-1.5 border-t border-border px-3 py-3 text-sm text-muted">
        {examples.slice(0, 4).map((example) => (
          <li key={example}>{example}</li>
        ))}
      </ul>
    </div>
  );
}
