import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/components/ui/faq";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { Icon } from "@/components/ui/icon";
import { ServiceDetailVisual } from "@/components/services/detail/service-detail-visual";
import { ServiceProofCard } from "@/components/services/detail/service-proof-card";
import { ServiceViewTracker } from "@/components/services/service-view-tracker";
import type { Service, ServiceCapability, ServiceVisualVariant } from "@/types";
import { getRelatedPublishedServices } from "@/lib/repositories/servicesRepository";
import { getPublishedPlatformBySlug } from "@/lib/repositories/platformsRepository";
import { getProjectBySlug, getVisibleProjects } from "@/data/portfolio";
import { seoServices } from "@/data/seo";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  serviceJsonLd,
} from "@/lib/structured-data";
import { getSolutionsForServiceHref } from "@/lib/site-relationships";
import { ConnectionList } from "@/components/connections/connection-links";
import { cn } from "@/lib/utils";

type ServicePageTemplateProps = {
  service: Service;
  /** @deprecated Prefer service.evaluationItems in data */
  evaluationItems?: string[];
  /** @deprecated Prefer service.platformsNote in data */
  platformsNote?: string;
  /** @deprecated Prefer service.audience in data */
  audience?: string;
};

function fallbackCapabilities(service: Service): ServiceCapability[] {
  const fromDeliverables = (service.deliverables ?? []).slice(0, 4).map((title) => ({
    title,
    description: service.summary,
    icon: service.icon,
  }));
  if (fromDeliverables.length >= 4) return fromDeliverables;
  return [
    {
      title: service.title,
      description: service.summary,
      icon: service.icon,
    },
    ...fromDeliverables,
  ].slice(0, 4);
}

function resolveProjects(service: Service) {
  if (service.relatedProjectSlugs && service.relatedProjectSlugs.length > 0) {
    return service.relatedProjectSlugs
      .map((slug) => getProjectBySlug(slug))
      .filter((project): project is NonNullable<typeof project> => Boolean(project))
      .slice(0, 3);
  }

  return getVisibleProjects()
    .filter((project) => project.relatedServiceHrefs?.includes(service.href))
    .slice(0, 3);
}

export async function ServicePageTemplate({
  service,
  evaluationItems: evaluationProp,
  platformsNote: platformsNoteProp,
  audience: audienceProp,
}: ServicePageTemplateProps) {
  const related = (
    await getRelatedPublishedServices(service.relatedServiceSlugs ?? [])
  ).slice(0, 4);
  const relatedSeo = seoServices
    .filter((item) => service.relatedSeoSlugs?.includes(item.slug))
    .slice(0, 2);
  const relatedSolutions = getSolutionsForServiceHref(service.href, 3);
  const relatedExpertise = [
    ...related.map((item) => ({
      slug: item.slug,
      title: item.title,
      href: item.href,
      summary: item.summary,
      icon: item.icon,
    })),
    ...relatedSeo.map((item) => ({
      slug: item.slug,
      title: item.title,
      href: item.href,
      summary: item.summary,
      icon: item.icon,
    })),
  ].slice(0, 4);

  const capabilities =
    service.capabilities && service.capabilities.length > 0
      ? service.capabilities
      : fallbackCapabilities(service);

  const relatedPlatforms = (
    await Promise.all(
      (service.relatedPlatformSlugs ?? []).map((slug) =>
        getPublishedPlatformBySlug(slug),
      ),
    )
  ).filter(
    (platform): platform is NonNullable<typeof platform> => Boolean(platform),
  );

  const tagline = service.tagline || service.summary;
  const narrativeTitle =
    service.narrativeTitle ||
    `How Smartlance Approaches ${service.shortTitle || service.title}`;
  const narrative = service.narrative || service.description;
  const audience = service.audience || audienceProp;
  const evaluationItems = service.evaluationItems || evaluationProp;
  const platformsNote = service.platformsNote || platformsNoteProp;
  const idealFor = service.idealFor?.length
    ? service.idealFor
    : service.problems?.slice(0, 5);
  const visualVariant: ServiceVisualVariant =
    service.visualVariant || "design";
  const relatedProjects = resolveProjects(service);
  const heroProject = relatedProjects[0] ?? getVisibleProjects().find((p) =>
    p.relatedServiceHrefs?.includes(service.href),
  );
  const heroImage = heroProject?.heroImage || heroProject?.image;
  const ctaTitle =
    service.ctaTitle ||
    `Ready to Talk About ${service.shortTitle || service.title}?`;
  const ctaDescription =
    service.ctaDescription ||
    "Tell us about your goals and current site. We will recommend a clear, practical next step.";
  const primaryCtaLabel = service.primaryCtaLabel || "Schedule a Free Call";
  const primaryCtaHref = service.primaryCtaHref || "/contact";
  const secondaryCtaLabel =
    service.secondaryCtaLabel || "Get a Free Website Review";
  const secondaryCtaHref =
    service.secondaryCtaHref || "/free-website-review";

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: service.title, path: service.href },
          ]),
          serviceJsonLd({
            name: service.title,
            description: service.description,
            path: service.href,
          }),
          ...(service.faqs?.length ? [faqJsonLd(service.faqs)] : []),
        ]}
      />

      {/* Hero */}
      <Section className="!pt-10 !pb-12 sm:!pb-14">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Services", href: "/services" },
              { label: service.title },
            ]}
          />
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 xl:gap-16">
            <div className="order-1 min-w-0">
              <p className="eyebrow">{service.shortTitle || service.title}</p>
              <h1 className="heading-section mt-3 font-display font-semibold">
                {service.title}
              </h1>
              <p className="mt-4 text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                {tagline}
              </p>
              <p className="mt-5 max-w-[36rem] text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {service.description}
              </p>
              {audience ? (
                <p className="mt-4 text-[0.9375rem] font-medium text-foreground">
                  Best for: {audience}
                </p>
              ) : null}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link href={primaryCtaHref}>{primaryCtaLabel}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={secondaryCtaHref}>{secondaryCtaLabel}</Link>
                </Button>
              </div>
            </div>

            <div className="order-2">
              <ServiceDetailVisual
                variant={visualVariant}
                title={service.title}
                projectImage={heroImage}
                projectImageAlt={heroProject?.imageAlt}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Problems */}
      {service.problems?.length ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:gap-16">
              <div>
                <p className="eyebrow">What this solves</p>
                <h2 className="heading-section mt-3 font-display font-semibold">
                  Problems this service addresses
                </h2>
                <p className="mt-4 max-w-[36rem] text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                  If several of these sound familiar, you are in the right place.
                </p>
              </div>
              <ul className="grid gap-0 sm:grid-cols-2">
                {service.problems.map((problem, index) => (
                  <li
                    key={problem}
                    className="border-t border-border py-5 sm:odd:pr-6 sm:even:pl-6 sm:[&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+2)]:pt-0 lg:odd:border-r"
                  >
                    <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-2 text-base leading-relaxed text-foreground">
                      {problem}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Capabilities — dark break */}
      <Section tone="dark" className="!py-12 sm:!py-14 lg:!py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
            <SectionHeader
              eyebrow="What is included"
              title={`What ${service.shortTitle || service.title} includes`}
              description="Practical capabilities — not a generic feature checklist."
              dark
            />
            <ul className="divide-y divide-white/12 border-y border-white/12">
              {capabilities.map((item, index) => (
                <li key={item.title} className="flex gap-4 py-5 sm:py-6">
                  <span className="font-display text-lg font-semibold tabular-nums text-orange-300 sm:text-xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                        <Icon name={item.icon} className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-white sm:text-xl">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-white/70 sm:text-base">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Narrative + SEO connection */}
      <Section className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="eyebrow">Approach</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                {narrativeTitle}
              </h2>
            </div>
            <div className="lg:col-span-7">
              <p className="text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {narrative}
              </p>
              {service.seoConnection ? (
                <p className="mt-5 border-l-2 border-accent pl-4 text-base leading-[1.65] text-foreground sm:text-[1.0625rem]">
                  {service.seoConnection}
                </p>
              ) : null}
              {platformsNote ? (
                <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {platformsNote}
                </p>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>

      {/* Deliverables */}
      {service.deliverables?.length ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container>
            <SectionHeader
              eyebrow="Deliverables"
              title="What you receive"
              description="Clear outputs so you know what is being produced and why."
            />
            <ul className="mt-10 grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
              {service.deliverables.slice(0, 6).map((item, index) => (
                <li
                  key={item}
                  className="border-b border-r border-border px-5 py-6 sm:px-6 lg:py-7"
                >
                  <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-base font-medium leading-snug text-foreground sm:text-[1.0625rem]">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Evaluation (redesign) */}
      {evaluationItems?.length ? (
        <Section className="!py-12 sm:!py-14">
          <Container>
            <SectionHeader
              eyebrow="Redesign"
              title="What we evaluate before redesigning"
              description="A redesign should start with diagnosis — not assumptions."
            />
            <div className="mt-10 grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
              {evaluationItems.map((item, index) => (
                <div
                  key={item}
                  className="border-t border-border py-5 sm:odd:pr-6 sm:even:pl-6 lg:odd:border-r lg:py-6"
                >
                  <span className="font-display text-sm font-semibold tabular-nums text-accent-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-[0.9375rem] font-medium leading-snug text-foreground sm:text-base">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Ideal for */}
      {idealFor?.length ? (
        <Section
          tone={evaluationItems?.length ? "muted" : "default"}
          className="!py-12 sm:!py-14"
        >
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:gap-16">
              <div>
                <p className="eyebrow">Fit</p>
                <h2 className="heading-section mt-3 font-display font-semibold">
                  When this service is the right fit
                </h2>
                <p className="mt-4 max-w-[36rem] text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                  Use these scenarios as a practical guide — not a rigid checklist.
                </p>
              </div>
              <ul className="border-t border-border">
                {idealFor.map((item, index) => (
                  <li
                    key={item}
                    className="flex gap-4 border-b border-border py-5"
                  >
                    <span className="font-display text-lg font-semibold tabular-nums text-accent-text">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="pt-0.5 text-base leading-relaxed text-foreground sm:text-[1.0625rem]">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Process */}
      {service.process?.length ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container>
            <SectionHeader
              eyebrow="Process"
              title="How we approach it"
              description="A clear sequence from understanding the business to delivering something useful."
            />
            <ol
              className={cn(
                "mt-10 hidden gap-x-8 gap-y-10 md:grid",
                service.process.length <= 4
                  ? "md:grid-cols-2 lg:grid-cols-4"
                  : "md:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {service.process.map((step, index) => (
                <li key={step.title} className="border-t border-border pt-6">
                  <span className="font-display text-3xl font-semibold tabular-nums text-accent-text sm:text-4xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-muted">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
            <ol className="relative mt-10 space-y-0 pl-10 md:hidden">
              <div
                className="absolute bottom-2 left-[1.125rem] top-2 w-px bg-border"
                aria-hidden
              />
              {service.process.map((step, index) => (
                <li key={step.title} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface font-display text-xs font-semibold text-accent-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      ) : null}

      {/* Related solutions — problem paths this capability often supports */}
      {relatedSolutions.length > 0 ? (
        <Section tone="muted" className="!py-10 sm:!py-12">
          <Container>
            <ConnectionList
              eyebrow="Relevant problems"
              title="Solutions this service often supports"
              description="If you recognize the business problem first, these paths explain the issue before the capability."
              items={relatedSolutions}
            />
          </Container>
        </Section>
      ) : null}

      {/* Related work */}
      {relatedProjects.length > 0 ? (
        <Section className="!py-12 sm:!py-14">
          <Container>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                eyebrow="Work"
                title="Related work"
                description="Real projects where this capability supported the outcome."
              />
              <Button asChild variant="outline" className="shrink-0 self-start">
                <Link href="/work">View all work</Link>
              </Button>
            </div>
            <div
              className={cn(
                "mt-10 grid gap-6",
                relatedProjects.length === 1
                  ? "max-w-2xl"
                  : relatedProjects.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {relatedProjects.map((project) => (
                <ServiceProofCard key={project.slug} project={project} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Related platforms — dynamic density */}
      {relatedPlatforms.length > 0 ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container>
            {relatedPlatforms.length === 1 ? (
              <div className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div className="max-w-2xl">
                  <p className="eyebrow">Related platform</p>
                  <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
                    Built on {relatedPlatforms[0].name}?
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted sm:text-[1.0625rem]">
                    Smartlance also provides {relatedPlatforms[0].name}{" "}
                    development, SEO foundations and ongoing website support when
                    that platform is the right fit.
                  </p>
                </div>
                <Button asChild className="shrink-0 self-start">
                  <Link href={relatedPlatforms[0].href}>
                    Explore {relatedPlatforms[0].name}
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <SectionHeader
                  eyebrow="Platforms"
                  title="Related platforms"
                  description="Platform-specific design, development and optimization support."
                />
                <ul
                  className={cn(
                    "mt-8 grid gap-4",
                    relatedPlatforms.length === 2
                      ? "sm:grid-cols-2"
                      : "sm:grid-cols-2 lg:grid-cols-3",
                  )}
                >
                  {relatedPlatforms.map((platform) => (
                    <li key={platform.slug}>
                      <Link
                        href={platform.href}
                        className="group flex h-full flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent"
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
                          <Icon name={platform.icon} className="h-4 w-4" />
                        </span>
                        <span className="mt-4 font-display text-xl font-semibold group-hover:text-accent-text">
                          {platform.name}
                        </span>
                        <span className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-muted">
                          {platform.summary}
                        </span>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text">
                          Explore {platform.name}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Container>
        </Section>
      ) : null}

      {/* Related services */}
      {relatedExpertise.length > 0 ? (
        <Section className="!py-12 sm:!py-14">
          <Container>
            <SectionHeader
              eyebrow="Related"
              title="Services that work well together"
              description="Capabilities that often support this service."
            />
            <ul
              className={cn(
                "mt-10 grid gap-0 border-t border-border",
                relatedExpertise.length >= 4
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {relatedExpertise.map((item) => (
                <li
                  key={item.slug}
                  className="border-b border-border py-6 sm:odd:border-r sm:px-6 lg:py-7"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-accent-text ring-1 ring-border">
                      <Icon name={item.icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-semibold sm:text-xl">
                        <Link
                          href={item.href}
                          className="hover:text-accent-text"
                        >
                          {item.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                        {item.summary}
                      </p>
                      <Link
                        href={item.href}
                        className="group mt-3 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
                      >
                        Explore {item.title}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* FAQ */}
      {service.faqs?.length ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container size="reading">
            <SectionHeader
              eyebrow="FAQ"
              title="Questions"
              description={`Common questions about ${service.shortTitle || service.title.toLowerCase()}.`}
            />
            <div className="mt-8">
              <FAQ items={service.faqs} />
            </div>
          </Container>
        </Section>
      ) : null}

      <CTASection
        title={ctaTitle}
        description={ctaDescription}
        primaryLabel={primaryCtaLabel}
        primaryHref={primaryCtaHref}
        secondaryLabel={secondaryCtaLabel}
        secondaryHref={secondaryCtaHref}
      />
      <ServiceViewTracker slug={service.slug} />
    </>
  );
}
