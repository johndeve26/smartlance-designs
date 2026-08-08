import type { ReactNode } from "react";
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
import { getSolutionBySlug, getSolutionHref } from "@/data/solutions";
import { getProjectBySlug } from "@/data/portfolio";
import { getPostBySlug } from "@/lib/blog";
import { getResourcesForSolution } from "@/lib/site-relationships";
import { ConnectionList } from "@/components/connections/connection-links";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structured-data";
import type { ContrastColumn } from "@/data/solution-pages";
import type { Project, Solution } from "@/types";
import { cn } from "@/lib/utils";

export function SolutionPageChrome({
  solution,
  children,
}: {
  solution: Solution;
  children: ReactNode;
}) {
  const faqs = solution.faqs ?? [];

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
      {children}
    </>
  );
}

export function SolutionHero({
  solution,
  visual,
}: {
  solution: Solution;
  visual: ReactNode;
}) {
  const primaryLabel =
    solution.primaryCtaLabel || "Get a Free Website Review";
  const primaryHref = solution.primaryCtaHref || "/free-website-review";
  const secondaryLabel =
    solution.secondaryCtaLabel || "Tell Us About Your Website";
  const secondaryHref = solution.secondaryCtaHref || "/contact";

  return (
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
            <p className="eyebrow">{solution.eyebrow || solution.name}</p>
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
            {visual}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function ProblemContrast({
  eyebrow,
  title,
  intro,
  left,
  right,
  tone = "muted",
}: {
  eyebrow: string;
  title: string;
  intro: string;
  left: ContrastColumn;
  right: ContrastColumn;
  tone?: "default" | "muted";
}) {
  return (
    <Section tone={tone} className="!py-12 sm:!py-14">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="heading-section mt-3 font-display font-semibold">
            {title}
          </h2>
          <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
            {intro}
          </p>
        </div>
        <div className="mt-10 grid gap-0 border-t border-border md:grid-cols-2">
          <ContrastColumnBlock
            item={left}
            className="border-b border-border md:border-b-0 md:border-r md:pr-10"
          />
          <ContrastColumnBlock item={right} className="md:pl-10" />
        </div>
      </Container>
    </Section>
  );
}

function ContrastColumnBlock({
  item,
  className,
}: {
  item: ContrastColumn;
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

export function DiagnosticFramework({
  eyebrow,
  title,
  description,
  stages,
}: {
  eyebrow: string;
  title: string;
  description: string;
  stages: { title: string; description: string; examples?: string[] }[];
}) {
  return (
    <Section className="!py-12 sm:!py-14 lg:!py-16">
      <Container>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        <ol className="mt-10 flex flex-col gap-0 lg:flex-row lg:items-stretch">
          {stages.map((stage, index) => (
            <li
              key={stage.title}
              className="relative flex flex-1 flex-col border-t border-border py-5 lg:border-t-0 lg:border-l lg:px-3 lg:py-0 xl:px-4 lg:first:border-l-0 lg:first:pl-0"
            >
              <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-display text-lg font-semibold tracking-tight sm:text-xl">
                {stage.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {stage.description}
              </p>
              {stage.examples?.length ? (
                <p className="mt-3 text-sm text-subtle">
                  {stage.examples.join(" · ")}
                </p>
              ) : null}
              {index < stages.length - 1 ? (
                <span
                  className="mt-3 text-accent-text lg:absolute lg:right-0 lg:top-5 lg:mt-0 lg:translate-x-1/2"
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
  );
}

export function NumberedCauseList({
  eyebrow,
  title,
  description,
  causes,
}: {
  eyebrow: string;
  title: string;
  description: string;
  causes: { title: string; description: string }[];
}) {
  return (
    <Section tone="muted" className="!py-12 sm:!py-14 lg:!py-16">
      <Container>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        <ol className="mt-10 border-t border-border">
          {causes.map((cause, index) => (
            <li
              key={cause.title}
              className="grid gap-3 border-b border-border py-6 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-6"
            >
              <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                  {cause.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {cause.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

export function SymptomList({
  eyebrow,
  title,
  description,
  symptoms,
}: {
  eyebrow: string;
  title: string;
  description: string;
  symptoms: string[];
}) {
  return (
    <Section className="!py-12 sm:!py-14">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-14">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              {title}
            </h2>
            <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              {description}
            </p>
          </div>
          <ul className="border-t border-border">
            {symptoms.map((symptom) => (
              <li
                key={symptom}
                className="flex gap-3 border-b border-border py-4 text-[0.9375rem] leading-relaxed text-foreground sm:text-base"
              >
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  aria-hidden
                />
                {symptom}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

export function DecisionSection({
  eyebrow,
  title,
  intro,
  levels,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  levels: { title: string; description: string; items: string[] }[];
}) {
  return (
    <Section className="!py-12 sm:!py-14 lg:!py-16">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="heading-section mt-3 font-display font-semibold">
            {title}
          </h2>
          <p className="mt-4 text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
            {intro}
          </p>
        </div>
        <ol className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {levels.map((level, index) => (
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
  );
}

export function RecommendedServices({
  solution,
  description = "Relevant capabilities once the problem is clearer — not a package to buy before diagnosis.",
}: {
  solution: Solution;
  description?: string;
}) {
  const serviceLinks = (solution.relatedServiceReasons ?? []).slice(0, 4);
  if (serviceLinks.length === 0) return null;

  return (
    <Section className="!py-12 sm:!py-14">
      <Container>
        <SectionHeader
          eyebrow="Capabilities"
          title="Services That May Help"
          description={description}
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
  );
}

export function RelatedWork({
  solution,
  heading = "Related Website Work",
  description = "Selected projects from across hospitality, property and service businesses.",
}: {
  solution: Solution;
  heading?: string;
  description?: string;
}) {
  const projects = (solution.relatedProjectSlugs ?? [])
    .map((slug) => getProjectBySlug(slug))
    .filter((project): project is Project => Boolean(project))
    .slice(0, 3);

  if (projects.length === 0) return null;

  return (
    <Section className="!py-12 sm:!py-14 lg:!py-16">
      <Container>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Work"
            title={heading}
            description={description}
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
  );
}

export function RelatedInsights({ solution }: { solution: Solution }) {
  const articles = (solution.relatedArticleSlugs ?? [])
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is NonNullable<typeof post> => Boolean(post))
    .slice(0, 3);

  if (articles.length === 0) return null;

  return (
    <Section tone="muted" className="!py-12 sm:!py-14">
      <Container>
        <SectionHeader
          eyebrow="Insights"
          title="Related Insights"
          description="Practical reading connected to this problem — not a dump of recent posts."
        />
        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {articles.map((post) => (
            <BlogCard key={post.slug} post={post} variant="editorial" />
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function RelatedGuidance({ solution }: { solution: Solution }) {
  const items = getResourcesForSolution(solution.slug, 4);
  if (items.length === 0) return null;

  return (
    <Section className="!py-10 sm:!py-12">
      <Container>
        <ConnectionList
          eyebrow="Related guidance"
          title="Useful next reading"
          description="Resources that help you understand or prepare for this kind of project."
          items={items}
        />
      </Container>
    </Section>
  );
}

export function SolutionFaq({
  solution,
  title,
  description,
}: {
  solution: Solution;
  title: string;
  description: string;
}) {
  const faqs = solution.faqs ?? [];
  if (faqs.length === 0) return null;

  return (
    <Section className="!py-12 sm:!py-14">
      <Container>
        <SectionHeader eyebrow="FAQ" title={title} description={description} />
        <div className="mx-auto mt-8 max-w-3xl">
          <FAQ items={faqs} />
        </div>
      </Container>
    </Section>
  );
}

export function SolutionFinalCta({ solution }: { solution: Solution }) {
  const primaryLabel =
    solution.primaryCtaLabel || "Get a Free Website Review";
  const primaryHref = solution.primaryCtaHref || "/free-website-review";
  const secondaryLabel =
    solution.secondaryCtaLabel || "Tell Us About Your Project";
  const secondaryHref = solution.secondaryCtaHref || "/contact";

  return (
    <Section tone="dark" className="!py-12 sm:!py-14">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl leading-tight text-white sm:text-4xl">
              {solution.ctaTitle || solution.heroStatement || solution.title}
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
  );
}

export function RelatedSolutions({ solution }: { solution: Solution }) {
  const related = (solution.relatedSolutions ?? [])
    .map((item) => {
      const target = getSolutionBySlug(item.slug);
      if (!target?.published) return null;
      const href = getSolutionHref(target);
      if (!href) return null;
      return { ...item, target, href };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (related.length === 0) return null;

  return (
    <Section className="!py-8 sm:!py-10">
      <Container>
        <ul className="space-y-4 border-t border-border pt-8">
          {related.map((item) => (
            <li key={item.slug}>
              <p className="text-[0.9375rem] text-muted sm:text-base">
                {item.prompt}
              </p>
              <Link
                href={item.href}
                className="group mt-1 inline-flex items-center gap-1.5 text-base font-semibold text-accent-text hover:underline"
              >
                {item.target.title}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function SolutionBackLink() {
  return (
    <Section className="!py-8 sm:!py-10">
      <Container>
        <Link
          href="/solutions"
          className="group inline-flex items-center gap-1.5 text-base font-semibold text-accent-text hover:underline"
        >
          <span
            aria-hidden
            className="transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
          >
            ←
          </span>
          Back to All Solutions
        </Link>
      </Container>
    </Section>
  );
}
