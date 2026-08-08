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
} from "@/components/solutions/solution-primitives";
import type { OutdatedSolutionPageContent } from "@/data/solution-pages";
import type { Solution } from "@/types";
import { cn } from "@/lib/utils";

type OutdatedSolutionPageProps = {
  solution: Solution;
  content: OutdatedSolutionPageContent;
};

export function OutdatedSolutionPage({
  solution,
  content,
}: OutdatedSolutionPageProps) {
  const causes = solution.possibleCauses ?? [];
  const reviewAreas = solution.whatWeReview ?? [];

  return (
    <SolutionPageChrome solution={solution}>
      <SolutionHero solution={solution} visual={<EvolutionHeroVisual />} />

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">The real problem</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Outdated Doesn’t Just Mean Old-Fashioned.
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.notJustFashion.intro}
            </p>
          </div>
          <ul className="mt-10 grid gap-0 border-t border-border sm:grid-cols-2">
            {content.notJustFashion.reasons.map((reason, index) => (
              <li
                key={reason}
                className={cn(
                  "border-b border-border py-4 text-[0.9375rem] leading-relaxed text-foreground sm:px-5 sm:text-base",
                  index % 2 === 0 && "sm:border-r sm:pl-0",
                )}
              >
                {reason}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14 lg:!py-16">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Ways a website becomes outdated</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Outdated in Different Ways
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.dimensionsIntro}
            </p>
          </div>
          <ol className="mt-10 grid gap-0 border-t border-border sm:grid-cols-2 lg:grid-cols-4">
            {content.dimensions.map((dimension, index) => (
              <li
                key={dimension.title}
                className="border-b border-border py-5 sm:px-4 lg:border-r lg:[&:nth-child(4n)]:border-r-0"
              >
                <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold tracking-tight sm:text-xl">
                  {dimension.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                  {dimension.description}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.structureNote.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.structureNote.body}
              </p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                Often added over time
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {content.structureNote.additions.map((item) => (
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
                What users eventually face
              </p>
              <ul className="mt-4 border-t border-border">
                {content.structureNote.outcomes.map((item) => (
                  <li
                    key={item}
                    className="border-b border-border py-3 text-[0.9375rem] font-semibold text-foreground sm:text-base"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-14 grid gap-10 border-t border-border pt-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {content.brandNote.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.brandNote.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.brandNote.points.map((point) => (
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
                {content.contentNote.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.contentNote.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.contentNote.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="text-accent-text" aria-hidden>
                      ·
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.contentNote.closing}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <ProblemContrast
        eyebrow="Diagnostic contrast"
        title="Looks Old vs Works Old"
        intro={content.looksVsWorks.intro}
        left={content.looksVsWorks.looks}
        right={content.looksVsWorks.works}
        tone="default"
      />

      <Section tone="dark" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
              Accumulated complexity
            </p>
            <h2 className="heading-section mt-3 font-display font-semibold text-white">
              {content.websiteDebt.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-white/75 sm:text-[1.0625rem]">
              {content.websiteDebt.body}
            </p>
          </div>
          <WebsiteDebtVisual
            sequence={content.websiteDebt.sequence}
            resolve={content.websiteDebt.resolve}
          />
          <ul className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {content.websiteDebt.items.map((item) => (
              <li
                key={item}
                className="border border-white/12 bg-white/[0.04] px-4 py-3 text-[0.9375rem] text-white"
              >
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <NumberedCauseList
        eyebrow="Indicators"
        title="Signs Your Business May Have Outgrown Its Website"
        description="These are possible indicators — not proof on their own. The right response still depends on what is actually holding the site back."
        causes={causes}
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.visualAge.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.visualAge.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.visualAge.signs.map((sign) => (
                  <li
                    key={sign}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {sign}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.visualAge.closing}
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.mobileNote.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.mobileNote.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground sm:text-base">
                {content.mobileNote.issues.map((issue) => (
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

          <div className="mt-14 max-w-3xl border-t border-border pt-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {content.credibility.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.credibility.body}
            </p>
            <ul className="mt-5 space-y-2 text-[0.9375rem] text-foreground sm:text-base">
              {content.credibility.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Before changing the site</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                {content.inventory.title}
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {content.inventory.body}
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <SolutionServiceLink
                  href="/services/website-strategy"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Website Strategy →
                </SolutionServiceLink>
                <SolutionServiceLink
                  href="/services/website-migration"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Website Migration →
                </SolutionServiceLink>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-0">
              {content.inventory.items.map((item, index) => (
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
          </div>

          <div className="mt-14 max-w-3xl border-t border-border pt-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {content.seoProtect.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.seoProtect.body}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {content.seoProtect.risks.map((risk) => (
                <li
                  key={risk}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                >
                  {risk}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:gap-5">
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
        </Container>
      </Section>

      <DecisionSection
        eyebrow="Scope decisions"
        title="Refresh, Redesign or Rebuild?"
        intro="Different websites need different levels of intervention. Rebuild is not automatically better — it is appropriate when the foundation itself is limiting progress."
        levels={content.refreshLevels}
      />

      <Section className="!py-10 sm:!py-12">
        <Container>
          <RefreshSpectrum />
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {content.whenNotRedesign.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.whenNotRedesign.body}
            </p>
            <ul className="mt-5 space-y-2 text-[0.9375rem] text-foreground sm:text-base">
              {content.whenNotRedesign.examples.map((example) => (
                <li key={example} className="flex gap-2">
                  <span className="text-accent-text" aria-hidden>
                    ·
                  </span>
                  {example}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:gap-5">
              <Link
                href="/solutions/website-not-ranking"
                className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Website Not Ranking →
              </Link>
              <Link
                href="/solutions/slow-website"
                className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Slow Website →
              </Link>
              <Link
                href="/solutions/website-not-generating-leads"
                className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Website Not Generating Leads →
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Before recommending change</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                What We Look At Before Recommending a Redesign
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

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Business evolution</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.businessEvolution.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.businessEvolution.body}
            </p>
          </div>
          <BusinessEvolutionVisual
            thenLabels={content.businessEvolution.thenLabels}
            nowLabels={content.businessEvolution.nowLabels}
          />
          <ul className="mt-8 flex flex-wrap gap-2">
            {content.businessEvolution.changes.map((change) => (
              <li
                key={change}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
              >
                {change}
              </li>
            ))}
          </ul>

          <div className="mt-14 grid gap-10 border-t border-border pt-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {content.platformQuestion.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.platformQuestion.body}
              </p>
              <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                {content.platformQuestion.factors.map((factor) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-2">
                <SolutionServiceLink
                  href="/platforms"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Explore Platforms →
                </SolutionServiceLink>
                <SolutionServiceLink
                  href="/services/website-migration"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Website Migration →
                </SolutionServiceLink>
              </div>
            </div>
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {content.competitors.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.competitors.body}
              </p>
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                    Useful reference for
                  </p>
                  <ul className="mt-2 space-y-1 text-[0.9375rem] text-foreground">
                    {content.competitors.usefulFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                    Focus on your own
                  </p>
                  <ul className="mt-2 space-y-1 text-[0.9375rem] text-foreground">
                    {content.competitors.focusOn.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl border-l-2 border-accent pl-5 sm:pl-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {content.messagingNote.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.messagingNote.body}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {content.messagingNote.topics.map((topic) => (
                <li
                  key={topic}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {topic}
                </li>
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

          <div className="mt-12 grid gap-8 border-t border-border pt-10 lg:grid-cols-3">
            <RelatedProblemNote
              body={content.relatedProblemNotes.leads}
              href="/solutions/website-not-generating-leads"
              label="Website Not Generating Leads →"
            />
            <RelatedProblemNote
              body={content.relatedProblemNotes.performance}
              href="/solutions/slow-website"
              label="Slow Website →"
            />
            <RelatedProblemNote
              body={content.relatedProblemNotes.ranking}
              href="/solutions/website-not-ranking"
              label="Website Not Ranking →"
            />
          </div>
        </Container>
      </Section>

      <RecommendedServices
        solution={solution}
        description="Capabilities that may help once it is clearer whether the site needs a refresh, redesign or rebuild."
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
        description="Selected projects with verified redesign or website rebuild context — without fabricated before/after claims."
      />
      <RelatedInsights solution={solution} />

      <RelatedGuidance solution={solution} />
      <SolutionFaq
        solution={solution}
        title="Questions about outdated websites"
        description="Practical answers for when the business has changed and the website has not kept up."
      />
      <SolutionFinalCta solution={solution} />
      <RelatedSolutions solution={solution} />
      <SolutionBackLink />
    </SolutionPageChrome>
  );
}

function RelatedProblemNote({
  body,
  href,
  label,
}: {
  body: string;
  href: string;
  label: string;
}) {
  return (
    <div className="border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 lg:first:border-l-0 lg:first:pl-0">
      <p className="text-[0.9375rem] leading-relaxed text-muted">{body}</p>
      <Link
        href={href}
        className="mt-3 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
      >
        {label}
      </Link>
    </div>
  );
}

function EvolutionHeroVisual() {
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
          Then → Now
        </span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-border">
        <div className="p-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
            Then
          </p>
          <div className="mt-3 space-y-2">
            <div className="h-2 w-3/4 rounded-full bg-border" />
            <div className="h-2 w-1/2 rounded-full bg-border/70" />
            <div className="mt-3 space-y-1.5">
              <div className="h-6 rounded border border-border bg-surface-muted/60" />
              <div className="h-6 rounded border border-border bg-surface-muted/40" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
            Now
          </p>
          <div className="mt-3 space-y-2">
            <div className="h-2 w-4/5 rounded-full bg-accent/40" />
            <div className="h-2 w-3/5 rounded-full bg-accent/25" />
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <div className="h-8 rounded border border-accent/30 bg-accent/10" />
              <div className="h-8 rounded border border-accent/30 bg-accent/10" />
              <div className="h-8 rounded border border-dashed border-border bg-surface-muted/40" />
              <div className="h-8 rounded border border-dashed border-border bg-surface-muted/40" />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">
          Business grew · Website structure stayed
        </p>
        <p className="mt-1 text-xs text-muted">
          Added pages · Inconsistent components · Old messaging
        </p>
      </div>
    </div>
  );
}

function WebsiteDebtVisual({
  sequence,
  resolve,
}: {
  sequence: string[];
  resolve: string[];
}) {
  return (
    <div className="mt-8">
      <ol className="flex flex-col gap-0 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-2 lg:gap-y-3">
        {sequence.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            <span className="rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white">
              {step}
            </span>
            {index < sequence.length - 1 ? (
              <span className="text-orange-300" aria-hidden>
                <span className="lg:hidden">↓</span>
                <span className="hidden lg:inline">→</span>
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {resolve.map((step, index) => (
          <span key={step} className="inline-flex items-center gap-2">
            <span className="rounded-md border border-orange-300/40 bg-orange-300/10 px-3 py-2 text-sm font-semibold text-orange-200">
              {step}
            </span>
            {index < resolve.length - 1 ? (
              <span className="text-orange-300" aria-hidden>
                →
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}

function RefreshSpectrum() {
  const levels = [
    { label: "Refresh", scope: "Targeted" },
    { label: "Redesign", scope: "Structural" },
    { label: "Rebuild", scope: "Foundational" },
  ];

  return (
    <div className="border-t border-border pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">
        Increasing scope
      </p>
      <ol className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-0">
        {levels.map((level, index) => (
          <li
            key={level.label}
            className="relative flex flex-1 flex-col border border-border bg-surface px-5 py-5 lg:rounded-none lg:border-l-0 lg:first:border-l lg:first:rounded-l-lg lg:last:rounded-r-lg"
          >
            <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="mt-2 font-display text-xl font-semibold tracking-tight">
              {level.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-muted">{level.scope}</p>
            {index < levels.length - 1 ? (
              <span
                className="mt-3 text-accent-text lg:absolute lg:right-0 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2 lg:translate-x-1/2 lg:bg-background lg:px-1"
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
  );
}

function BusinessEvolutionVisual({
  thenLabels,
  nowLabels,
}: {
  thenLabels: string[];
  nowLabels: string[];
}) {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
          Business then
        </p>
        <ul className="mt-4 space-y-2">
          {thenLabels.map((label) => (
            <li
              key={label}
              className="rounded-md border border-border bg-surface-muted/50 px-3 py-2 text-sm font-semibold"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-center text-accent-text" aria-hidden>
        <span className="md:hidden">↓</span>
        <span className="hidden md:inline">→</span>
      </div>
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
          Business now
        </p>
        <ul className="mt-4 space-y-2">
          {nowLabels.map((label) => (
            <li
              key={label}
              className="rounded-md border border-accent/25 bg-surface px-3 py-2 text-sm font-semibold"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-3">
        <div className="rounded-lg border border-dashed border-border px-5 py-4">
          <p className="text-sm font-semibold text-foreground">
            Website still structured around the older business
          </p>
        </div>
      </div>
    </div>
  );
}
