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
import type { EcommerceGrowthSolutionPageContent } from "@/data/solution-pages";
import type { Solution } from "@/types";
import { cn } from "@/lib/utils";

type EcommerceGrowthSolutionPageProps = {
  solution: Solution;
  content: EcommerceGrowthSolutionPageContent;
};

export function EcommerceGrowthSolutionPage({
  solution,
  content,
}: EcommerceGrowthSolutionPageProps) {
  const causes = solution.possibleCauses ?? [];
  const reviewAreas = solution.whatWeReview ?? [];
  const symptoms = solution.problemSymptoms ?? [];

  return (
    <SolutionPageChrome solution={solution}>
      <SolutionHero solution={solution} visual={<CommerceHeroVisual />} />

      <Section tone="dark" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
              Growth system
            </p>
            <h2 className="heading-section mt-3 font-display font-semibold text-white">
              {content.trafficNotEnough.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-white/75 sm:text-[1.0625rem]">
              {content.trafficNotEnough.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.trafficNotEnough.limits.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-sm font-semibold text-orange-100"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
              Influencing the system
            </p>
            <ul className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/90">
              {content.trafficNotEnough.system.map((part, index) => (
                <li key={part} className="flex items-center gap-2">
                  {index > 0 ? (
                    <span className="text-orange-300" aria-hidden>
                      ×
                    </span>
                  ) : null}
                  <span>{part}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-white/80 sm:text-base">
              {content.trafficNotEnough.closing}
            </p>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14 lg:!py-16">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Commerce journey</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Discover → Browse → Evaluate → Commit → Check Out → Return
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.journeyIntro}
            </p>
          </div>
          <JourneyVisual stages={content.journeyStages} />
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Growth model</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Visibility → Discovery → Product Experience → Conversion →
              Measurement → Improvement
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.growthModel.intro}
            </p>
          </div>
          <ol className="mt-10 flex flex-col lg:flex-row lg:flex-wrap">
            {content.growthModel.stages.map((stage, index) => (
              <li
                key={stage.title}
                className="flex flex-1 flex-col border-t border-border py-4 lg:min-w-[14%] lg:border-t-0 lg:border-l lg:px-3 lg:py-0 lg:first:border-l-0 lg:first:pl-0"
              >
                <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 font-display text-base font-semibold tracking-tight sm:text-lg">
                  {stage.title}
                </h3>
                <p className="mt-1 text-[0.875rem] leading-relaxed text-muted sm:text-[0.9375rem]">
                  {stage.description}
                </p>
                {index < content.growthModel.stages.length - 1 ? (
                  <span
                    className="mt-2 text-accent-text lg:mt-3"
                    aria-hidden
                  >
                    <span className="lg:hidden">↓</span>
                    <span className="hidden lg:inline">→</span>
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <NumberedCauseList
        eyebrow="Why stores stall"
        title="Common Reasons Online Stores Struggle to Grow"
        description="These are starting points for review — not a diagnosis on their own."
        causes={causes}
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Product discovery</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.discovery.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.discovery.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.discovery.areas.map((area) => (
                <li
                  key={area}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {area}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.discovery.closing}
            </p>
          </div>

          <DiscoveryVisual />

          <div className="mt-14 grid gap-10 border-t border-border pt-12 lg:grid-cols-3">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {content.categories.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {content.categories.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.categories.problems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {content.search.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {content.search.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.search.considerations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {content.filtering.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {content.filtering.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.filtering.examples.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.filtering.closing}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Product experience</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.productPage.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.productPage.body}
            </p>
          </div>
          <ul className="mt-8 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {content.productPage.information.map((item, index) => (
              <li
                key={item}
                className="flex items-baseline gap-2 border-b border-border py-3 text-[0.9375rem] font-semibold text-foreground"
              >
                <span className="font-display text-xs tabular-nums text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[0.9375rem] font-semibold text-foreground">
            {content.productPage.closing}
          </p>

          <div className="mt-14 grid gap-10 border-t border-border pt-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.imagery.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.imagery.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.imagery.points.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.copy.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.copy.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.copy.points.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <SolutionServiceLink
                href="/services/seo-copywriting"
                slug={solution.slug}
                className="mt-4 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                SEO Copywriting →
              </SolutionServiceLink>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <h2 className="heading-section font-display font-semibold">
              {content.trust.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.trust.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.trust.signals.map((signal) => (
                <li
                  key={signal}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {signal}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
              Avoid fabricating
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {content.trust.avoid.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-14 grid gap-10 border-t border-border pt-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.cart.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.cart.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.cart.problems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.checkout.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.checkout.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.checkout.areas.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.checkout.closing}
              </p>
            </div>
          </div>

          <div className="mt-12 max-w-2xl border-l-2 border-accent pl-5 sm:pl-6">
            <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {content.ethical.title}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.ethical.body}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {content.ethical.avoid.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.mobile.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.mobile.body}
              </p>
              <ul className="mt-5 space-y-2 text-[0.9375rem] text-foreground">
                {content.mobile.issues.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.performance.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.performance.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.performance.contributors.map((item) => (
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
                  href="/solutions/slow-website"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Slow Website →
                </SolutionServiceLink>
                <SolutionServiceLink
                  href="/services/website-performance-optimization"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Website Performance Optimization →
                </SolutionServiceLink>
              </div>
            </div>
          </div>

          <div className="mt-12 max-w-2xl border-t border-border pt-10">
            <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {content.apps.title}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.apps.body}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {content.apps.effects.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">E-commerce SEO</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.seo.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.seo.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.seo.areas.map((area) => (
                <li
                  key={area}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {area}
                </li>
              ))}
            </ul>
            <SolutionServiceLink
              href="/seo"
              slug={solution.slug}
              className="mt-5 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
            >
              Explore SEO →
            </SolutionServiceLink>
          </div>

          <div className="mt-12">
            <p className="text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.seoLayers.intro}
            </p>
            <div className="mt-6 grid gap-0 border-t border-border sm:grid-cols-3">
              {content.seoLayers.layers.map((layer) => (
                <div
                  key={layer.title}
                  className="border-b border-border py-5 sm:border-b-0 sm:border-r sm:px-4 sm:last:border-r-0 sm:first:pl-0"
                >
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    {layer.title}
                  </h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                    {layer.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-10 border-t border-border pt-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {content.duplicateContent.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {content.duplicateContent.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.duplicateContent.challenges.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.duplicateContent.closing}
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {content.outOfStock.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {content.outOfStock.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.outOfStock.depends.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Measurement</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.measurement.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.measurement.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.measurement.events.map((event) => (
                <li
                  key={event}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                >
                  {event}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.measurement.closing}
            </p>
          </div>

          <FunnelVisual stages={content.funnelStages} />

          <div className="mt-12 grid gap-10 border-t border-border pt-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                Analytics should support better questions
              </h3>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.analyticsQuestions.map((question) => (
                  <li key={question}>{question}</li>
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
                {content.trafficQuality.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {content.trafficQuality.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.trafficQuality.intents.map((intent) => (
                  <li
                    key={intent}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                  >
                    {intent}
                  </li>
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
              Which Commerce Platform Fits the Store?
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.platforms.intro}
            </p>
          </div>
          <ul className="mt-10 grid gap-0 border-t border-border sm:grid-cols-3">
            {content.platforms.options.map((option) => (
              <li
                key={option.title}
                className="border-b border-border py-5 sm:border-b-0 sm:border-r sm:px-4 sm:last:border-r-0 sm:first:pl-0"
              >
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  {option.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                  {option.description}
                </p>
                <Link
                  href={option.href}
                  className="mt-3 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Explore {option.title} →
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <ProblemContrast
        eyebrow="Platform decision"
        title="Should You Change E-commerce Platforms?"
        intro={content.shouldMigrate.intro}
        left={content.shouldMigrate.yes}
        right={content.shouldMigrate.no}
        tone="muted"
      />

      <Section className="!py-10 sm:!py-12">
        <Container>
          <SolutionServiceLink
            href="/solutions/website-migration"
            slug={solution.slug}
            className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
          >
            Planning a Website Migration →
          </SolutionServiceLink>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <h2 className="heading-section font-display font-semibold">
              {content.operations.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.operations.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.operations.dependencies.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.operations.closing}
            </p>
          </div>
        </Container>
      </Section>

      <DecisionSection
        eyebrow="Scope"
        title="Does Store Growth Require a Full Redesign?"
        intro="Not always. Start with the smallest intervention that can address the real limitation."
        levels={content.redesignLevels}
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.catalogueGrowth.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.catalogueGrowth.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.catalogueGrowth.areas.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.catalogueGrowth.closing}
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.postPurchase.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.postPurchase.body}
              </p>
              <ul className="mt-5 space-y-2 text-[0.9375rem] text-foreground">
                {content.postPurchase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-14 border-t border-border pt-12">
            <p className="eyebrow">Customer journey</p>
            <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              Optimise the Complete Path — Not Only Checkout
            </h3>
            <ol className="mt-8 flex flex-col sm:flex-row sm:flex-wrap">
              {content.customerJourney.map((stage, index) => (
                <li
                  key={stage.title}
                  className="flex flex-1 flex-col border-t border-border py-4 sm:min-w-[12%] sm:border-t-0 sm:border-l sm:px-3 sm:py-0 sm:first:border-l-0 sm:first:pl-0"
                >
                  <span className="font-display text-sm font-semibold text-accent-text">
                    {stage.title}
                  </span>
                  <p className="mt-1 text-[0.875rem] leading-relaxed text-muted">
                    {stage.description}
                  </p>
                  {index < content.customerJourney.length - 1 ? (
                    <span
                      className="mt-2 text-accent-text sm:mt-3"
                      aria-hidden
                    >
                      <span className="sm:hidden">↓</span>
                      <span className="hidden sm:inline">→</span>
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <SymptomList
        eyebrow="Possible signals"
        title="Signs the Store Experience May Be Limiting Growth"
        description="These are indicators — not proof of a single cause. The commerce system still needs reviewing in context."
        symptoms={symptoms}
      />

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Before recommending a fix</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                What We Look At Before Recommending an E-commerce Fix
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

          <div className="mt-14 border-t border-border pt-12">
            <p className="eyebrow">Priority framework</p>
            <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              Find → Understand → Trust → Buy → Measure → Improve
            </h3>
            <ol className="mt-8 flex flex-col lg:flex-row lg:flex-wrap">
              {content.priorityFramework.map((stage, index) => (
                <li
                  key={stage.title}
                  className="flex flex-1 flex-col border-t border-border py-4 lg:min-w-[14%] lg:border-t-0 lg:border-l lg:px-3 lg:py-0 lg:first:border-l-0 lg:first:pl-0"
                >
                  <span className="font-display text-sm font-semibold uppercase tracking-[0.08em] text-accent-text">
                    {stage.title}
                  </span>
                  <p className="mt-1 text-[0.875rem] leading-relaxed text-muted sm:text-[0.9375rem]">
                    {stage.description}
                  </p>
                  {index < content.priorityFramework.length - 1 ? (
                    <span
                      className="mt-2 text-accent-text lg:mt-3"
                      aria-hidden
                    >
                      <span className="lg:hidden">↓</span>
                      <span className="hidden lg:inline">→</span>
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <RecommendedServices
        solution={solution}
        description="Capabilities that may help once discovery, product experience, conversion, measurement or platform limits are clearer — without promising sales lifts."
      />

      <Section tone="muted" className="!py-10 sm:!py-12">
        <Container>
          <div className="flex flex-col gap-3 border-l-2 border-accent pl-5 sm:flex-row sm:items-center sm:justify-between sm:pl-6">
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

      {content.relatedWorkAvailable ? (
        <RelatedWork
          solution={solution}
          heading={content.relatedWorkHeading}
          description="Verified commerce or closely related store projects only."
        />
      ) : null}

      <RelatedInsights solution={solution} />

      <RelatedGuidance solution={solution} />
      <SolutionFaq
        solution={solution}
        title="Questions about e-commerce growth"
        description="Practical answers for stores that need stronger discovery, product experience, conversion or measurement — without hype or invented benchmarks."
      />
      <SolutionFinalCta solution={solution} />
      <RelatedSolutions solution={solution} />
      <SolutionBackLink />
    </SolutionPageChrome>
  );
}

function JourneyVisual({
  stages,
}: {
  stages: EcommerceGrowthSolutionPageContent["journeyStages"];
}) {
  return (
    <ol
      className="mt-10 flex flex-col lg:flex-row"
      aria-label="Commerce journey: Discover, Browse, Evaluate, Commit, Check out, Return"
    >
      {stages.map((stage, index) => (
        <li
          key={stage.title}
          className={cn(
            "flex flex-1 flex-col border-border",
            "border-t py-4 lg:border-t-0 lg:border-l lg:px-3 lg:py-0 lg:first:border-l-0 lg:first:pl-0",
          )}
        >
          <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-1 font-display text-base font-semibold tracking-tight sm:text-lg">
            {stage.title}
          </h3>
          <p className="mt-1 text-[0.875rem] leading-relaxed text-muted sm:text-[0.9375rem]">
            {stage.description}
          </p>
          {index < stages.length - 1 ? (
            <span className="mt-2 text-accent-text lg:mt-4" aria-hidden>
              <span className="lg:hidden">↓</span>
              <span className="hidden lg:inline">→</span>
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function DiscoveryVisual() {
  const steps = ["Shop", "Category", "Filter / Search", "Product", "Cart"];

  return (
    <div
      className="mt-10 overflow-hidden rounded-xl border border-border bg-surface"
      role="img"
      aria-label="Conceptual product discovery path: Shop, Category, Filter or Search, Product, then Cart. Abstract illustration only."
    >
      <div className="border-b border-border bg-surface-muted px-4 py-2.5">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-subtle">
          Conceptual discovery path
        </p>
      </div>
      <ol className="flex flex-col gap-0 p-4 sm:flex-row sm:items-stretch sm:p-5">
        {steps.map((step, index) => (
          <li
            key={step}
            className="flex flex-1 flex-col sm:items-center sm:text-center"
          >
            <div className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5 text-sm font-semibold text-foreground">
              {step}
            </div>
            {index < steps.length - 1 ? (
              <span
                className="py-2 text-accent-text sm:py-0 sm:pt-3"
                aria-hidden
              >
                <span className="sm:hidden">↓</span>
                <span className="hidden sm:inline">→</span>
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function FunnelVisual({
  stages,
}: {
  stages: EcommerceGrowthSolutionPageContent["funnelStages"];
}) {
  return (
    <div className="mt-12 max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
        Conceptual shopping funnel — no invented metrics
      </p>
      <ol
        className="mt-4 space-y-0"
        aria-label="Conceptual shopping funnel from product discovered to purchase completed"
      >
        {stages.map((stage, index) => (
          <li key={stage.title} className="flex flex-col">
            <div className="rounded-lg border border-border bg-surface px-4 py-3">
              <p className="font-display text-base font-semibold tracking-tight">
                {stage.title}
              </p>
              <p className="mt-1 text-[0.875rem] leading-relaxed text-muted">
                {stage.description}
              </p>
            </div>
            {index < stages.length - 1 ? (
              <span className="py-1.5 pl-4 text-accent-text" aria-hidden>
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function CommerceHeroVisual() {
  const stages = [
    "Discover",
    "Browse",
    "Compare",
    "Product",
    "Cart",
    "Checkout",
    "Purchase",
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
          Shopping journey
        </span>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2">
          {["Category", "Collection", "Search"].map((label) => (
            <div
              key={label}
              className="rounded-md border border-border bg-surface-muted/40 px-2 py-2 text-center text-[0.6875rem] font-semibold text-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-md border border-border bg-surface-muted/30 p-2"
            >
              <div className="aspect-[4/3] rounded bg-border/60" />
              <p className="mt-1.5 text-[0.625rem] font-semibold text-muted">
                Product
              </p>
            </div>
          ))}
        </div>
        <ol className="space-y-0">
          {stages.map((stage, index) => (
            <li key={stage} className="flex flex-col">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted/40 px-3 py-2">
                <span className="font-display text-xs font-semibold tabular-nums text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[0.8125rem] font-semibold text-foreground">
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
    </div>
  );
}
