import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  SolutionCtaLink,
  SolutionServiceLink,
} from "@/components/solutions/solution-cta-link";
import {
  DecisionSection,
  NumberedCauseList,
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
import type { NewBusinessSolutionPageContent } from "@/data/solution-pages";
import type { Solution } from "@/types";
import { cn } from "@/lib/utils";

type NewBusinessSolutionPageProps = {
  solution: Solution;
  content: NewBusinessSolutionPageContent;
};

export function NewBusinessSolutionPage({
  solution,
  content,
}: NewBusinessSolutionPageProps) {
  const causes = solution.possibleCauses ?? [];
  const reviewAreas = solution.whatWeReview ?? [];
  const mistakes = solution.problemSymptoms ?? [];

  return (
    <SolutionPageChrome solution={solution}>
      <SolutionHero solution={solution} visual={<FoundationHeroVisual />} />

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Core principle</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.corePrinciple.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.corePrinciple.body}
            </p>
          </div>
          <div className="mt-10 grid gap-8 border-t border-border pt-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                Starting here first often weakens the foundation
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {content.corePrinciple.before.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-muted"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                Decide these first
              </p>
              <ul className="mt-3 space-y-2 text-[0.9375rem] font-semibold text-foreground">
                {content.corePrinciple.after.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14 lg:!py-16">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Planning framework</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Goal → Audience → Message → Structure → Content → Design → Build
              → Measure
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.planningIntro}
            </p>
          </div>
          <PlanningFrameworkVisual stages={content.planningStages} />
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Website job</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              What Does the Website Actually Need to Do?
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.websiteJobs.intro}
            </p>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {content.websiteJobs.jobs.map((job) => (
              <li
                key={job}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
              >
                {job}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-2xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">
            {content.websiteJobs.closing}
          </p>
        </Container>
      </Section>

      <Section tone="dark" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
              Version one
            </p>
            <h2 className="heading-section mt-3 font-display font-semibold text-white">
              {content.minimumUseful.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-white/75 sm:text-[1.0625rem]">
              {content.minimumUseful.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.minimumUseful.priorities.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-sm font-semibold text-orange-100"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-white/80 sm:text-base">
              {content.minimumUseful.closing}
            </p>
          </div>
        </Container>
      </Section>

      <DecisionSection
        eyebrow="Sequencing"
        title="Launch Now / Add Next / Later"
        intro={content.phasedPlan.intro}
        levels={content.phasedPlan.phases}
      />

      <GrowthPhasesVisual phases={content.growthPhases} />

      <NumberedCauseList
        eyebrow="Why businesses start here"
        title="Common Starting Situations"
        description="These are planning contexts — not diagnoses. The right version one still depends on the business."
        causes={causes}
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Structure</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              What Pages Does a New Business Website Usually Need?
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.pagesNeeded.intro}
            </p>
          </div>
          <ul className="mt-10 grid gap-0 border-t border-border sm:grid-cols-2">
            {content.pagesNeeded.pages.map((page) => (
              <li
                key={page.title}
                className="border-b border-border py-5 sm:px-4 sm:odd:border-r"
              >
                <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                  {page.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                  {page.description}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[0.9375rem] font-semibold text-foreground">
            {content.pagesNeeded.closing}
          </p>

          <div className="mt-14 border-t border-border pt-12">
            <div className="max-w-2xl">
              <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                Example starting architectures
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.architectures.intro}
              </p>
            </div>
            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              {content.architectures.examples.map((example) => (
                <div
                  key={example.title}
                  className="border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 lg:first:border-l-0 lg:first:pl-0"
                >
                  <h4 className="font-display text-lg font-semibold tracking-tight">
                    {example.title}
                  </h4>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                    {example.description}
                  </p>
                  <ul className="mt-4 space-y-1.5 text-[0.9375rem] font-semibold text-foreground">
                    {example.pages.map((page) => (
                      <li key={page}>{page}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.contentBeforeDesign.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.contentBeforeDesign.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.contentBeforeDesign.topics.map((topic) => (
                  <li
                    key={topic}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                  >
                    {topic}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.contentBeforeDesign.closing}
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.copy.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.copy.body}
              </p>
              <ul className="mt-5 space-y-2 text-[0.9375rem] font-semibold text-foreground">
                {content.copy.needs.map((need) => (
                  <li key={need}>{need}</li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:gap-5">
                <SolutionServiceLink
                  href="/services/seo-copywriting"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  SEO Copywriting →
                </SolutionServiceLink>
                <SolutionServiceLink
                  href="/services/website-strategy"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Website Strategy →
                </SolutionServiceLink>
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-10 border-t border-border pt-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.branding.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.branding.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.branding.minimum.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.branding.closing}
              </p>
              <SolutionServiceLink
                href="/services/branding"
                slug={solution.slug}
                className="mt-4 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Brand Identity & Web Branding →
              </SolutionServiceLink>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.domain.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.domain.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.domain.considerations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Platform</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Which Platform Should a New Business Use?
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.platforms.intro}
            </p>
          </div>
          <ul className="mt-10 grid gap-0 border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {content.platforms.options.map((option) => (
              <li
                key={option.title}
                className="border-b border-border py-5 sm:px-4 lg:border-r lg:[&:nth-child(3n)]:border-r-0"
              >
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  {option.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                  {option.description}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/platforms"
            className="mt-6 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
          >
            Explore Platforms →
          </Link>

          <div className="mt-12 max-w-2xl border-l-2 border-accent pl-5 sm:pl-6">
            <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {content.platformFirst.title}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.platformFirst.body}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {content.platformFirst.factors.map((factor) => (
                <li
                  key={factor}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Search foundations</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.seoDayOne.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.seoDayOne.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.seoDayOne.foundations.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.seoDayOne.closing}
            </p>
            <SolutionServiceLink
              href="/seo"
              slug={solution.slug}
              className="mt-5 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
            >
              Explore SEO →
            </SolutionServiceLink>
          </div>

          <div className="mt-12 max-w-2xl rounded-xl border border-border bg-surface p-6 sm:p-8">
            <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {content.seoBoltOn.title}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.seoBoltOn.body}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {content.seoBoltOn.areas.map((area) => (
                <li
                  key={area}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.conversion.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.conversion.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.conversion.actions.map((action) => (
                  <li
                    key={action}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {action}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                Influences from the start
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {content.conversion.influences.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:gap-5">
                <SolutionServiceLink
                  href="/services/conversion-rate-optimization"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Conversion Rate Optimization →
                </SolutionServiceLink>
                <SolutionServiceLink
                  href="/services/landing-page-design"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Landing Page Design →
                </SolutionServiceLink>
              </div>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.proof.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.proof.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.proof.signals.map((signal) => (
                  <li
                    key={signal}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {signal}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.proof.closing}
              </p>
            </div>
          </div>

          <div className="mt-14 grid gap-10 border-t border-border pt-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.noClientsYet.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.noClientsYet.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.noClientsYet.alternatives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.photography.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.photography.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.photography.examples.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.photography.closing}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.forms.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.forms.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.forms.principles.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.integrations.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.integrations.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.integrations.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.integrations.closing}
              </p>
            </div>
          </div>

          <div className="mt-14 grid gap-10 border-t border-border pt-12 lg:grid-cols-3">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {content.analytics.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {content.analytics.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.analytics.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <SolutionServiceLink
                href="/services/analytics-conversion-tracking"
                slug={solution.slug}
                className="mt-4 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Analytics & Conversion Tracking →
              </SolutionServiceLink>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {content.performance.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {content.performance.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.performance.stages.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <SolutionServiceLink
                href="/services/website-performance-optimization"
                slug={solution.slug}
                className="mt-4 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Website Performance Optimization →
              </SolutionServiceLink>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {content.accessibility.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {content.accessibility.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.accessibility.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.accessibility.closing}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="eyebrow">Launch checklist</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                {content.launchChecklist.title}
              </h2>
              <ol className="mt-6 columns-1 gap-x-10 sm:columns-2">
                {content.launchChecklist.items.map((item, index) => (
                  <li
                    key={item}
                    className="mb-2 break-inside-avoid text-[0.9375rem] text-foreground"
                  >
                    <span className="font-display text-xs tabular-nums text-accent-text">
                      {String(index + 1).padStart(2, "0")}
                    </span>{" "}
                    {item}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="eyebrow">After launch</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                {content.afterLaunch.title}
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {content.afterLaunch.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.afterLaunch.needs.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <SolutionServiceLink
                href="/services/website-maintenance"
                slug={solution.slug}
                className="mt-5 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Website Maintenance →
              </SolutionServiceLink>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <h2 className="heading-section font-display font-semibold">
              {content.overbuild.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.overbuild.body}
            </p>
            <ul className="mt-6 space-y-2 text-[0.9375rem] text-foreground">
              {content.overbuild.examples.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-5 text-[0.9375rem] font-semibold text-foreground">
              {content.overbuild.closing}
            </p>
          </div>
        </Container>
      </Section>

      <SymptomList
        eyebrow="Planning pitfalls"
        title="Common Mistakes When Building a First Business Website"
        description="These are patterns to avoid — not reasons to delay launching a useful version one."
        symptoms={mistakes.slice(0, 8)}
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <h2 className="heading-section font-display font-semibold">
              {content.budget.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.budget.body}
            </p>
          </div>
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                Usually prioritise
              </p>
              <ul className="mt-3 space-y-2 text-[0.9375rem] font-semibold text-foreground">
                {content.budget.prioritize.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                Before
              </p>
              <ul className="mt-3 space-y-2 text-[0.9375rem] text-muted">
                {content.budget.later.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Before the build</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                What We Help Clarify Before the Build
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
        </Container>
      </Section>

      <RecommendedServices
        solution={solution}
        description="Capabilities that may help once goals, structure and version-one scope are clearer."
      />

      <Section tone="muted" className="!py-10 sm:!py-12">
        <Container>
          <div className="flex flex-col gap-3 border-l-2 border-accent pl-5 sm:flex-row sm:items-center sm:justify-between sm:pl-6">
            <p className="text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.servicesPrompt}
            </p>
            <SolutionCtaLink
              href="/services"
              label="Explore Website Services"
              slug={solution.slug}
              size="md"
              location="solution-services-prompt"
              className="shrink-0"
            />
          </div>
          {content.projectPlannerCta.enabled ? (
            <div className="mt-6 border-t border-border pt-6">
              <p className="text-[0.9375rem] leading-relaxed text-muted">
                {content.projectPlannerCta.prompt}
              </p>
              <SolutionCtaLink
                href={content.projectPlannerCta.href}
                label={content.projectPlannerCta.label}
                slug={solution.slug}
                size="md"
                location="solution-project-planner"
                className="mt-3"
              />
            </div>
          ) : null}
        </Container>
      </Section>

      <RelatedWork
        solution={solution}
        heading={content.relatedWorkHeading}
        description="Selected website projects that demonstrate clarity, service or property presentation and responsive execution — without claiming they were all new-business launches."
      />
      <RelatedInsights solution={solution} />

      <RelatedGuidance solution={solution} />
      <SolutionFaq
        solution={solution}
        title="Questions about new business websites"
        description="Practical answers for planning a first website without overbuilding or delaying for the wrong reasons."
      />
      <SolutionFinalCta solution={solution} />
      <RelatedSolutions solution={solution} />
      <SolutionBackLink />
    </SolutionPageChrome>
  );
}

function PlanningFrameworkVisual({
  stages,
}: {
  stages: NewBusinessSolutionPageContent["planningStages"];
}) {
  return (
    <ol
      className="mt-10 flex flex-col lg:flex-row lg:flex-wrap lg:gap-y-6"
      aria-label="Planning framework: Goal, Audience, Message, Structure, Content, Design, Build, Measure"
    >
      {stages.map((stage, index) => (
        <li
          key={stage.title}
          className={cn(
            "flex flex-1 flex-col border-border",
            "border-t py-4 lg:min-w-[12%] lg:border-t-0 lg:border-l lg:px-3 lg:py-0 lg:first:border-l-0 lg:first:pl-0",
          )}
        >
          <div className="flex items-start gap-3 lg:flex-col lg:gap-2">
            <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="font-display text-base font-semibold tracking-tight sm:text-lg">
                {stage.title}
              </h3>
              <p className="mt-1 text-[0.875rem] leading-relaxed text-muted sm:text-[0.9375rem]">
                {stage.description}
              </p>
            </div>
          </div>
          {index < stages.length - 1 ? (
            <span
              className="mt-2 pl-8 text-accent-text lg:mt-4 lg:pl-0"
              aria-hidden
            >
              <span className="lg:hidden">↓</span>
              <span className="hidden lg:inline">→</span>
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function GrowthPhasesVisual({
  phases,
}: {
  phases: NewBusinessSolutionPageContent["growthPhases"];
}) {
  return (
    <Section tone="muted" className="!py-10 sm:!py-12">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Phased growth</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Now → Next → Grow
          </h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
            Launch an essential foundation, improve from real use, then add
            content and features when justified.
          </p>
        </div>
        <ol
          className="mt-8 flex flex-col gap-0 sm:flex-row"
          aria-label="Growth phases: Now, Next, Grow"
        >
          {phases.map((phase, index) => (
            <li
              key={phase.title}
              className="flex flex-1 flex-col border-t border-border py-5 sm:border-t-0 sm:border-l sm:px-5 sm:py-0 sm:first:border-l-0 sm:first:pl-0"
            >
              <span className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-accent-text">
                {phase.title}
              </span>
              <p className="mt-2 text-[0.9375rem] font-semibold text-foreground sm:text-base">
                {phase.description}
              </p>
              {index < phases.length - 1 ? (
                <span
                  className="mt-3 text-accent-text sm:mt-4"
                  aria-hidden
                >
                  <span className="sm:hidden">↓</span>
                  <span className="hidden sm:inline">→</span>
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

function FoundationHeroVisual() {
  const stages = [
    "Business idea",
    "Goals",
    "Audience",
    "Content",
    "Structure",
    "Design",
    "Build",
    "Launch",
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
          Foundation plan
        </span>
      </div>
      <ol className="space-y-0 p-4 sm:p-5">
        {stages.map((stage, index) => (
          <li key={stage} className="flex flex-col">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted/40 px-3 py-2">
              <span className="font-display text-xs font-semibold tabular-nums text-accent-text">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[0.8125rem] font-semibold text-foreground sm:text-sm">
                {stage}
              </span>
            </div>
            {index < stages.length - 1 ? (
              <span className="py-1 pl-5 text-accent-text">↓</span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
