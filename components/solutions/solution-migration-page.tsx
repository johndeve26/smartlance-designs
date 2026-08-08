import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  SolutionCtaLink,
  SolutionServiceLink,
} from "@/components/solutions/solution-cta-link";
import {
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
import type { MigrationSolutionPageContent } from "@/data/solution-pages";
import type { Solution } from "@/types";
import { cn } from "@/lib/utils";

type MigrationSolutionPageProps = {
  solution: Solution;
  content: MigrationSolutionPageContent;
};

export function MigrationSolutionPage({
  solution,
  content,
}: MigrationSolutionPageProps) {
  const causes = solution.possibleCauses ?? [];
  const reviewAreas = solution.whatWeReview ?? [];
  const symptoms = solution.problemSymptoms ?? [];

  return (
    <SolutionPageChrome solution={solution}>
      <SolutionHero solution={solution} visual={<MigrationHeroVisual />} />

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Core principle</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.systemsIntro.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.systemsIntro.body}
            </p>
          </div>
          <ul className="mt-10 flex flex-wrap gap-2">
            {content.systemsIntro.assets.map((asset) => (
              <li
                key={asset}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
              >
                {asset}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14 lg:!py-16">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Migration lifecycle</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Inventory → Map → Build → Migrate → Validate → Launch → Monitor
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.lifecycleIntro}
            </p>
          </div>
          <LifecycleVisual stages={content.lifecycleStages} />
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Migration scenarios</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Not Every Website Migration Is the Same.
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.migrationTypes.intro}
            </p>
          </div>
          <ul className="mt-10 grid gap-0 border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {content.migrationTypes.types.map((type) => (
              <li
                key={type.title}
                className="border-b border-border py-5 sm:px-4 lg:border-r lg:[&:nth-child(3n)]:border-r-0"
              >
                <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                  {type.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                  {type.description}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <ProblemContrast
        eyebrow="Strategic decision"
        title="Do You Actually Need to Change Platforms?"
        intro={content.shouldMigrate.intro}
        left={content.shouldMigrate.yes}
        right={content.shouldMigrate.no}
      />

      <NumberedCauseList
        eyebrow="Why businesses consider a move"
        title="Common Reasons Migration Comes Up"
        description="These are starting points for conversation — not automatic reasons to migrate."
        causes={causes}
      />

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Risk model</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              What Can Be Affected During a Migration
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.riskModel.intro}
            </p>
          </div>
          <div className="mt-10 grid gap-0 border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {content.riskModel.categories.map((category) => (
              <div
                key={category.title}
                className="border-b border-border py-5 sm:px-4 lg:border-r lg:[&:nth-child(3n)]:border-r-0"
              >
                <h3 className="font-display text-base font-semibold uppercase tracking-[0.08em] text-accent-text">
                  {category.title}
                </h3>
                <ul className="mt-3 space-y-1.5 text-[0.9375rem] text-foreground">
                  {category.areas.map((area) => (
                    <li key={area}>{area}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">URLs</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.urlsCritical.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.urlsCritical.body}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {content.urlsCritical.reasons.map((reason) => (
                <li
                  key={reason}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {reason}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.urlsCritical.closing}
            </p>
          </div>

          <div className="mt-12 max-w-3xl">
            <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {content.redirectMapping.title}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.redirectMapping.body}
            </p>
            <ul className="mt-6 space-y-4">
              {content.redirectMapping.examples.map((example) => (
                <li
                  key={`${example.from}-${example.to}`}
                  className="border-t border-border pt-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                    {example.note}
                  </p>
                  <p className="mt-2 font-mono text-sm text-foreground">
                    <span className="text-muted">{example.from}</span>
                    <span className="mx-2 text-accent-text" aria-hidden>
                      →
                    </span>
                    <span>{example.to}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <UrlMapVisual
            old={content.urlMapVisual.old}
            decisions={content.urlMapVisual.decisions}
            next={content.urlMapVisual.next}
          />
        </Container>
      </Section>

      <Section tone="dark" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
              Callout
            </p>
            <h2 className="heading-section mt-3 font-display font-semibold text-white">
              {content.homepageDump.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-white/75 sm:text-[1.0625rem]">
              {content.homepageDump.body}
            </p>
            <ul className="mt-6 space-y-2 text-[0.9375rem] text-white/85">
              {content.homepageDump.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Content inventory</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                {content.contentInventory.title}
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {content.contentInventory.body}
              </p>
              <p className="mt-4 text-[0.9375rem] font-semibold text-foreground">
                {content.contentInventory.closing}
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-x-6">
              {content.contentInventory.items.map((item, index) => (
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

          <div className="mt-14 border-t border-border pt-12">
            <div className="max-w-2xl">
              <p className="eyebrow">Content decisions</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                Keep / Improve / Merge / Remove / Redirect
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {content.contentDecisions.intro}
              </p>
            </div>
            <ul className="mt-10 grid gap-0 border-t border-border sm:grid-cols-2 lg:grid-cols-5">
              {content.contentDecisions.decisions.map((decision) => (
                <li
                  key={decision.title}
                  className="border-b border-border py-5 sm:px-3 lg:border-r lg:[&:nth-child(5n)]:border-r-0"
                >
                  <p className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-accent-text">
                    {decision.title}
                  </p>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                    {decision.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">SEO during migration</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.seoMigration.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.seoMigration.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.seoMigration.areas.map((area) => (
                <li
                  key={area}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {area}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-5">
              <SolutionServiceLink
                href="/seo/technical-seo"
                slug={solution.slug}
                className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Technical SEO →
              </SolutionServiceLink>
              <SolutionServiceLink
                href="/seo/seo-audit"
                slug={solution.slug}
                className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                SEO Audit →
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

          <div className="mt-12 max-w-2xl border-l-2 border-accent pl-5 sm:pl-6">
            <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {content.noGuarantee.title}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {content.noGuarantee.body}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
              The goal is to reduce unnecessary risk by
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {content.noGuarantee.goals.map((goal) => (
                <li
                  key={goal}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                >
                  {goal}
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
                {content.analytics.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.analytics.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.analytics.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <SolutionServiceLink
                href="/services/analytics-conversion-tracking"
                slug={solution.slug}
                className="mt-5 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Analytics & Conversion Tracking →
              </SolutionServiceLink>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.integrations.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.integrations.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.integrations.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.ecommerce.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.ecommerce.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {content.ecommerce.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                {content.ecommerce.closing}
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {content.cmsExperience.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.cmsExperience.body}
              </p>
              <ul className="mt-5 space-y-2 text-[0.9375rem] text-foreground">
                {content.cmsExperience.considerations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-14 grid gap-10 border-t border-border pt-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.designPlusMigration.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.designPlusMigration.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.designPlusMigration.movingParts.map((part) => (
                  <li
                    key={part}
                    className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                  >
                    {part}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:gap-5">
                <SolutionServiceLink
                  href="/services/website-redesign"
                  slug={solution.slug}
                  className="text-[0.9375rem] font-semibold text-accent-text hover:underline"
                >
                  Website Redesign →
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
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.domainMigration.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.domainMigration.body}
              </p>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-foreground">
                {content.domainMigration.considerations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="eyebrow">Pre-launch</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                {content.preLaunch.title}
              </h2>
              <ol className="mt-6 columns-1 gap-x-10 sm:columns-2">
                {content.preLaunch.items.map((item, index) => (
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
              <p className="eyebrow">Launch day</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                {content.launchDay.title}
              </h2>
              <ol className="mt-6 space-y-3">
                {content.launchDay.steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 text-[0.9375rem] text-foreground"
                  >
                    <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">After launch</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.postLaunch.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.postLaunch.body}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.postLaunch.monitor.map((item) => (
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

      <SymptomList
        eyebrow="Possible indicators"
        title="Signs Something May Have Gone Wrong After a Migration"
        description="These are indicators — not a complete diagnosis. Issues still need reviewing in context."
        symptoms={symptoms}
      />

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <h2 className="heading-section font-display font-semibold">
              {content.recovery.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.recovery.body}
            </p>
            <ul className="mt-6 space-y-2 text-[0.9375rem] text-foreground">
              {content.recovery.investigate.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Before recommending a plan</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                What We Review Before Recommending a Migration Plan
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

      <ProblemContrast
        eyebrow="Decision"
        title="Migrate vs Improve in Place"
        intro={content.migrateVsImprove.intro}
        left={content.migrateVsImprove.migrate}
        right={content.migrateVsImprove.improve}
        tone="muted"
      />

      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Platforms</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {content.platformNote.title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.platformNote.body}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {content.platformNote.factors.map((factor) => (
                <li
                  key={factor}
                  className="rounded-md border border-border bg-surface-muted/50 px-3 py-1.5 text-sm font-semibold"
                >
                  {factor}
                </li>
              ))}
            </ul>
            <ul className="mt-6 flex flex-wrap gap-2">
              {content.platformNote.platforms.map((platform) => (
                <li
                  key={platform}
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
                >
                  {platform}
                </li>
              ))}
            </ul>
            <Link
              href="/platforms"
              className="mt-5 inline-block text-[0.9375rem] font-semibold text-accent-text hover:underline"
            >
              Explore Platforms →
            </Link>
          </div>
        </Container>
      </Section>

      <RecommendedServices
        solution={solution}
        description="Capabilities that may help once it is clearer whether migration, improvement in place, or a combined redesign is the safer path."
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
        description="Selected rebuild and website projects — without fabricated migration outcomes or unverified platform-move claims."
      />
      <RelatedInsights solution={solution} />

      <RelatedGuidance solution={solution} />
      <SolutionFaq
        solution={solution}
        title="Questions about website migration"
        description="Practical answers for planning a move, rebuild or platform change without unnecessary risk."
      />
      <SolutionFinalCta solution={solution} />
      <RelatedSolutions solution={solution} />
      <SolutionBackLink />
    </SolutionPageChrome>
  );
}

function LifecycleVisual({
  stages,
}: {
  stages: MigrationSolutionPageContent["lifecycleStages"];
}) {
  return (
    <ol
      className="mt-10 flex flex-col gap-0 lg:flex-row lg:items-stretch lg:gap-0"
      aria-label="Migration lifecycle: Inventory, Map, Build, Migrate, Validate, Launch, Monitor"
    >
      {stages.map((stage, index) => (
        <li
          key={stage.title}
          className={cn(
            "flex flex-1 flex-col border-border",
            "border-t py-4 lg:border-t-0 lg:border-l lg:px-3 lg:py-0 lg:first:border-l-0 lg:first:pl-0",
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
              className="mt-2 pl-8 text-accent-text lg:mt-4 lg:pl-0 lg:text-center"
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

function UrlMapVisual({
  old,
  decisions,
  next,
}: {
  old: string[];
  decisions: string[];
  next: string[];
}) {
  return (
    <div
      className="mt-12 overflow-hidden rounded-xl border border-border bg-surface"
      role="img"
      aria-label="Conceptual URL mapping example: old paths mapped with Keep, Keep, Merge and Redirect decisions to new destinations. Illustrative only."
    >
      <div className="border-b border-border bg-surface-muted px-4 py-2.5">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-subtle">
          Conceptual URL mapping — illustrative paths only
        </p>
      </div>
      <div className="grid gap-0 lg:grid-cols-3">
        <div className="border-b border-border p-4 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
            Old website
          </p>
          <ul className="mt-3 space-y-2 font-mono text-sm text-foreground">
            {old.map((path) => (
              <li key={path} className="truncate">
                {path}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-b border-border p-4 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
            Mapping
          </p>
          <ul className="mt-3 space-y-2">
            {decisions.map((decision, index) => (
              <li
                key={`${decision}-${index}`}
                className="text-sm font-semibold uppercase tracking-[0.08em] text-accent-text"
              >
                {decision}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
            New website
          </p>
          <ul className="mt-3 space-y-2 font-mono text-sm text-foreground">
            {next.map((path) => (
              <li key={path} className="truncate">
                {path}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MigrationHeroVisual() {
  const assets = [
    "URLs",
    "Content",
    "SEO",
    "Analytics",
    "Forms",
    "Integrations",
    "Media",
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
          Migration map
        </span>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-subtle">
            Current website
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {assets.map((asset) => (
              <li
                key={asset}
                className="rounded-md border border-border bg-surface px-2 py-1.5 text-center text-[0.75rem] font-semibold text-foreground"
              >
                {asset}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center gap-1 text-accent-text">
          <span aria-hidden>↓</span>
          <p className="rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-accent-text">
            Migration plan
          </p>
          <span aria-hidden>↓</span>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-subtle">
            New website
          </p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
            Protected URLs, content, SEO, tracking and integrations — validated
            before launch.
          </p>
        </div>
      </div>
    </div>
  );
}
