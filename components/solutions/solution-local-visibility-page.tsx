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
import type { LocalVisibilitySolutionPageContent } from "@/data/solution-pages";
import type { Solution } from "@/types";
import { cn } from "@/lib/utils";

type LocalVisibilitySolutionPageProps = {
  solution: Solution;
  content: LocalVisibilitySolutionPageContent;
};

export function LocalVisibilitySolutionPage({
  solution,
  content,
}: LocalVisibilitySolutionPageProps) {
  const causes = solution.possibleCauses ?? [];
  const reviewAreas = solution.whatWeReview ?? [];
  const symptoms = solution.problemSymptoms ?? [];

  return (
    <SolutionPageChrome solution={solution}>
      <SolutionHero solution={solution} visual={<LocalHeroVisual />} />

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
          <div className="mt-10 grid gap-8 border-t border-border pt-8 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                Nearby customers may encounter you through
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {content.corePrinciple.surfaces.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                The experience should reinforce
              </p>
              <ul className="mt-3 space-y-2 text-[0.9375rem] font-semibold text-foreground">
                {content.corePrinciple.reinforce.map((item) => (
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
            <p className="eyebrow">Local journey</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Search → Discover → Verify → Visit → Contact
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
            <p className="eyebrow">Visibility system</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Relevance → Location → Trust → Experience → Action
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.visibilitySystem.intro}
            </p>
          </div>
          <ol className="mt-10 flex flex-col lg:flex-row">
            {content.visibilitySystem.stages.map((stage, index) => (
              <li
                key={stage.title}
                className="flex flex-1 flex-col border-t border-border py-4 lg:border-t-0 lg:border-l lg:px-3 lg:py-0 lg:first:border-l-0 lg:first:pl-0"
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
                {index < content.visibilitySystem.stages.length - 1 ? (
                  <span className="mt-2 text-accent-text lg:mt-3" aria-hidden>
                    <span className="lg:hidden">↓</span>
                    <span className="hidden lg:inline">→</span>
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">What local means</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Physical Location, Service Area, or Both?
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.whatLocalMeans.intro}
            </p>
          </div>
          <ul className="mt-10 grid gap-0 border-t border-border sm:grid-cols-3">
            {content.whatLocalMeans.models.map((model) => (
              <li
                key={model.title}
                className="border-b border-border py-5 sm:border-b-0 sm:border-r sm:px-4 sm:last:border-r-0 sm:first:pl-0"
              >
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  {model.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                  {model.description}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {model.examples.map((example) => (
                    <li
                      key={example}
                      className="rounded-md border border-border bg-surface-muted/50 px-2.5 py-1 text-sm font-semibold"
                    >
                      {example}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <div className="mt-12 max-w-2xl border-t border-border pt-10">
            <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {content.searchPatterns.title}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.searchPatterns.body}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {content.searchPatterns.patterns.map((pattern) => (
                <li
                  key={pattern}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {pattern}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <NumberedCauseList
        eyebrow="Common reasons"
        title="Why Nearby Customers May Not Be Finding You"
        description="These are common starting points — not a complete list of local ranking factors."
        causes={causes}
      />

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Google Business Profile</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.gbp.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.gbp.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.gbp.areas.map((area) => (
                <li
                  key={area}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                >
                  {area}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 grid gap-10 border-t border-border pt-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {content.profileAccuracy.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {content.profileAccuracy.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-muted">
                {content.profileAccuracy.avoid.map((item) => (
                  <li key={item}>Avoid: {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                Practices to avoid
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.gbp.avoid.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-muted"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <EcosystemVisual labels={content.ecosystemLabels} />
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Website location clarity</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.websiteLocation.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.websiteLocation.body}
            </p>
            <ul className="mt-5 space-y-2 text-[0.9375rem] font-semibold text-foreground">
              {content.websiteLocation.shouldUnderstand.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.websiteLocation.closing}
            </p>
          </div>

          <div className="mt-12 grid gap-10 border-t border-border pt-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.serviceLocation.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.serviceLocation.body}
              </p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                Prefer
              </p>
              <p className="mt-2 text-[0.9375rem] text-foreground">
                {content.serviceLocation.good}
              </p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                Avoid
              </p>
              <p className="mt-2 text-[0.9375rem] text-muted">
                {content.serviceLocation.bad}
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.serviceArea.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.serviceArea.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.serviceArea.useful.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.serviceArea.closing}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="dark" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
              Location pages
            </p>
            <h2 className="heading-section mt-3 font-display font-semibold text-white">
              {content.thinPages.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-white/75 sm:text-[1.0625rem]">
              {content.thinPages.body}
            </p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
              A location page may make sense when
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {content.thinPages.whenUseful.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-sm font-semibold text-orange-100"
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
                {content.consistency.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.consistency.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.consistency.places.map((place) => (
                  <li
                    key={place}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                  >
                    {place}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.consistency.closing}
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.reviews.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.reviews.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.reviews.helpWith.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                Do not
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {content.reviews.avoid.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-muted"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.reviews.requests}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <h2 className="heading-section font-display font-semibold">
              {content.foundFirstStep.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.foundFirstStep.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.foundFirstStep.lookFor.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-5">
              <SolutionServiceLink
                href="/solutions/website-not-generating-leads"
                slug={solution.slug}
                className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Website Not Generating Leads →
              </SolutionServiceLink>
            </div>
          </div>

          <div className="mt-12 grid gap-10 border-t border-border pt-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.contactActions.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.contactActions.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.contactActions.actions.map((action) => (
                  <li
                    key={action}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.06em]"
                  >
                    {action}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.mobile.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.mobile.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.mobile.behaviours.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                Useful mobile actions
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {content.mobile.usefulActions.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.mobile.closing}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Local SEO + website SEO</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.localPlusWebsiteSeo.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.localPlusWebsiteSeo.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.localPlusWebsiteSeo.foundations.map((item) => (
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
                href="/seo/local-seo"
                slug={solution.slug}
                className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Local SEO →
              </SolutionServiceLink>
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

          <div className="mt-12 grid gap-10 border-t border-border pt-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {content.schema.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {content.schema.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.schema.canHelp.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.schema.closing}
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {content.localContent.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {content.localContent.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.localContent.useful.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-muted">
                {content.localContent.avoid.map((item) => (
                  <li key={item}>Avoid: {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <ProblemContrast
        eyebrow="Locations"
        title="Physical Locations vs Service Areas"
        intro={content.locationVsServiceArea.intro}
        left={content.locationVsServiceArea.physical}
        right={content.locationVsServiceArea.serviceArea}
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.multipleLocations.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.multipleLocations.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.multipleLocations.mayNeed.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.multipleLocations.closing}
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.competitors.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.competitors.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.competitors.reasons.map((reason) => (
                  <li
                    key={reason}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {reason}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.competitors.closing}
              </p>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.proximity.body}
              </p>
            </div>
          </div>

          <div className="mt-12 max-w-2xl border-t border-border pt-10">
            <h3 className="font-display text-xl font-semibold tracking-tight">
              {content.proof.title}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
              {content.proof.body}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {content.proof.examples.map((item) => (
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
        eyebrow="Two kinds of visibility"
        title="Local Presence and Organic Website Visibility"
        intro={content.localVsOrganic.intro}
        left={content.localVsOrganic.local}
        right={content.localVsOrganic.organic}
        tone="muted"
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <h2 className="heading-section font-display font-semibold">
              {content.measurement.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.measurement.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.measurement.metrics.map((metric) => (
                <li
                  key={metric}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {metric}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.measurement.closing}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:gap-5">
              <SolutionServiceLink
                href="/services/analytics-conversion-tracking"
                slug={solution.slug}
                className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Analytics & Conversion Tracking →
              </SolutionServiceLink>
              <SolutionServiceLink
                href="/solutions/slow-website"
                slug={solution.slug}
                className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Slow Website →
              </SolutionServiceLink>
            </div>
          </div>
        </Container>
      </Section>

      <SymptomList
        eyebrow="Possible indicators"
        title="Signs Nearby Customers May Be Struggling to Find You"
        description="These are indicators — not a complete diagnosis. Local visibility still needs reviewing in context."
        symptoms={symptoms}
      />

      <ProblemContrast
        eyebrow="Diagnostic distinction"
        title="Profile Problem, Website Problem — or Both?"
        intro={content.profileVsWebsite.intro}
        left={content.profileVsWebsite.profile}
        right={content.profileVsWebsite.website}
        tone="muted"
      />

      <Section className="!py-8 sm:!py-10">
        <Container>
          <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">
            {content.profileVsWebsite.both}
          </p>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <h2 className="heading-section font-display font-semibold">
              {content.needLocalSeo.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.needLocalSeo.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.needLocalSeo.depends.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-14 border-t border-border pt-12">
            <p className="eyebrow">Diagnostic framework</p>
            <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              Find → Verify → Understand → Confirm → Contact
            </h3>
            <ol
              className="mt-8 flex flex-col lg:flex-row"
              aria-label="Diagnostic framework: Can they find you, verify you, understand what you offer, confirm you serve them, and contact visit or book"
            >
              {content.diagnosticFramework.map((stage, index) => (
                <li
                  key={stage.title}
                  className="flex flex-1 flex-col border-t border-border py-4 lg:border-t-0 lg:border-l lg:px-3 lg:py-0 lg:first:border-l-0 lg:first:pl-0"
                >
                  <span className="font-display text-sm font-semibold uppercase tracking-[0.06em] text-accent-text">
                    {stage.title}
                  </span>
                  <p className="mt-2 text-[0.875rem] leading-relaxed text-muted sm:text-[0.9375rem]">
                    {stage.description}
                  </p>
                  {index < content.diagnosticFramework.length - 1 ? (
                    <span className="mt-2 text-accent-text lg:mt-3" aria-hidden>
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

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Before recommending a fix</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                What We Look At Before Recommending a Local Visibility Fix
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

      <DecisionSection
        eyebrow="Scope"
        title="Do You Need a New Website?"
        intro="Not automatically. Start with the smallest intervention that addresses the real limitation."
        levels={content.redesignLevels}
      />

      <RecommendedServices
        solution={solution}
        description="Capabilities that may help once it is clearer whether the main issue is local presence, the website, or both — without promising map rankings."
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
          <div className="mt-8 border-t border-border pt-8">
            <p className="text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.industriesNote}
            </p>
            <Link
              href="/industries"
              className="mt-3 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
            >
              Explore Industries →
            </Link>
          </div>
        </Container>
      </Section>

      <RelatedWork
        solution={solution}
        heading={content.relatedWorkHeading}
        description="Selected hospitality, property and service websites — without fabricated local ranking, map-pack or call claims."
      />
      <RelatedInsights solution={solution} />

      <RelatedGuidance solution={solution} />
      <SolutionFaq
        solution={solution}
        title="Questions about local business visibility"
        description="Practical answers for businesses that need nearby customers to find, verify and contact them — without ranking guarantees or thin city pages."
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
  stages: LocalVisibilitySolutionPageContent["journeyStages"];
}) {
  return (
    <ol
      className="mt-10 flex flex-col lg:flex-row"
      aria-label="Local journey: Search, Discover, Verify, Visit, Contact"
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

function EcosystemVisual({ labels }: { labels: string[] }) {
  return (
    <div
      className="mt-12 overflow-hidden rounded-xl border border-border bg-surface"
      role="img"
      aria-label="Conceptual local ecosystem: Search connected with business profile, website, reviews and business information, leading to customer action. Abstract illustration only."
    >
      <div className="border-b border-border bg-surface-muted px-4 py-2.5">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-subtle">
          Conceptual local ecosystem
        </p>
      </div>
      <ol className="space-y-0 p-4 sm:p-5">
        {labels.map((label, index) => (
          <li key={label} className="flex flex-col">
            <div className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5 text-sm font-semibold text-foreground">
              {label}
            </div>
            {index < labels.length - 1 ? (
              <span className="py-1.5 pl-4 text-accent-text" aria-hidden>
                {index < labels.length - 2 ? "↕" : "↓"}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function LocalHeroVisual() {
  const stages = [
    "Customer search",
    "Local results",
    "Business profile",
    "Website",
    "Service / location info",
    "Call / directions / enquiry",
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
          Local discovery
        </span>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="relative overflow-hidden rounded-lg border border-border bg-surface-muted/40 p-4">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute left-3 top-3 h-16 w-16 rounded-full border border-border" />
            <div className="absolute right-6 top-8 h-24 w-24 rounded-full border border-border" />
            <div className="absolute bottom-2 left-1/3 h-20 w-20 rounded-full border border-border" />
          </div>
          <div className="relative flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-xs font-semibold text-accent-text">
              ●
            </span>
            <div className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-[0.75rem] font-semibold text-muted">
              Service near me
            </div>
          </div>
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
