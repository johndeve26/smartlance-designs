import { SiteImage } from "@/components/ui/site-image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Icon } from "@/components/ui/icon";
import { ProjectCard } from "@/components/ui/project-card";
import { BrowserFrame } from "@/components/work/case-study/case-study-hero";
import {
  featuredIndustryGroups,
  industriesExperienceStatement,
  industryFundamentals,
  industryJourneys,
  supportedIndustries,
  type FeaturedIndustryGroup,
} from "@/data/industries";
import type { Project } from "@/types";
import { cn } from "@/lib/utils";

type IndustriesHeroProps = {
  projects: Project[];
};

export function IndustriesHero({ projects }: IndustriesHeroProps) {
  const collage = projects.slice(0, 3);

  return (
    <section className="border-b border-border bg-surface-muted">
      <Container className="!pt-10 !pb-12 sm:!pb-14 lg:!pb-16">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Industries" }]}
        />

        <div className="mt-8 grid items-end gap-10 lg:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] lg:gap-14">
          <div className="min-w-0">
            <p className="eyebrow">Industry Experience</p>
            <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              Digital Experiences Built Around How Your Business Works
            </h1>
            <p className="mt-5 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
              Different businesses have different customer journeys. We adapt
              website structure, design, SEO and conversion strategy around how
              your customers actually search, compare and take action.
            </p>
          </div>

          {collage.length > 0 ? (
            <div className="relative mx-auto hidden w-full max-w-md lg:mx-0 lg:block lg:max-w-none">
              <IndustryHeroCollage projects={collage} />
            </div>
          ) : null}
        </div>

        <p className="mt-10 max-w-3xl border-t border-border pt-8 text-[1.0625rem] leading-[1.7] text-foreground sm:text-lg">
          {industriesExperienceStatement}
        </p>
      </Container>
    </section>
  );
}

function IndustryHeroCollage({ projects }: { projects: Project[] }) {
  const [primary, secondary, tertiary] = projects;

  return (
    <div className="relative aspect-[5/4]">
      {primary ? (
        <div className="absolute inset-x-[8%] top-0 z-[1] overflow-hidden rounded-lg border border-border bg-surface shadow-md">
          <div className="relative aspect-[16/10]">
            <SiteImage
              src={primary.image || primary.heroImage || ""}
              alt={primary.imageAlt ?? primary.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 0px, 420px"
              priority
            />
          </div>
        </div>
      ) : null}
      {secondary ? (
        <div className="absolute bottom-[6%] left-0 z-[2] w-[48%] overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="relative aspect-[4/3]">
            <SiteImage
              src={secondary.image || secondary.heroImage || ""}
              alt={secondary.imageAlt ?? secondary.name}
              fill
              className="object-cover object-top"
              sizes="200px"
            />
          </div>
        </div>
      ) : null}
      {tertiary ? (
        <div className="absolute bottom-0 right-0 z-[3] w-[46%] overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="relative aspect-[4/3]">
            <SiteImage
              src={tertiary.image || tertiary.heroImage || ""}
              alt={tertiary.imageAlt ?? tertiary.name}
              fill
              className="object-cover object-top"
              sizes="200px"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

type FeaturedGroupsProps = {
  projectsBySlug: Map<string, Project>;
};

export function IndustriesFeaturedExperience({
  projectsBySlug,
}: FeaturedGroupsProps) {
  const feature = featuredIndustryGroups.find((g) => g.layout === "feature");
  const halves = featuredIndustryGroups.filter((g) => g.layout === "half");

  return (
    <>
      {feature ? (
        <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
          <Container>
            <div className="mb-12 max-w-2xl sm:mb-14">
              <p className="eyebrow">Proven experience</p>
              <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl lg:text-[2.5rem]">
                Industries With Project Experience
              </h2>
              <p className="mt-4 text-base leading-[1.7] text-muted sm:text-[1.0625rem]">
                These sectors are backed by published Smartlance work — not just
                categories we can theoretically support.
              </p>
            </div>
            <FeaturedIndustryBlock
              group={feature}
              projects={resolveProjects(feature.projectSlugs, projectsBySlug)}
              large
            />
          </Container>
        </Section>
      ) : null}

      {halves.length > 0 ? (
        <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
          <Container>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-10 xl:gap-14">
              {halves.map((group) => (
                <FeaturedIndustryBlock
                  key={group.id}
                  group={group}
                  projects={resolveProjects(group.projectSlugs, projectsBySlug)}
                />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  );
}

function FeaturedIndustryBlock({
  group,
  projects,
  large = false,
}: {
  group: FeaturedIndustryGroup;
  projects: Project[];
  large?: boolean;
}) {
  const lead = projects[0];
  const supporting = projects.slice(1, large ? 3 : 2);

  return (
    <article>
      <p className="eyebrow">Project experience</p>
      <h2
        className={cn(
          "mt-3 font-display font-semibold leading-tight tracking-tight text-foreground",
          large
            ? "text-[1.875rem] sm:text-4xl lg:text-[2.75rem]"
            : "text-[1.625rem] sm:text-3xl",
        )}
      >
        {group.title}
      </h2>
      <p
        className={cn(
          "mt-4 text-base leading-[1.7] text-muted sm:text-[1.0625rem]",
          large ? "max-w-2xl" : "max-w-xl",
        )}
      >
        {group.summary}
      </p>

      {lead ? (
        <div
          className={cn(
            "mt-8",
            large && "grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:gap-5",
          )}
        >
          <Link
            href={`/work/${lead.slug}`}
            className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`View case study: ${lead.name}`}
          >
            <BrowserFrame>
              <div
                className={cn(
                  "relative bg-surface-muted",
                  large ? "aspect-[16/10]" : "aspect-[16/10]",
                )}
              >
                <SiteImage
                  src={lead.heroImage || lead.image || ""}
                  alt={lead.imageAlt ?? lead.name}
                  fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transition-none"
                  sizes={
                    large
                      ? "(max-width: 1024px) 100vw, 70vw"
                      : "(max-width: 1024px) 100vw, 50vw"
                  }
                />
              </div>
            </BrowserFrame>
            <p className="mt-3 text-sm font-medium text-muted">
              {lead.name}
              {lead.industry ? (
                <span className="text-subtle"> · {lead.industry}</span>
              ) : null}
            </p>
          </Link>

          {large && supporting.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {supporting.map((project) => (
                <Link
                  key={project.slug}
                  href={`/work/${project.slug}`}
                  className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label={`View case study: ${project.name}`}
                >
                  <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
                    <div className="relative aspect-[16/10]">
                      <SiteImage
                        src={project.image || project.heroImage || ""}
                        alt={project.imageAlt ?? project.name}
                        fill
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transition-none"
                        sizes="(max-width: 1024px) 50vw, 22vw"
                      />
                    </div>
                  </div>
                  <p className="mt-2.5 text-sm font-medium text-muted">
                    {project.name}
                  </p>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {!large && supporting[0] ? (
        <Link
          href={`/work/${supporting[0].slug}`}
          className="group mt-4 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={`View case study: ${supporting[0].name}`}
        >
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="relative aspect-[16/10]">
              <SiteImage
                src={supporting[0].image || supporting[0].heroImage || ""}
                alt={supporting[0].imageAlt ?? supporting[0].name}
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transition-none"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
          <p className="mt-2.5 text-sm font-medium text-muted">
            {supporting[0].name}
            {supporting[0].industry ? (
              <span className="text-subtle"> · {supporting[0].industry}</span>
            ) : null}
          </p>
        </Link>
      ) : null}

      <div className={cn("mt-8", large && "grid gap-10 lg:grid-cols-2 lg:gap-14")}>
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground sm:text-xl">
            Typical website needs
          </h3>
          <ul className="mt-4 space-y-2.5">
            {group.needs.map((need) => (
              <li
                key={need}
                className="flex gap-3 text-[0.9375rem] leading-snug text-muted sm:text-base"
              >
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  aria-hidden
                />
                <span>{need}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={cn(!large && "mt-8")}>
          {projects.length > 0 ? (
            <>
              <h3 className="font-display text-lg font-semibold text-foreground sm:text-xl">
                Related projects
              </h3>
              <ul className="mt-4 space-y-3">
                {projects.map((project) => (
                  <li key={project.slug}>
                    <Link
                      href={`/work/${project.slug}`}
                      className="group inline-flex items-center gap-1.5 text-base font-semibold text-foreground hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {project.name}
                      <ArrowRight className="h-4 w-4 text-accent-text transition-transform group-hover:translate-x-[3px] motion-reduce:transition-none" />
                    </Link>
                    {project.industry ? (
                      <p className="mt-0.5 text-sm text-subtle">
                        {project.industry}
                        {project.services[0]
                          ? ` · ${project.services.slice(0, 2).join(" · ")}`
                          : null}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {group.services.length > 0 ? (
            <div className={cn(projects.length > 0 ? "mt-8" : "mt-0")}>
              <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                Relevant services
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {group.services.map((service) => (
                  <li key={service.href}>
                    <Link
                      href={service.href}
                      className="text-sm font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {service.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function IndustriesJourneys() {
  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Adaptation</p>
          <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl lg:text-[2.5rem]">
            Different Businesses Need Different Website Journeys
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-muted sm:text-[1.0625rem]">
            The fundamentals stay consistent. The journey changes with how
            customers discover, compare and decide.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-1 border-l border-t border-border sm:grid-cols-2">
          {industryJourneys.map((item) => (
            <li
              key={item.label}
              className="border-b border-r border-border px-5 py-7 sm:px-7 sm:py-8"
            >
              <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
                {item.label}
              </p>
              <p className="mt-3 max-w-sm text-base leading-snug text-foreground sm:text-[1.0625rem]">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function IndustriesSupporting() {
  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Broader support</p>
          <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl">
            Other Businesses We Can Support
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-muted sm:text-[1.0625rem]">
            Smartlance is not limited to the sectors above. These are common
            business types where the same clarity, discoverability and
            conversion principles apply — adapted to how each business works.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {supportedIndustries.map((item) => (
            <li
              key={item.slug}
              className="flex flex-col bg-surface-muted px-5 py-6 sm:px-6 sm:py-7"
            >
              <Link
                href={`/industries/${item.slug}`}
                className="group flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-text">
                    <Icon name={item.icon} className="h-4 w-4" />
                  </span>
                  <h3 className="pt-1.5 font-display text-base font-semibold leading-snug text-foreground group-hover:text-accent-text sm:text-lg">
                    {item.name}
                  </h3>
                </div>
                <p className="mt-3 flex-1 text-[0.9375rem] leading-[1.65] text-muted sm:text-base">
                  {item.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text">
                  Explore {item.name}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-[3px] motion-reduce:transition-none" />
                </span>
              </Link>
              {item.relatedServices?.length ? (
                <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border pt-4">
                  {item.relatedServices.slice(0, 3).map((service) => (
                    <li key={service.href}>
                      <Link
                        href={service.href}
                        className="text-sm font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {service.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function IndustriesSelectedWork({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <Section className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Proof</p>
            <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl lg:text-[2.5rem]">
              Industry Experience in Practice
            </h2>
            <p className="mt-4 text-base leading-[1.7] text-muted sm:text-[1.0625rem]">
              Real Smartlance projects across property, hospitality and cabin
              rental businesses.
            </p>
          </div>
          <Link
            href="/work"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            View all work
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.slug}
              project={project}
              variant={index === 0 ? "featured" : "default"}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function IndustriesFundamentals() {
  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-16">
          <div>
            <p className="eyebrow">Approach</p>
            <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl">
              The Industry Changes. The Fundamentals Don&apos;t.
            </h2>
            <p className="mt-4 max-w-md text-base leading-[1.7] text-muted sm:text-[1.0625rem]">
              Every business model needs a different execution. Clarity,
              discoverability, trust, performance, conversion and
              maintainability still guide the work.
            </p>
          </div>

          <ol className="grid gap-0 border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {industryFundamentals.map((item, index) => (
              <li
                key={item.title}
                className="border-b border-r border-border px-5 py-6"
              >
                <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-snug text-muted sm:text-[0.9375rem]">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}

function resolveProjects(
  slugs: string[],
  projectsBySlug: Map<string, Project>,
) {
  return slugs
    .map((slug) => projectsBySlug.get(slug))
    .filter((project): project is Project => Boolean(project));
}
