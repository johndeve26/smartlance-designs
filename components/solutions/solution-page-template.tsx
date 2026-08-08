import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FAQ } from "@/components/ui/faq";
import { StructuredData } from "@/components/ui/structured-data";
import { ProjectCard } from "@/components/ui/project-card";
import { BlogCard } from "@/components/ui/blog-card";
import {
  SolutionCtaLink,
  SolutionServiceLink,
} from "@/components/solutions/solution-cta-link";
import { SolutionViewTracker } from "@/components/solutions/solution-view-tracker";
import type { LeadsSolutionPageContent } from "@/data/solution-pages";
import { getProjectBySlug } from "@/data/portfolio";
import { getPostBySlug } from "@/lib/blog";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structured-data";
import type { Project, Solution } from "@/types";
import { cn } from "@/lib/utils";
import {
  RelatedGuidance,
  RelatedSolutions,
  SolutionBackLink,
} from "@/components/solutions/solution-primitives";

type SolutionPageTemplateProps = {
  solution: Solution;
  content: LeadsSolutionPageContent;
};

export function SolutionPageTemplate({
  solution,
  content,
}: SolutionPageTemplateProps) {
  const projects = (solution.relatedProjectSlugs ?? [])
    .map((slug) => getProjectBySlug(slug))
    .filter((project): project is Project => Boolean(project))
    .slice(0, 3);

  const articles = (solution.relatedArticleSlugs ?? [])
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is NonNullable<typeof post> => Boolean(post))
    .slice(0, 3);

  const causes = solution.possibleCauses ?? [];
  const symptoms = solution.problemSymptoms ?? [];
  const journey = solution.process ?? [];
  const reviewAreas = solution.whatWeReview ?? [];
  const measurementPoints = solution.measurementPoints ?? [];
  const serviceLinks = solution.relatedServiceReasons ?? [];
  const faqs = solution.faqs ?? [];

  const primaryLabel =
    solution.primaryCtaLabel || "Get a Free Website Review";
  const primaryHref = solution.primaryCtaHref || "/free-website-review";
  const secondaryLabel =
    solution.secondaryCtaLabel || "Tell Us About Your Website";
  const secondaryHref = solution.secondaryCtaHref || "/contact";

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Solutions", path: "/solutions" },
            {
              name: solution.name,
              path: `/solutions/${solution.slug}`,
            },
          ]),
          ...(faqs.length ? [faqJsonLd(faqs)] : []),
        ]}
      />
      <SolutionViewTracker slug={solution.slug} />

      {/* Hero */}
      <Section className="!pt-10 !pb-12 sm:!pb-14">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Solutions", href: "/solutions" },
              { label: solution.name },
            ]}
          />

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] lg:gap-12 xl:gap-14">
            <div className="order-1 min-w-0">
              <p className="eyebrow">
                {solution.eyebrow || solution.name}
              </p>
              <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
                {solution.heroStatement || solution.title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
                {solution.heroSupporting || solution.shortDescription}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <SolutionCtaLink
                  href={primaryHref}
                  label={primaryLabel}
                  slug={solution.slug}
                  className="w-full sm:w-auto"
                />
                <SolutionCtaLink
                  href={secondaryHref}
                  label={secondaryLabel}
                  slug={solution.slug}
                  variant="outline"
                  className="w-full sm:w-auto"
                />
              </div>
            </div>

            <div className="order-2 mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <LeadJourneyHeroVisual />
            </div>
          </div>
        </Container>
      </Section>

      {/* Traffic vs Leads */}
      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">The core distinction</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Traffic and Leads Are Two Different Problems.
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {content.trafficVsLeads.intro}
            </p>
          </div>

          <div className="mt-10 grid gap-0 border-t border-border md:grid-cols-2">
            <TrafficConversionColumn
              item={content.trafficVsLeads.traffic}
              className="border-b border-border md:border-b-0 md:border-r md:pr-10"
            />
            <TrafficConversionColumn
              item={content.trafficVsLeads.conversion}
              className="md:pl-10"
            />
          </div>
        </Container>
      </Section>

      {/* Causes */}
      <Section className="!py-12 sm:!py-14 lg:!py-16">
        <Container>
          <SectionHeader
            eyebrow="Common causes"
            title="Why Websites Get Traffic but Still Fail to Generate Leads"
            description={content.causesIntro}
          />

          <ol className="mt-10 grid gap-0 border-t border-border sm:grid-cols-2">
            {causes.map((cause, index) => (
              <li
                key={cause.title}
                className={cn(
                  "border-b border-border py-6 sm:px-6 lg:px-8",
                  index % 2 === 0 && "sm:border-r",
                )}
              >
                <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2.5 font-display text-lg font-semibold tracking-tight sm:text-xl">
                  {cause.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {cause.description}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-12 max-w-2xl space-y-8 border-t border-border pt-10">
            <CauseDeepDive
              title="Clarity before cleverness"
              body={content.valuePropositionNote}
            />
            <CauseDeepDive
              title="Intent has to match the page"
              body={content.intentNote}
            />
            <CauseDeepDive
              title="One clear next step"
              body={content.nextStepNote}
            />
            <CauseDeepDive title="Trust without theatrics" body={content.trustNote} />
            <CauseDeepDive
              title="Form friction is often avoidable"
              body={content.formFrictionNote}
            />
            <CauseDeepDive
              title="Mobile is often the real site"
              body={content.mobileNote}
            />
            <CauseDeepDive
              title="Speed adds friction"
              body={content.performanceNote}
            />
          </div>
        </Container>
      </Section>

      {/* Lead journey diagnostic */}
      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <SectionHeader
            eyebrow="Diagnostic flow"
            title="Where the Lead Journey Breaks"
            description="Use this as a practical checklist — not a score. Each step is a place friction can hide."
          />
          <LeadJourneyFlow steps={journey.map((step) => step.title)} />
        </Container>
      </Section>

      {/* Symptoms */}
      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Possible indicators</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                Signs the Website May Have a Conversion Problem
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                These are possible indicators — not a diagnosis on their own.
                The cause still needs reviewing in context.
              </p>
            </div>
            <ul className="border-t border-border">
              {symptoms.map((symptom) => (
                <li
                  key={symptom}
                  className="flex gap-3 border-b border-border py-4 text-[0.9375rem] leading-relaxed text-foreground sm:text-base"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  {symptom}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Measurement */}
      <Section tone="dark" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                Measurement
              </p>
              <h2 className="heading-section mt-3 font-display font-semibold text-white">
                If You Don&apos;t Track the Action, You Can&apos;t Diagnose the
                Drop-Off.
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-white/75 sm:text-[1.0625rem]">
                {content.measurementIntro}
              </p>
              <SolutionServiceLink
                href="/services/analytics-conversion-tracking"
                slug={solution.slug}
                className="group mt-6 inline-flex items-center gap-1.5 text-base font-semibold text-orange-300 hover:text-orange-200"
              >
                Explore Analytics &amp; Conversion Tracking
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </SolutionServiceLink>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {measurementPoints.map((point) => (
                <li
                  key={point}
                  className="rounded-lg border border-white/12 bg-white/[0.04] px-5 py-4 text-[0.9375rem] font-semibold text-white sm:text-base"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Redesign decision */}
      <Section className="!py-12 sm:!py-14 lg:!py-16">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">Scope decisions</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Does This Mean You Need a Full Redesign?
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              Not necessarily. {content.redesignIntro}
            </p>
          </div>

          <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.redesignLevels.map((level, index) => (
              <li
                key={level.title}
                className={cn(
                  "border-t border-border pt-5",
                  index === 2 && "md:col-span-2 lg:col-span-1",
                )}
              >
                <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">
                  {level.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {level.description}
                </p>
                <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-foreground">
                  {level.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-accent-text" aria-hidden>
                        ·
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* What we review + diagnose */}
      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Before recommending a fix</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                What We Look At Before Recommending a Fix
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {content.diagnoseNote}
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-2">
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

      {/* Services */}
      {serviceLinks.length > 0 ? (
        <Section className="!py-12 sm:!py-14">
          <Container>
            <SectionHeader
              eyebrow="Capabilities"
              title="Services That May Help"
              description="Relevant capabilities once the problem is clearer — not a package to buy before diagnosis."
            />
            <ul className="mt-10 divide-y divide-border border-y border-border">
              {serviceLinks.map((service) => (
                <li key={service.href}>
                  <SolutionServiceLink
                    href={service.href}
                    slug={solution.slug}
                    className="group flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-lg font-semibold text-foreground group-hover:text-accent-text sm:text-xl">
                        {service.title}
                      </p>
                      <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                        {service.reason}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[0.9375rem] font-semibold text-accent-text">
                      Explore
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        aria-hidden
                      />
                    </span>
                  </SolutionServiceLink>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Free review vs audit */}
      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <SectionHeader
            eyebrow="Starting points"
            title="Free Website Review vs Full Website Audit"
            description="Both are useful — they serve different levels of certainty and depth."
          />
          <div className="mt-10 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
            <div className="bg-surface px-6 py-8 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
                {content.reviewVsAudit.review.title}
              </p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.reviewVsAudit.review.description}
              </p>
              <SolutionCtaLink
                href="/free-website-review"
                label="Get a Free Website Review"
                slug={solution.slug}
                size="md"
                className="mt-6"
                location="solution-review-vs-audit"
              />
            </div>
            <div className="bg-surface px-6 py-8 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
                {content.reviewVsAudit.audit.title}
              </p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {content.reviewVsAudit.audit.description}
              </p>
              <SolutionServiceLink
                href="/services/website-audit"
                slug={solution.slug}
                className="group mt-6 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
              >
                Explore Website Audit
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </SolutionServiceLink>
            </div>
          </div>
        </Container>
      </Section>

      {/* Related work */}
      {projects.length > 0 ? (
        <Section className="!py-12 sm:!py-14 lg:!py-16">
          <Container>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                eyebrow="Work"
                title="Related Website Work"
                description="Selected projects from across hospitality, property and service businesses."
              />
              <Link
                href="/work"
                className="text-base font-semibold text-accent-text hover:underline"
              >
                View all work →
              </Link>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Related insights */}
      {articles.length > 0 ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container>
            <SectionHeader
              eyebrow="Insights"
              title="Related Insights"
              description="Educational reading on conversion clarity, redesign decisions and reducing friction."
            />
            <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {articles.map((post) => (
                <BlogCard key={post.slug} post={post} variant="editorial" />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* FAQ */}
      {faqs.length > 0 ? (
        <Section className="!py-12 sm:!py-14">
          <Container>
            <SectionHeader
              eyebrow="FAQ"
              title="Questions about traffic without leads"
              description="Practical answers for when visitors arrive but enquiries stay low."
            />
            <div className="mx-auto mt-8 max-w-3xl">
              <FAQ items={faqs} />
            </div>
          </Container>
        </Section>
      ) : null}

      <Section tone="dark" className="!py-12 sm:!py-14">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl leading-tight text-white sm:text-4xl">
                {solution.ctaTitle ||
                  solution.heroStatement ||
                  solution.title}
              </h2>
              {solution.ctaDescription ? (
                <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">
                  {solution.ctaDescription}
                </p>
              ) : null}
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <SolutionCtaLink
                href={primaryHref}
                label={primaryLabel}
                slug={solution.slug}
                location="solution-final-cta"
                className="w-full sm:w-auto"
              />
              <SolutionCtaLink
                href={secondaryHref}
                label={secondaryLabel}
                slug={solution.slug}
                variant="outline"
                location="solution-final-cta"
                className="w-full border-white/25 bg-transparent text-white hover:border-white hover:bg-white/5 hover:text-white sm:w-auto"
              />
            </div>
          </div>
        </Container>
      </Section>

      <RelatedGuidance solution={solution} />
      <RelatedSolutions solution={solution} />
      <SolutionBackLink />
    </>
  );
}

function TrafficConversionColumn({
  item,
  className,
}: {
  item: LeadsSolutionPageContent["trafficVsLeads"]["traffic"];
  className?: string;
}) {
  return (
    <div className={cn("py-8", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
        {item.title}
      </p>
      <p className="mt-3 text-base leading-relaxed text-foreground sm:text-[1.0625rem]">
        {item.description}
      </p>
      {item.areas?.length ? (
        <>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
            Possible areas
          </p>
          <ul className="mt-3 space-y-1.5 text-[0.9375rem] text-muted sm:text-base">
            {item.areas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function CauseDeepDive({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-display text-xl font-semibold tracking-tight sm:text-[1.375rem]">
        {title}
      </h3>
      <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
        {body}
      </p>
    </div>
  );
}

function LeadJourneyHeroVisual() {
  const steps = [
    "Traffic",
    "Landing page",
    "Message / offer",
    "CTA",
    "Form / booking",
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
        <span className="ml-3 h-2 flex-1 rounded-full bg-border/80" />
      </div>
      <ol className="space-y-0 p-4 sm:p-5">
        {steps.map((step, index) => (
          <li key={step} className="flex flex-col items-stretch">
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3.5 py-3",
                index === steps.length - 1
                  ? "border-dashed border-accent/45 bg-accent/5"
                  : "border-border bg-surface-muted/50",
                index === 2 && "opacity-90",
                index === 3 && "border-accent/30",
              )}
            >
              <span className="font-display text-xs font-semibold tabular-nums text-accent-text">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[0.9375rem] font-semibold text-foreground">
                {step}
              </span>
              {index >= 2 && index < steps.length - 1 ? (
                <span className="ml-auto text-xs font-medium text-muted">
                  Friction
                </span>
              ) : null}
            </div>
            {index < steps.length - 1 ? (
              <div className="flex justify-center py-1.5">
                <span className="text-accent-text">↓</span>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function LeadJourneyFlow({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-10 flex flex-col gap-0 lg:flex-row lg:items-stretch lg:gap-0">
      {steps.map((step, index) => (
        <li
          key={step}
          className="relative flex flex-1 flex-col border-t border-border pt-5 lg:border-t-0 lg:border-l lg:px-4 lg:pt-0 lg:first:border-l-0 lg:first:pl-0"
        >
          <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="mt-2 font-display text-base font-semibold leading-snug tracking-tight sm:text-lg">
            {step}
          </p>
          {index < steps.length - 1 ? (
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
