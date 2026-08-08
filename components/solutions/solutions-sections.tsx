import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FAQ } from "@/components/ui/faq";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ui/project-card";
import {
  getSolutionHref,
  solutionsHubFaqs,
} from "@/data/solutions";
import type { Project, Solution } from "@/types";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type SolutionsBySlug = Record<string, Solution>;

function requireSolution(
  slug: string,
  solutionsBySlug: SolutionsBySlug,
): Solution {
  const solution = solutionsBySlug[slug];
  if (!solution) {
    throw new Error(`Missing published solution: ${slug}`);
  }
  return solution;
}

function SolutionCtaLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline sm:text-base",
        className,
      )}
    >
      {children}
      <ArrowRight
        className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
        aria-hidden
      />
    </Link>
  );
}

function FlowStepLabel({
  label,
  accent = false,
}: {
  label: string;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center border px-2.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em]",
        accent
          ? "border-accent bg-accent/10 text-accent-text"
          : "border-border bg-surface text-foreground",
      )}
    >
      {label}
    </span>
  );
}

function FlowArrow() {
  return (
    <span
      className="hidden shrink-0 text-accent-text sm:inline"
      aria-hidden
    >
      →
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Hero                                                                    */
/* -------------------------------------------------------------------------- */

export function SolutionsHero() {
  return (
    <section className="border-b border-border bg-surface-muted">
      <Container className="!pt-10 !pb-14 sm:!pb-16">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Solutions" }]}
        />

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)] lg:gap-14 xl:gap-16">
          <div className="min-w-0">
            <p className="eyebrow">Solutions</p>
            <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              What&apos;s Holding
              <br className="hidden sm:block" /> Your Website Back?
            </h1>
            <p className="mt-5 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
              You may not know whether the answer is design, SEO, development or
              conversion work yet. Start with what isn&apos;t working — we&apos;ll
              help you identify the right kind of change.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild size="lg">
                <Link href="#problem-finder">Find Your Website Problem</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/project-planner">Plan Your Project</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <SolutionsHeroVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}

function SolutionsHeroVisual() {
  const annotations = [
    { label: "Search", side: "left" as const, top: "12%" },
    { label: "Visit", side: "right" as const, top: "28%" },
    { label: "Action", side: "left" as const, top: "52%" },
    { label: "System", side: "right" as const, top: "72%" },
  ];

  return (
    <div className="relative" aria-hidden>
      {/* Annotation labels — desktop */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {annotations.map((item) => (
          <div
            key={item.label}
            className={cn(
              "absolute flex items-center gap-2",
              item.side === "left" ? "right-[calc(100%+0.75rem)]" : "left-[calc(100%+0.75rem)]",
            )}
            style={{ top: item.top }}
          >
            {item.side === "right" ? (
              <span className="h-px w-6 bg-accent/50" />
            ) : null}
            <span className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-accent-text">
              {item.label}
            </span>
            {item.side === "left" ? (
              <span className="h-px w-6 bg-accent/50" />
            ) : null}
          </div>
        ))}
      </div>

      {/* Website frame */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-3.5 py-2.5">
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="ml-3 h-2 flex-1 rounded-full bg-border/80" />
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* Search bar strip */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full border border-accent/60" />
            <span className="h-1.5 flex-1 rounded-full bg-border" />
            <span className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-accent-text lg:hidden">
              Search
            </span>
          </div>

          {/* Page body skeleton */}
          <div className="grid gap-3 sm:grid-cols-[1fr_0.7fr]">
            <div className="space-y-2.5">
              <div className="h-2.5 w-[70%] rounded-full bg-foreground/15" />
              <div className="h-1.5 w-full rounded-full bg-border" />
              <div className="h-1.5 w-[85%] rounded-full bg-border/70" />
              <div className="mt-3 flex gap-2">
                <span className="h-7 w-20 rounded-md bg-accent/80" />
                <span className="h-7 w-16 rounded-md border border-border" />
              </div>
              <span className="mt-1 block text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-accent-text lg:hidden">
                Visit · Action
              </span>
            </div>
            <div className="hidden rounded-md border border-dashed border-border bg-surface-muted/50 sm:block" />
          </div>

          {/* System layer */}
          <div className="border-t border-border pt-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {["Structure", "Speed", "SEO", "Tracking"].map((label) => (
                <span
                  key={label}
                  className="text-[0.625rem] font-medium uppercase tracking-[0.1em] text-subtle"
                >
                  {label}
                </span>
              ))}
              <span className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-accent-text lg:hidden">
                System
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Problem Finder                                                          */
/* -------------------------------------------------------------------------- */

const problemFinderItems = [
  {
    number: "01",
    title: "We get traffic, but not enough enquiries",
    line: "Visitors arrive — then leave without contacting you.",
    href: "/solutions/website-not-generating-leads",
  },
  {
    number: "02",
    title: "Customers struggle to find us",
    line: "People searching for what you offer rarely reach the site.",
    href: "#visibility",
  },
  {
    number: "03",
    title: "The website feels outdated",
    line: "The business has moved on. The site still looks and works like yesterday.",
    href: "/solutions/outdated-website",
  },
  {
    number: "04",
    title: "Pages feel slow or frustrating",
    line: "Loading, scrolling or interacting on the site creates friction.",
    href: "/solutions/slow-website",
  },
  {
    number: "05",
    title: "We've outgrown the current website",
    line: "Structure, platform or content no longer match how the business works.",
    href: "#change-new",
  },
  {
    number: "06",
    title: "We're starting something new",
    line: "You need a clear website foundation built around the right goals.",
    href: "/solutions/new-business-website",
  },
] as const;

export function SolutionsProblemFinder() {
  return (
    <Section id="problem-finder" className="scroll-mt-28 !py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Problem finder</p>
          <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight tracking-tight sm:text-4xl">
            What Sounds Most Like Your Website?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            You don&apos;t need a technical diagnosis first. Pick the situation
            that feels closest — we&apos;ll take it from there.
          </p>
        </div>

        <ol className="mt-10 border-t border-border sm:mt-12">
          {problemFinderItems.map((item) => (
            <li key={item.number} className="border-b border-border">
              <Link
                href={item.href}
                className="group flex items-start gap-4 py-5 transition-colors hover:bg-surface-muted/60 focus-visible:bg-surface-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:gap-6 sm:py-6 sm:pl-2"
              >
                <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-accent-text sm:text-base">
                  {item.number}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent-text motion-reduce:transition-none sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                    {item.line}
                  </p>
                </div>
                <ArrowRight
                  className="mt-1 h-5 w-5 shrink-0 text-accent-text opacity-60 transition-all group-hover:translate-x-1 group-hover:opacity-100 motion-reduce:transition-none"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Territories                                                             */
/* -------------------------------------------------------------------------- */

export function SolutionsTerritories({
  solutionsBySlug,
}: {
  solutionsBySlug: SolutionsBySlug;
}) {
  const leads = requireSolution("website-not-generating-leads", solutionsBySlug);
  const conversions = requireSolution("low-website-conversions", solutionsBySlug);
  const ecommerce = requireSolution("ecommerce-growth", solutionsBySlug);
  const ranking = requireSolution("website-not-ranking", solutionsBySlug);
  const local = requireSolution("local-business-visibility", solutionsBySlug);
  const slow = requireSolution("slow-website", solutionsBySlug);
  const outdated = requireSolution("outdated-website", solutionsBySlug);
  const migration = requireSolution("website-migration", solutionsBySlug);
  const newBiz = requireSolution("new-business-website", solutionsBySlug);

  return (
    <>
      {/* Growth & Conversion */}
      <Section
        id="growth-conversion"
        tone="surface"
        className="scroll-mt-28 !py-14 sm:!py-16 lg:!py-[4.5rem]"
      >
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow">Growth &amp; Conversion</p>
            <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.5rem]">
              People Are Visiting. But the Website Isn&apos;t Doing Enough.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              A website can attract attention and still fail to turn that
              attention into enquiries, purchases or meaningful action.
            </p>
          </div>

          {/* Journey diagram */}
          <div
            className="mt-8 flex flex-wrap items-center gap-2 sm:mt-10 sm:gap-3"
            aria-hidden
          >
            {(["Visit", "Understand", "Trust", "Act"] as const).map(
              (step, index) => (
                <div key={step} className="flex items-center gap-2 sm:gap-3">
                  <FlowStepLabel label={step} accent={index === 3} />
                  {index < 3 ? <FlowArrow /> : null}
                </div>
              ),
            )}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
            <FeaturedSolutionLink
              solution={leads}
              cta="Fix Lead Generation"
            />
            <div className="flex flex-col justify-between gap-8 border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
              <SupportingSolutionLink
                solution={conversions}
                cta="Improve Conversion"
              />
              <SupportingSolutionLink
                solution={ecommerce}
                cta="Grow an E-commerce Website"
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Visibility */}
      <Section
        id="visibility"
        tone="muted"
        className="scroll-mt-28 !py-14 sm:!py-16 lg:!py-[4.5rem]"
      >
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:items-start lg:gap-14">
            <div>
              <p className="eyebrow">Visibility</p>
              <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight tracking-tight sm:text-4xl">
                The Right People Can&apos;t Find You.
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
                Search visibility depends on discovery, relevance and a website
                that can turn a find into a contact.
              </p>

              {/* Search flow visual */}
              <div
                className="mt-8 flex flex-col gap-0 sm:mt-10"
                aria-hidden
              >
                {(
                  [
                    { label: "Search", note: "Intent" },
                    { label: "Result", note: "Discovery" },
                    { label: "Website", note: "Relevance" },
                    { label: "Contact", note: "Action" },
                  ] as const
                ).map((step, index, arr) => (
                  <div key={step.label} className="flex gap-4">
                    <div className="flex w-8 shrink-0 flex-col items-center">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border text-[0.625rem] font-semibold",
                          index === arr.length - 1
                            ? "border-accent bg-accent/15 text-accent-text"
                            : "border-border bg-surface text-foreground",
                        )}
                      >
                        {String(index + 1)}
                      </span>
                      {index < arr.length - 1 ? (
                        <span className="my-1 w-px flex-1 bg-border" />
                      ) : null}
                    </div>
                    <div
                      className={cn(
                        "min-w-0 pb-5",
                        index === arr.length - 1 && "pb-0",
                      )}
                    >
                      <p className="font-display text-base font-semibold text-foreground">
                        {step.label}
                      </p>
                      <p className="text-sm text-muted">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
              <TerritorySideCard
                solution={ranking}
                cta="Improve Search Visibility"
              />
              <TerritorySideCard
                solution={local}
                cta="Improve Local Visibility"
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Website Quality */}
      <Section
        id="website-quality"
        className="scroll-mt-28 !py-14 sm:!py-16 lg:!py-[4.5rem]"
      >
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow">Website Quality</p>
            <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.5rem]">
              The Website Itself Is Getting in the Way.
            </h2>
          </div>

          {/* Split panels */}
          <div
            className="mt-8 grid gap-px overflow-hidden border border-border bg-border sm:mt-10 md:grid-cols-2"
            aria-hidden
          >
            <div className="bg-surface px-5 py-6 sm:px-7 sm:py-8">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                Performance
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Load", "Render", "Interact"].map((label) => (
                  <FlowStepLabel key={label} label={label} />
                ))}
              </div>
            </div>
            <div className="bg-surface-muted px-5 py-6 sm:px-7 sm:py-8">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                Experience
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Message", "Structure", "Design", "Usability"].map(
                  (label) => (
                    <FlowStepLabel key={label} label={label} />
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-8 border-t border-border pt-10 md:grid-cols-2 md:gap-12">
            <QualitySolutionBlock
              solution={slow}
              cta="Diagnose Website Speed"
            />
            <QualitySolutionBlock
              solution={outdated}
              cta="Review an Outdated Website"
            />
          </div>
        </Container>
      </Section>

      {/* Change & New */}
      <Section
        id="change-new"
        tone="muted"
        className="scroll-mt-28 !py-14 sm:!py-16 lg:!py-[4.5rem]"
      >
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow">Change &amp; New Projects</p>
            <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.5rem]">
              Sometimes the Problem Isn&apos;t Fixing the Current Website.
            </h2>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-12">
            {/* Existing path */}
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                Existing
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2" aria-hidden>
                {(
                  [
                    "Preserve",
                    "Move",
                    "Validate",
                    "New Environment",
                  ] as const
                ).map((step, index) => (
                  <div key={step} className="flex items-center gap-2">
                    <FlowStepLabel
                      label={step}
                      accent={index === 3}
                    />
                    {index < 3 ? <FlowArrow /> : null}
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <PathSolutionBlock
                  solution={migration}
                  cta="Plan a Website Migration"
                />
              </div>
            </div>

            {/* New path */}
            <div className="border-t border-border pt-10 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                New
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2" aria-hidden>
                {(["Goals", "Structure", "Content", "Website"] as const).map(
                  (step, index) => (
                    <div key={step} className="flex items-center gap-2">
                      <FlowStepLabel
                        label={step}
                        accent={index === 3}
                      />
                      {index < 3 ? <FlowArrow /> : null}
                    </div>
                  ),
                )}
              </div>
              <div className="mt-8">
                <PathSolutionBlock
                  solution={newBiz}
                  cta="Plan a New Website"
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function FeaturedSolutionLink({
  solution,
  cta,
}: {
  solution: Solution;
  cta: string;
}) {
  const href = getSolutionHref(solution);
  if (!href) return null;

  return (
    <Link
      href={href}
      className="group block rounded-lg border border-border bg-surface p-6 transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none sm:p-8"
    >
      <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent-text motion-reduce:transition-none sm:text-[1.75rem]">
        {solution.title}
      </h3>
      <p className="mt-3 line-clamp-3 text-base leading-relaxed text-muted">
        {solution.shortDescription}
      </p>
      <span className="mt-6 inline-flex items-center gap-1.5 text-base font-semibold text-accent-text">
        {cta}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          aria-hidden
        />
      </span>
    </Link>
  );
}

function SupportingSolutionLink({
  solution,
  cta,
}: {
  solution: Solution;
  cta: string;
}) {
  const href = getSolutionHref(solution);
  if (!href) return null;

  return (
    <div>
      <h3 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]">
        <Link
          href={href}
          className="transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
        >
          {solution.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
        {solution.shortDescription}
      </p>
      <SolutionCtaLink href={href} className="mt-4">
        {cta}
      </SolutionCtaLink>
    </div>
  );
}

function TerritorySideCard({
  solution,
  cta,
}: {
  solution: Solution;
  cta: string;
}) {
  const href = getSolutionHref(solution);
  if (!href) return null;

  return (
    <div className="flex h-full flex-col border-t border-border pt-6 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0 first:border-l-0 first:pl-0">
      <h3 className="font-display text-xl font-semibold tracking-tight sm:text-[1.375rem]">
        <Link
          href={href}
          className="transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
        >
          {solution.title}
        </Link>
      </h3>
      <p className="mt-2.5 flex-1 line-clamp-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
        {solution.shortDescription}
      </p>
      <SolutionCtaLink href={href} className="mt-5">
        {cta}
      </SolutionCtaLink>
    </div>
  );
}

function QualitySolutionBlock({
  solution,
  cta,
}: {
  solution: Solution;
  cta: string;
}) {
  const href = getSolutionHref(solution);
  if (!href) return null;

  return (
    <div>
      <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
        <Link
          href={href}
          className="transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
        >
          {solution.title}
        </Link>
      </h3>
      <p className="mt-2.5 line-clamp-3 text-base leading-relaxed text-muted">
        {solution.shortDescription}
      </p>
      <SolutionCtaLink href={href} className="mt-5">
        {cta}
      </SolutionCtaLink>
    </div>
  );
}

function PathSolutionBlock({
  solution,
  cta,
}: {
  solution: Solution;
  cta: string;
}) {
  const href = getSolutionHref(solution);
  if (!href) return null;

  return (
    <div>
      <h3 className="font-display text-xl font-semibold tracking-tight sm:text-[1.5rem]">
        <Link
          href={href}
          className="transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
        >
          {solution.title}
        </Link>
      </h3>
      <p className="mt-2.5 line-clamp-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
        {solution.shortDescription}
      </p>
      <SolutionCtaLink href={href} className="mt-5">
        {cta}
      </SolutionCtaLink>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Overlap callout                                                         */
/* -------------------------------------------------------------------------- */

export function SolutionsOverlapCallout() {
  return (
    <Section className="!py-12 sm:!py-14">
      <Container>
        <div className="rounded-xl border border-border bg-surface-muted px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
            <div className="max-w-2xl">
              <h2 className="font-display text-[1.75rem] font-semibold tracking-tight sm:text-3xl">
                Seeing More Than One Problem?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                Website issues often overlap. Low enquiries might come from weak
                messaging, poor search visibility, slow performance — or a
                combination of all three.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button asChild size="lg">
                <Link href="/project-planner">Plan Your Project</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/free-website-review">
                  Get a Free Website Review
                </Link>
              </Button>
            </div>
          </div>
          <p className="mt-6 max-w-2xl border-t border-border pt-5 text-[0.875rem] leading-relaxed text-muted sm:text-[0.9375rem]">
            Already have a website? Start with a Free Review. Planning something
            new? Use the Project Planner to describe the situation.
          </p>
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. Approach                                                                */
/* -------------------------------------------------------------------------- */

const approachStages = [
  {
    number: "01",
    title: "Observe",
    description: "What visitors experience, and what the business needs the site to do.",
  },
  {
    number: "02",
    title: "Identify",
    description: "Where the journey breaks — visibility, clarity, trust, speed or action.",
  },
  {
    number: "03",
    title: "Prioritize",
    description: "What will move the needle first, without pretending every issue is equal.",
  },
  {
    number: "04",
    title: "Apply",
    description: "The capabilities required — only as far as the problem actually needs.",
  },
] as const;

const applyCapabilities = [
  "Strategy",
  "Design",
  "Development",
  "SEO",
  "Performance",
  "Conversion",
  "Content",
  "Analytics",
  "Maintenance",
] as const;

export function SolutionsApproach() {
  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">How we work</p>
          <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight tracking-tight sm:text-4xl">
            We Diagnose Before We Prescribe.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            A website problem rarely sits in one box. That&apos;s why we start
            with evidence of what isn&apos;t working — not a pre-selected service
            package.
          </p>
        </div>

        <ol className="mt-10 grid gap-8 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {approachStages.map((stage) => (
            <li key={stage.number}>
              <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                {stage.number}
              </span>
              <h3 className="mt-2 font-display text-xl font-semibold uppercase tracking-wide text-foreground">
                {stage.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                {stage.description}
              </p>
              {stage.number === "04" ? (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {applyCapabilities.map((cap) => (
                    <li
                      key={cap}
                      className="rounded border border-border bg-surface-muted px-2 py-1 text-[0.6875rem] font-medium text-muted"
                    >
                      {cap}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-12 max-w-xl border-l-2 border-accent pl-5 sm:mt-14 sm:pl-6">
          <p className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            The answer is not always a redesign.
          </p>
          <p className="mt-2 text-base leading-relaxed text-muted">
            Some problems need clearer structure, stronger SEO foundations,
            faster pages or a better path to action — without rebuilding
            everything.
          </p>
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. Selected work                                                           */
/* -------------------------------------------------------------------------- */

export function SolutionsSelectedWork({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Work</p>
            <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight tracking-tight sm:text-4xl">
              Problems Solved Through Real Website Work
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
              Selected projects from across hospitality, property and service
              businesses.
            </p>
          </div>
          <Link
            href="/work"
            className="group inline-flex shrink-0 items-center gap-1.5 text-base font-semibold text-accent-text hover:underline"
          >
            View All Work
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          </Link>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. Problem → Solution → Capabilities flow                                  */
/* -------------------------------------------------------------------------- */

const problemFlows = [
  {
    symptom: "Traffic arrives, but enquiries stay low",
    solutionSlug: "website-not-generating-leads",
    capabilities: ["Conversion", "Content", "UX", "Analytics"],
  },
  {
    symptom: "Customers searching nearby never find you",
    solutionSlug: "website-not-ranking",
    capabilities: ["SEO", "Structure", "Content", "Technical"],
  },
  {
    symptom: "The site feels slow, dated, or hard to use",
    solutionSlug: "outdated-website",
    capabilities: ["Performance", "Design", "Development", "Strategy"],
  },
] as const;

export function SolutionsProblemFlow({
  solutionsBySlug,
}: {
  solutionsBySlug: SolutionsBySlug;
}) {
  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Solutions &amp; services</p>
          <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight tracking-tight sm:text-4xl">
            A Problem Can Require More Than One Capability.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Solutions name the business problem. Services are the disciplines
            used to fix it — often more than one at a time.
          </p>
        </div>

        <ul className="mt-10 space-y-0 border-t border-border sm:mt-12">
          {problemFlows.map((flow) => {
            const solution = requireSolution(flow.solutionSlug, solutionsBySlug);
            const href = getSolutionHref(solution);

            return (
              <li
                key={flow.solutionSlug}
                className="grid gap-4 border-b border-border py-7 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1.1fr)] sm:items-center sm:gap-5 sm:py-8"
              >
                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                    Symptom
                  </p>
                  <p className="mt-1.5 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    {flow.symptom}
                  </p>
                </div>

                <span
                  className="hidden text-accent-text sm:block"
                  aria-hidden
                >
                  →
                </span>

                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                    Solution
                  </p>
                  {href ? (
                    <Link
                      href={href}
                      className="mt-1.5 inline-block font-display text-lg font-semibold tracking-tight text-accent-text hover:underline sm:text-xl"
                    >
                      {solution.name}
                    </Link>
                  ) : (
                    <p className="mt-1.5 font-display text-lg font-semibold sm:text-xl">
                      {solution.name}
                    </p>
                  )}
                </div>

                <span
                  className="hidden text-accent-text sm:block"
                  aria-hidden
                >
                  →
                </span>

                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                    Capabilities
                  </p>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                    {flow.capabilities.join(" · ")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-8">
          <Link
            href="/services"
            className="group inline-flex items-center gap-1.5 text-base font-semibold text-accent-text hover:underline"
          >
            Explore Services
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          </Link>
        </p>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. Planner promo                                                           */
/* -------------------------------------------------------------------------- */

export function SolutionsPlannerPromo() {
  return (
    <Section tone="muted" className="!py-14 sm:!py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-[1.875rem] font-semibold tracking-tight sm:text-4xl">
            Not Sure Where to Start?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Describe the situation, the goals and what&apos;s already in place.
            The Project Planner helps shape a clearer brief before you commit to
            a direction.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/project-planner">Plan Your Project</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 9. FAQ                                                                     */
/* -------------------------------------------------------------------------- */

export function SolutionsFaq() {
  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:gap-14 xl:gap-16">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight tracking-tight sm:text-4xl">
              Questions about website solutions
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              Practical answers for when you know something isn&apos;t working,
              but you&apos;re not sure which problem to start with.
            </p>
          </div>
          <div>
            <FAQ items={[...solutionsHubFaqs]} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
