import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/components/ui/faq";
import {
  engagementTypes,
  entryPoints,
  includedCategories,
  increaseScopeItems,
  matrixCellLabels,
  pricingConfig,
  processSteps,
  reduceScopeItems,
  relatedResources,
  relatedServices,
  relatedSolutions,
  scopeExamples,
  scopeFactors,
  scopeMatrixRows,
  thirdPartyCostItems,
  timelineFactors,
  faqs as pricingFaqs,
  type MatrixCell,
  type ScopeMatrixRow,
} from "@/data/pricing";
import { cn } from "@/lib/utils";

const ENGAGEMENT_COLUMNS = [
  { key: "improve" as const, label: "Focused improvement" },
  { key: "redesign" as const, label: "Redesign" },
  { key: "build" as const, label: "New build" },
  { key: "grow" as const, label: "Growth / ongoing" },
];

export function PricingHero() {
  return (
    <section className="border-b border-border bg-surface-muted">
      <Container className="!pt-10 !pb-12 sm:!pb-14 lg:!pb-16">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Pricing" }]}
        />

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] lg:gap-14">
          <div className="min-w-0">
            <p className="eyebrow">Pricing &amp; project scope</p>
            <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              What Will Your Website Project Actually Involve?
            </h1>
            <p className="mt-5 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
              Website costs depend on more than page count. We scope projects
              around the strategy, content, design, development, SEO,
              integrations and ongoing needs required to make the site work
              properly.
            </p>
            <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-foreground">
              You should understand what you&apos;re paying for before the
              project starts.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/contact">Tell Us About Your Project</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/project-planner">Plan Your Project</Link>
              </Button>
            </div>
          </div>

          <ScopeFlowVisual />
        </div>
      </Container>
    </section>
  );
}

function ScopeFlowVisual() {
  const inputs = [
    "Goals",
    "Content",
    "Design",
    "Development",
    "SEO",
    "Integrations",
  ] as const;

  return (
    <div
      className="mx-auto w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-sm lg:mx-0 lg:max-w-none"
      aria-hidden
    >
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">
        Project inputs
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {inputs.map((item) => (
          <li
            key={item}
            className="rounded-md border border-border bg-surface-muted px-3 py-2.5 text-center text-sm font-semibold text-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
      <div className="my-4 flex justify-center text-subtle" aria-hidden>
        ↓
      </div>
      <div className="rounded-md border border-accent/30 bg-brand-soft px-4 py-3 text-center">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
          Project scope
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          Defined deliverables &amp; exclusions
        </p>
      </div>
      <div className="my-4 flex justify-center text-subtle" aria-hidden>
        ↓
      </div>
      <div className="rounded-md border border-border bg-surface-dark px-4 py-3 text-center text-white">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white/60">
          Proposal
        </p>
        <p className="mt-1 text-sm font-medium">
          Scope, timing &amp; commercial terms
        </p>
      </div>
    </div>
  );
}

export function PricingPrinciple({
  showPublicPricing = pricingConfig.showPublicPricing,
}: {
  showPublicPricing?: boolean;
} = {}) {
  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-2xl">
          <SectionHeader
            eyebrow="Core principle"
            title="Website Pricing Is Really Scope Pricing"
            description="A five-page website can be complicated. A twenty-page website can sometimes be straightforward."
          />
          <p className="mt-6 text-base leading-[1.7] text-muted sm:text-[1.0625rem]">
            Cost is affected by what those pages need to communicate, do,
            connect to, protect, measure and support. Page count matters, but it
            is not the full scope — and attaching one package price to every
            project usually hides that reality.
          </p>
          {!showPublicPricing ? (
            <p className="mt-6 rounded-lg border border-border bg-surface-muted px-4 py-3.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {pricingConfig.publicPricingNote}
            </p>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}

export function PricingScopeFactors() {
  return (
    <Section tone="muted">
      <Container>
        <SectionHeader
          eyebrow="Scope factors"
          title="What Affects the Cost of a Website Project?"
          description="These are the factors that usually change investment — not a checklist every project must include."
        />
        <ol className="mt-10 divide-y divide-border border-y border-border">
          {scopeFactors.map((factor) => (
            <li
              key={factor.id}
              className="grid gap-3 py-7 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-8 sm:py-8"
            >
              <p className="font-display text-2xl font-semibold tracking-tight text-accent-text sm:text-3xl">
                {factor.number}
              </p>
              <div className="min-w-0 max-w-2xl">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]">
                  {factor.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted">
                  {factor.body}
                </p>
                {factor.links && factor.links.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    {factor.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 max-w-2xl rounded-xl border border-border bg-surface px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
            Platform
          </p>
          <p className="mt-2 font-display text-xl font-semibold tracking-tight text-foreground">
            Still deciding which platform fits?
          </p>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
            Shortlist options from your requirements before assuming one
            platform is always cheaper or better.
          </p>
          <Link
            href="/tools/website-platform-selector"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Use Website Platform Selector
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Container>
    </Section>
  );
}

export function PricingEngagementPaths() {
  return (
    <section className="bg-surface-dark text-white">
      <Container className="py-14 sm:py-16 lg:py-[4.5rem]">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
            Engagement paths
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.875rem,3.5vw,2.75rem)] font-semibold leading-[1.12] tracking-tight">
            Not Every Website Problem Needs a Full Rebuild
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-[1.0625rem]">
            These are different engagement types — not a ladder of packages or
            rising price tiers. You may only need Improve, or Build then Grow.
          </p>
        </div>

        <ol className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {engagementTypes.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-col border border-white/15 bg-white/[0.03] p-5 sm:p-6"
            >
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent">
                {String(index + 1).padStart(2, "0")} · {item.title}
              </p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/80">
                {item.description}
              </p>
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white/45">
                  May fit if
                </p>
                <ul className="mt-2 space-y-1.5 text-sm leading-snug text-white/70">
                  {item.mayFitIf.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              {item.relatedSolutionLinks &&
              item.relatedSolutionLinks.length > 0 ? (
                <ul className="mt-auto space-y-2 border-t border-white/10 pt-4">
                  {item.relatedSolutionLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export function PricingScopeExamples() {
  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow="Scope examples"
          title="What Different Projects Can Involve"
          description="Illustrative examples of work — not fixed packages and not priced offers."
        />
        <ul className="mt-10 grid gap-8 lg:grid-cols-2">
          {scopeExamples.map((example) => (
            <li
              key={example.id}
              className="border-t border-border pt-6 sm:pt-7"
            >
              <h3 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]">
                {example.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted">
                {example.summary}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                Could include
              </p>
              <ul className="mt-2 space-y-1.5 text-[0.9375rem] leading-relaxed text-muted">
                {example.couldInclude.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function PricingIncluded() {
  return (
    <Section tone="muted">
      <Container>
        <SectionHeader
          eyebrow="Depending on scope"
          title="What Can Be Included in a Smartlance Website Project?"
          description="Not every project includes every category. The proposal defines what belongs in your engagement."
        />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {includedCategories.map((item) => (
            <li key={item.id} className="min-w-0">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function MatrixCellText({ value }: { value: MatrixCell }) {
  return (
    <span
      className={cn(
        "text-[0.9375rem]",
        value === "common" && "font-semibold text-foreground",
        value === "sometimes" && "text-muted",
        value === "not-typically" && "text-subtle",
      )}
    >
      {matrixCellLabels[value]}
    </span>
  );
}

export function PricingScopeMatrix() {
  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow="Scope matrix"
          title="Where Work Typically Appears"
          description="Directional guidance only. Actual proposals define final scope — a checkmark would overstate certainty."
        />

        {/* Desktop / tablet table */}
        <div className="mt-10 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <caption className="sr-only">
              Typical inclusion of project work areas across engagement types
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="py-3 pr-4 text-xs font-semibold uppercase tracking-[0.12em] text-subtle"
                >
                  Work area
                </th>
                {ENGAGEMENT_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scopeMatrixRows.map((row) => (
                <tr key={row.id} className="border-b border-border">
                  <th
                    scope="row"
                    className="py-4 pr-4 text-[0.9375rem] font-semibold text-foreground"
                  >
                    {row.label}
                  </th>
                  {ENGAGEMENT_COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-4 align-top">
                      <MatrixCellText value={row[col.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked */}
        <div className="mt-10 space-y-8 md:hidden">
          {ENGAGEMENT_COLUMNS.map((col) => (
            <div key={col.key} className="border-t border-border pt-6">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {col.label}
              </h3>
              <ul className="mt-4 space-y-3">
                {scopeMatrixRows.map((row: ScopeMatrixRow) => (
                  <li
                    key={row.id}
                    className="flex items-baseline justify-between gap-4 text-[0.9375rem]"
                  >
                    <span className="font-medium text-foreground">
                      {row.label}
                    </span>
                    <MatrixCellText value={row[col.key]} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function PricingScopeLevers() {
  return (
    <Section tone="muted">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
              What Can Reduce Project Scope?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Clearer inputs often mean less uncertainty — and a more focused
              build.
            </p>
            <ul className="mt-6 space-y-2.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {reduceScopeItems.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
              What Can Make a Project Larger?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              These are common scope drivers — not scare tactics.
            </p>
            <ul className="mt-6 space-y-2.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {increaseScopeItems.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-border-strong" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function PricingProcess() {
  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow="How we work"
          title="How We Scope a Project"
          description="We look at requirements before recommending the level of work — not the largest engagement by default."
        />
        <ol className="mt-10 grid gap-0 border-t border-border sm:grid-cols-2 lg:grid-cols-3">
          {processSteps.map((step, index) => (
            <li
              key={step.id}
              className={cn(
                "border-b border-border py-7 sm:px-6 sm:py-8",
                index % 2 === 0 && "sm:border-r",
                index < 3 && "lg:border-r",
                (index + 1) % 3 === 0 && "lg:border-r-0",
              )}
            >
              <p className="font-display text-3xl font-semibold tracking-tight text-accent-text">
                {step.number}
              </p>
              <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

export function PricingBriefAndReview() {
  return (
    <Section tone="muted">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="max-w-xl">
            <p className="eyebrow">Project brief</p>
            <h2 className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight sm:text-[2rem]">
              Want to Organize Requirements Before Speaking With Us?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              The Website Project Brief Template helps clarify goals, audience,
              pages, content, functionality, platform, SEO and timing — without
              an account, and without sending answers to Smartlance unless you
              choose to. Still deciding what kind of project you need?{" "}
              <Link
                href="/project-planner"
                className="font-semibold text-accent-text hover:underline"
              >
                Plan Your Project
              </Link>{" "}
              first.
            </p>
            <Button asChild className="mt-6">
              <Link href="/templates/website-project-brief-template">
                Use the Project Brief Template
              </Link>
            </Button>
          </div>
          <div className="max-w-xl border-t border-border pt-10 lg:border-t-0 lg:border-l lg:pl-14 lg:pt-0">
            <p className="eyebrow">Existing websites</p>
            <h2 className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight sm:text-[2rem]">
              Already Have a Website?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              If you are unsure whether you need improvement, redesign or a
              broader rebuild, a free website review can help identify what is
              worth looking at first.
            </p>
            <p className="mt-3 text-sm text-subtle">
              Starting from zero? Use the new-business path below instead — the
              review is for existing sites.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/free-website-review">Get a Free Website Review</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function PricingPracticalNotes() {
  return (
    <Section>
      <Container>
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-[1.5rem] font-semibold tracking-tight sm:text-[1.75rem]">
              Can a Website Project Be Phased?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Sometimes. A project can separate launch essentials from
              post-launch improvements and ongoing growth — for example core
              website first, then content expansion, then conversion or SEO
              work. Phasing should not mean shipping a broken foundation.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Prefer a focused launch scope over shipping incomplete essentials.
            </p>
          </div>
          <div>
            <h2 className="font-display text-[1.5rem] font-semibold tracking-tight sm:text-[1.75rem]">
              What If the Scope Changes?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Projects evolve. If a request materially changes deliverables,
              complexity, timeline or integrations, it should be reviewed before
              being added to scope — so the proposal stays honest about what is
              and isn&apos;t included.
            </p>
          </div>
          <div>
            <h2 className="font-display text-[1.5rem] font-semibold tracking-tight sm:text-[1.75rem]">
              Some Costs Come From the Platform or Other Providers
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Hosting, domains, platform subscriptions, apps, email tools,
              booking systems, payment processors, stock media and similar
              services may sit outside Smartlance fees. Responsibilities are
              clarified during scoping because they differ by platform and
              project.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-subtle">
              {thirdPartyCostItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-[1.5rem] font-semibold tracking-tight sm:text-[1.75rem]">
              What Affects Project Timing?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Timing depends on scope, content readiness, feedback, stakeholders,
              integrations, migrations and launch dependencies. Payment terms
              are included in the project proposal before work begins.
            </p>
            <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-muted">
              {timelineFactors.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-2xl border-t border-border pt-10">
          <h2 className="font-display text-[1.5rem] font-semibold tracking-tight sm:text-[1.75rem]">
            You&apos;re Not Just Paying for Pages
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Useful website investment often includes thinking, architecture,
            design decisions, development, testing, risk reduction, SEO
            handling, integration work, documentation and launch — not only
            how many URLs appear in a sitemap.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Do you need a budget figure before contacting us? No exact amount is
            required to start a conversation. Sharing approximate constraints
            can help determine scope, priorities and phasing.
          </p>
        </div>
      </Container>
    </Section>
  );
}

export function PricingEntryPoints() {
  const items = [
    entryPoints.startingFromZero,
    entryPoints.existingWebsite,
    entryPoints.planningRedesign,
    entryPoints.unsurePlatform,
  ];

  return (
    <Section tone="muted">
      <Container>
        <SectionHeader
          eyebrow="Where to start"
          title="Choose the Path That Matches Your Situation"
          description="Useful next steps whether you are starting from zero, improving an existing site, or still clarifying requirements."
        />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex h-full flex-col border border-border bg-surface px-5 py-5 transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-6 sm:py-6"
              >
                <span className="font-display text-lg font-semibold text-foreground group-hover:text-accent-text sm:text-xl">
                  {item.label}
                </span>
                {item.description ? (
                  <span className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                    {item.description}
                  </span>
                ) : null}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text">
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function PricingRelated() {
  return (
    <Section>
      <Container>
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-10">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Related services
            </h2>
            <ul className="mt-5 space-y-3">
              {relatedServices.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="font-semibold text-accent-text hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-accent-text"
                >
                  Explore all services
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Related resources
            </h2>
            <ul className="mt-5 space-y-4">
              {relatedResources.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="font-semibold text-accent-text hover:underline"
                  >
                    {item.label}
                  </Link>
                  {item.description ? (
                    <p className="mt-1 text-sm text-muted">{item.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Related solutions
            </h2>
            <ul className="mt-5 space-y-3">
              {relatedSolutions.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="font-semibold text-accent-text hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function PricingFaqSection() {
  return (
    <Section tone="muted">
      <Container>
        <div className="mx-auto max-w-3xl">
          <SectionHeader
            eyebrow="FAQ"
            title="Common Questions About Website Project Costs"
            description="Answers stay scope-dependent where commercial details vary by project."
          />
          <div className="mt-10">
            <FAQ items={pricingFaqs} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
