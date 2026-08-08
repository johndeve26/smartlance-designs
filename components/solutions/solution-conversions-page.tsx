import Link from "next/link";
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
import type { ConversionsSolutionPageContent } from "@/data/solution-pages";
import type { Solution } from "@/types";
import { cn } from "@/lib/utils";

type ConversionsSolutionPageProps = {
  solution: Solution;
  content: ConversionsSolutionPageContent;
};

export function ConversionsSolutionPage({
  solution,
  content,
}: ConversionsSolutionPageProps) {
  const causes = solution.possibleCauses ?? [];
  const symptoms = solution.problemSymptoms ?? [];
  const reviewAreas = solution.whatWeReview ?? [];

  return (
    <SolutionPageChrome solution={solution}>
      <SolutionHero solution={solution} visual={<JourneyHeroVisual />} />

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Definition</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              What Counts as a Conversion?
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.conversionDefinition.intro}
            </p>
          </div>
          <ul className="mt-10 grid gap-0 border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {content.conversionDefinition.examples.map((example) => (
              <li
                key={example.context}
                className="border-b border-border py-5 sm:px-5 lg:border-r lg:[&:nth-child(3n)]:border-r-0"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                  {example.context}
                </p>
                <p className="mt-2 font-display text-lg font-semibold tracking-tight">
                  {example.action}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <DiagnosticFramework
        eyebrow="Conversion journey"
        title="Arrive → Understand → Trust → Evaluate → Decide → Act"
        description={content.journeyIntro}
        stages={content.journeyStages}
      />

      <Section className="!py-10 sm:!py-12">
        <Container>
          <div className="max-w-2xl border-l-2 border-accent pl-5 sm:pl-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {content.notJustTheButton.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.notJustTheButton.body}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {content.notJustTheButton.influences.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <ProblemContrast
        eyebrow="Useful distinction"
        title="Not Every Useful Action Is the Final Conversion."
        intro={content.microMacro.intro}
        left={content.microMacro.macro}
        right={content.microMacro.micro}
        tone="muted"
      />

      <NumberedCauseList
        eyebrow="Common causes"
        title="Why Visitors Don’t Complete the Next Step"
        description={content.causesIntro}
        causes={causes}
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.intentNote.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.intentNote.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground sm:text-base">
                {content.intentNote.mismatches.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-accent-text" aria-hidden>
                      ·
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.clarityNote.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.clarityNote.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground sm:text-base">
                {content.clarityNote.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="text-accent-text" aria-hidden>
                      ·
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-14 max-w-3xl border-t border-border pt-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {content.informationGaps.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.informationGaps.body}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {content.informationGaps.examples.map((example) => (
                <li
                  key={example}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {example}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
              {content.informationGaps.closing}
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-3 lg:gap-10">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.commitment.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.commitment.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.commitment.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
            <div className="border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.trust.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.trust.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.trust.signals.map((signal) => (
                  <li key={signal} className="flex gap-2">
                    <span className="text-accent-text" aria-hidden>
                      ·
                    </span>
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.decisionFriction.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.decisionFriction.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.decisionFriction.issues.map((issue) => (
                  <li key={issue} className="flex gap-2">
                    <span className="text-accent-text" aria-hidden>
                      ·
                    </span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border pt-10">
            <h3 className="font-display text-2xl font-semibold tracking-tight">
              {content.ctaHierarchy.title}
            </h3>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.ctaHierarchy.body}
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {content.ctaHierarchy.examples.map((example) => (
                <li
                  key={example.primary}
                  className="rounded-lg border border-border bg-surface px-5 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                    Primary
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold">
                    {example.primary}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                    Secondary
                  </p>
                  <p className="mt-1 text-[0.9375rem] font-semibold text-muted">
                    {example.secondary}
                  </p>
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
                {content.formFriction.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.formFriction.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.formFriction.points.map((point) => (
                  <li
                    key={point}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {point}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                Relevant across
              </p>
              <p className="mt-2 text-[0.9375rem] text-foreground">
                {content.formFriction.contexts.join(" · ")}
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.checkoutBooking.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.checkoutBooking.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground sm:text-base">
                {content.checkoutBooking.issues.map((issue) => (
                  <li key={issue} className="flex gap-2">
                    <span className="text-accent-text" aria-hidden>
                      ·
                    </span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 grid gap-10 border-t border-border pt-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.ecommerceNote.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.ecommerceNote.body}
              </p>
              <ol className="mt-5 flex flex-wrap items-center gap-2">
                {content.ecommerceNote.steps.map((step, index) => (
                  <li key={step} className="inline-flex items-center gap-2">
                    <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold">
                      {step}
                    </span>
                    {index < content.ecommerceNote.steps.length - 1 ? (
                      <span className="text-accent-text" aria-hidden>
                        →
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.performanceNote.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.performanceNote.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.performanceNote.factors.map((factor) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
              <Link
                href="/solutions/slow-website"
                className="mt-4 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Slow Website →
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Diagnostic lens</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.journeyBreak.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.journeyBreak.body}
            </p>
          </div>
          <JourneyBreakVisual stages={content.journeyBreak.stages} />
          <DecisionPathVisual content={content.decisionPath} />
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Measurement</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                {content.measurement.title}
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {content.measurement.body}
              </p>
              <SolutionServiceLink
                href="/services/analytics-conversion-tracking"
                slug={solution.slug}
                className="mt-5 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Analytics &amp; Conversion Tracking →
              </SolutionServiceLink>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-0">
              {content.measurement.events.map((event) => (
                <li
                  key={event}
                  className="border-b border-border py-3 text-[0.9375rem] font-semibold text-foreground"
                >
                  {event}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <ProblemContrast
        eyebrow="Important distinction"
        title="Analytics Is Not CRO"
        intro={content.analyticsVsCro.intro}
        left={content.analyticsVsCro.analytics}
        right={content.analyticsVsCro.cro}
        tone="muted"
      />

      <Section className="!py-10 sm:!py-12">
        <Container>
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {content.qualitative.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.qualitative.body}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {content.qualitative.inputs.map((input) => (
                <li
                  key={input}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {input}
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
              Approach
            </p>
            <h2 className="heading-section mt-3 font-display font-semibold text-white">
              {content.ethicalPrinciple.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-white/75 sm:text-[1.0625rem]">
              {content.ethicalPrinciple.body}
            </p>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
                Avoid
              </p>
              <ul className="mt-3 space-y-2 text-[0.9375rem] text-white/80">
                {content.ethicalPrinciple.avoid.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-300">
                Prefer
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {content.ethicalPrinciple.prefer.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-sm font-semibold text-orange-100"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <SymptomList
        eyebrow="Possible signals"
        title="Signs There May Be Conversion Friction"
        description="These are possible signals — not a diagnosis on their own. The cause still needs reviewing in context."
        symptoms={symptoms}
      />

      <ProblemContrast
        eyebrow="Diagnostic scope"
        title="Is One Page Underperforming — or Is the Whole Journey the Problem?"
        intro={content.pageVsJourney.intro}
        left={content.pageVsJourney.page}
        right={content.pageVsJourney.journey}
        tone="muted"
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {content.needCro.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.needCro.body}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {content.needCro.alternatives.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <DecisionSection
        eyebrow="Scope decisions"
        title="Does Low Conversion Mean You Need a Redesign?"
        intro="Not always. Scope depends on whether the friction is concentrated or site-wide."
        levels={content.redesignLevels}
      />

      <Section tone="muted" className="!py-8 sm:!py-10">
        <Container>
          <Link
            href="/solutions/outdated-website"
            className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
          >
            If conversion friction exists across an old or inconsistent website… Outdated Website →
          </Link>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Before recommending a fix</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                What We Look At Before Recommending a Conversion Fix
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
              Practical audit framework
            </p>
            <ol className="mt-6 flex flex-col">
              {content.auditFramework.map((step, index) => (
                <li key={step.title} className="flex flex-col">
                  <div className="flex items-start gap-4 border-t border-border py-5">
                    <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < content.auditFramework.length - 1 ? (
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

      <RecommendedServices
        solution={solution}
        description="Capabilities that may help once the journey friction is clearer — without prescribing CRO before diagnosis."
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

      <RelatedWork
        solution={solution}
        heading={content.relatedWorkHeading}
        description="Selected projects involving website structure, booking or enquiry journeys — without fabricated conversion lifts."
      />
      <RelatedInsights solution={solution} />

      <RelatedGuidance solution={solution} />
      <SolutionFaq
        solution={solution}
        title="Questions about low website conversions"
        description="Practical answers for when visitors arrive but important actions remain incomplete."
      />
      <SolutionFinalCta solution={solution} />
      <RelatedSolutions solution={solution} />
      <SolutionBackLink />
    </SolutionPageChrome>
  );
}

function JourneyHeroVisual() {
  const stages = [
    { label: "Arrive", friction: false },
    { label: "Understand", friction: true },
    { label: "Explore", friction: false },
    { label: "Decide", friction: true },
    { label: "Act", friction: true },
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
          User journey
        </span>
      </div>
      <ol className="space-y-0 p-4 sm:p-5">
        {stages.map((stage, index) => (
          <li key={stage.label} className="flex flex-col">
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3.5 py-2.5",
                stage.friction
                  ? "border-dashed border-accent/45 bg-accent/5"
                  : "border-border bg-surface-muted/50",
              )}
            >
              <span className="font-display text-xs font-semibold tabular-nums text-accent-text">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[0.9375rem] font-semibold text-foreground">
                {stage.label}
              </span>
              {stage.friction ? (
                <span className="ml-auto text-xs font-medium text-muted">
                  Friction
                </span>
              ) : null}
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

function JourneyBreakVisual({
  stages,
}: {
  stages: { label: string; status: string }[];
}) {
  return (
    <ol className="mt-10 flex flex-col gap-0 lg:flex-row lg:items-stretch">
      {stages.map((stage, index) => (
        <li
          key={stage.label}
          className="relative flex flex-1 flex-col border-t border-border py-5 lg:border-t-0 lg:border-l lg:px-4 lg:py-0 lg:first:border-l-0 lg:first:pl-0"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
            {stage.status}
          </span>
          <p className="mt-2 font-display text-lg font-semibold tracking-tight">
            {stage.label}
          </p>
          {index < stages.length - 1 ? (
            <span
              className="mt-3 text-accent-text lg:absolute lg:right-0 lg:top-6 lg:mt-0 lg:translate-x-1/2"
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

function DecisionPathVisual({
  content,
}: {
  content: ConversionsSolutionPageContent["decisionPath"];
}) {
  return (
    <div className="mt-14 border-t border-border pt-10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">
        {content.title}
      </p>
      <ol className="mt-6 flex flex-col">
        {content.steps.map((step, index) => (
          <li key={step.label} className="flex flex-col">
            <div className="flex flex-wrap items-center gap-3 border-t border-border py-4">
              <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-base font-semibold tracking-tight sm:text-lg">
                {step.label}
              </span>
              {step.friction ? (
                <span className="rounded-md border border-dashed border-accent/40 bg-accent/5 px-2.5 py-1 text-xs font-semibold text-muted">
                  {step.friction}
                </span>
              ) : null}
            </div>
            {index < content.steps.length - 1 ? (
              <span className="pl-8 text-accent-text" aria-hidden>
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
