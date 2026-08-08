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
import { SeoDetailVisual } from "@/components/seo/seo-detail-visual";
import { ServiceProofCard } from "@/components/services/detail/service-proof-card";
import type { SeoService } from "@/types";
import { getRelatedServices } from "@/data/services";
import { getRelatedSeoServices } from "@/data/seo";
import { getProjectBySlug } from "@/data/portfolio";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  serviceJsonLd,
} from "@/lib/structured-data";
import { getSolutionsForServiceHref } from "@/lib/site-relationships";
import { ConnectionList } from "@/components/connections/connection-links";
import { cn } from "@/lib/utils";

type SeoPageTemplateProps = {
  service: SeoService;
};

export function SeoPageTemplate({ service }: SeoPageTemplateProps) {
  const related = getRelatedServices(service.relatedServiceSlugs);
  const relatedSeo = getRelatedSeoServices(service.relatedSeoSlugs).filter(
    (item) => item.slug !== service.slug,
  );
  const relatedSolutions = getSolutionsForServiceHref(service.href, 3);
  const relatedExpertise = [
    ...relatedSeo.map((item) => ({
      title: item.title,
      href: item.href,
      summary: item.summary,
      icon: item.icon,
    })),
    ...related.map((item) => ({
      title: item.title,
      href: item.href,
      summary: item.summary,
      icon: item.icon,
    })),
  ].slice(0, 4);

  const projects = (service.relatedProjectSlugs ?? [])
    .map((slug) => getProjectBySlug(slug))
    .filter((project): project is NonNullable<typeof project> => Boolean(project))
    .slice(0, 3);

  const visualVariant = service.visualVariant || "technical";
  const primaryHref = service.primaryCtaHref || "/contact";
  const primaryLabel = service.primaryCtaLabel || "Tell Us About Your Project";
  const secondaryHref = service.secondaryCtaHref || "/free-website-review";
  const secondaryLabel =
    service.secondaryCtaLabel || "Get a Free Website Review";

  const deliverables = service.deliverables?.slice(0, 9) ?? [];

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "SEO", path: "/seo" },
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
      <Section className="!pt-10 !pb-10 sm:!pb-12">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "SEO", href: "/seo" },
              { label: service.title },
            ]}
          />
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 xl:gap-14">
            <div className="order-1 min-w-0">
              <p className="eyebrow">SEO services</p>
              <h1 className="heading-section mt-3 font-display font-semibold">
                {service.title}
              </h1>
              {service.tagline ? (
                <p className="mt-4 max-w-[34rem] text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                  {service.tagline}
                </p>
              ) : null}
              <p className="mt-5 max-w-[34rem] text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                {service.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              </div>
            </div>
            <div className="order-2 lg:pl-2">
              <SeoDetailVisual variant={visualVariant} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Why it matters */}
      {service.whyTitle ? (
        <Section tone="muted" className="!py-12 sm:!py-14 lg:!py-[4.5rem]">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)] lg:gap-16">
              <div>
                <p className="eyebrow">Why it matters</p>
                <h2 className="heading-section mt-3 font-display font-semibold">
                  {service.whyTitle}
                </h2>
                {service.whyBody ? (
                  <p className="mt-4 max-w-[36rem] text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                    {service.whyBody}
                  </p>
                ) : null}
              </div>
              {service.whyPoints?.length ? (
                <ul className="border-t border-border">
                  {service.whyPoints.map((point, index) => (
                    <li
                      key={point}
                      className="flex gap-4 border-b border-border py-5"
                    >
                      <span className="font-display text-lg font-semibold tabular-nums text-accent-text sm:text-xl">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="pt-0.5 text-base leading-relaxed text-foreground sm:text-[1.0625rem]">
                        {point}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Topic groups */}
      <Section className="!py-12 sm:!py-14 lg:!py-[4.5rem]">
        <Container>
          <SectionHeader
            eyebrow="Focus areas"
            title="What this covers"
            description="Practical focus areas — not buzzwords."
          />
          {service.topicGroups?.length ? (
            <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-12">
              {service.topicGroups.map((group, index) => (
                <div key={group.title} className="border-t border-border pt-6">
                  <span className="font-display text-base font-semibold tabular-nums text-accent-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-semibold sm:text-2xl">
                    {group.title}
                  </h3>
                  <p className="mt-2.5 text-base leading-relaxed text-muted">
                    {group.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-base text-foreground"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {service.topics.map((topic) => (
                <li
                  key={topic}
                  className="border-t border-border pt-4 text-base font-medium"
                >
                  {topic}
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>

      {/* Differentiator */}
      {service.differentiatorTitle ? (
        <Section tone="dark" className="!py-12 sm:!py-14 lg:!py-[4.5rem]">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-stretch lg:gap-14">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                  Smartlance approach
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
                  {service.differentiatorTitle}
                </h2>
                {service.differentiatorBody ? (
                  <p className="mt-4 max-w-[36rem] text-base leading-[1.65] text-white/75 sm:text-[1.0625rem]">
                    {service.differentiatorBody}
                  </p>
                ) : null}
              </div>
              {service.differentiatorLinks?.length ? (
                <ul className="flex flex-col justify-center gap-3">
                  {service.differentiatorLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group flex items-center justify-between gap-4 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-4 text-base font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/[0.07]"
                      >
                        <span>{link.label}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Process */}
      {service.process?.length ? (
        <Section tone="muted" className="!py-12 sm:!py-14 lg:!py-[4.5rem]">
          <Container>
            <SectionHeader
              eyebrow="Process"
              title="How we approach it"
              description="A clear sequence from discovery to practical next steps."
            />
            <ol
              className={cn(
                "mt-10 hidden gap-x-8 gap-y-12 md:grid",
                service.process.length === 5
                  ? "md:grid-cols-3"
                  : service.process.length <= 4
                    ? "md:grid-cols-2 lg:grid-cols-4"
                    : "md:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {service.process.map((step, index) => (
                <li key={step.title} className="border-t border-border pt-6">
                  <span className="font-display text-4xl font-semibold tabular-nums text-accent-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold sm:text-[1.35rem]">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-base leading-relaxed text-muted">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
            <ol className="relative mt-10 space-y-0 pl-11 md:hidden">
              <div
                className="absolute bottom-2 left-[1.15rem] top-2 w-px bg-border"
                aria-hidden
              />
              {service.process.map((step, index) => (
                <li key={step.title} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-11 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface font-display text-xs font-semibold text-accent-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-muted">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      ) : null}

      {/* Deliverables */}
      {deliverables.length > 0 ? (
        <Section className="!py-12 sm:!py-14">
          <Container>
            <SectionHeader
              eyebrow="Deliverables"
              title="What you receive"
              description="Clear outputs so you know what the work produces."
            />
            <ul className="mt-10 grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
              {deliverables.map((item, index) => (
                <li
                  key={item}
                  className="border-b border-r border-border px-5 py-6 sm:px-6 lg:py-7"
                >
                  <span className="font-display text-base font-semibold tabular-nums text-accent-text">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2.5 text-base font-semibold leading-snug text-foreground sm:text-[1.0625rem]">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Mid CTA for audit */}
      {service.slug === "seo-audit" ? (
        <Section tone="dark" className="!py-12 sm:!py-14">
          <Container>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                  Ready for clearer SEO priorities?
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-[1.0625rem]">
                  An audit gives you findings, impact and a practical sequence of
                  actions — not a jargon-heavy report.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/contact">Request an SEO Audit</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-transparent text-white hover:border-white hover:bg-white/5 hover:text-white"
                >
                  <Link href="/free-website-review">
                    Get a Free Website Review
                  </Link>
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Ideal for */}
      {service.idealFor?.length ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:gap-16">
              <div>
                <p className="eyebrow">Fit</p>
                <h2 className="heading-section mt-3 font-display font-semibold">
                  Who this is for
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted sm:text-[1.0625rem]">
                  Use these scenarios as a practical guide — not a rigid checklist.
                </p>
              </div>
              <ul className="border-t border-border">
                {service.idealFor.map((item, index) => (
                  <li
                    key={item}
                    className="flex gap-4 border-b border-border py-5"
                  >
                    <span className="font-display text-xl font-semibold tabular-nums text-accent-text">
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

      {/* Proof */}
      {projects.length > 0 ? (
        <Section className="!py-12 sm:!py-14 lg:!py-[4.5rem]">
          <Container>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                eyebrow="Work"
                title={service.proofTitle || "Related website work"}
                description="Verified Smartlance website projects related to architecture, performance and search foundations."
              />
              <Button asChild variant="outline" className="shrink-0 self-start">
                <Link href="/work">View all work</Link>
              </Button>
            </div>
            <div
              className={cn(
                "mt-10 grid gap-6 lg:gap-7",
                projects.length === 1
                  ? "max-w-2xl"
                  : projects.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {projects.map((project) => (
                <ServiceProofCard
                  key={project.slug}
                  project={project}
                  imageClassName="aspect-[16/10] sm:aspect-[3/2]"
                />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Related solutions */}
      {relatedSolutions.length > 0 ? (
        <Section className="!py-10 sm:!py-12">
          <Container>
            <ConnectionList
              eyebrow="Relevant problems"
              title="Solutions this SEO work often supports"
              description="If search visibility is the business problem, these paths explain it before the capability."
              items={relatedSolutions}
            />
          </Container>
        </Section>
      ) : null}

      {/* Related */}
      {relatedExpertise.length > 0 ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container>
            <SectionHeader
              eyebrow="Related"
              title="Related SEO and website services"
              description="Services that often support this work."
            />
            <ul className="mt-10 grid gap-0 border-t border-border sm:grid-cols-2">
              {relatedExpertise.map((item, index) => (
                <li
                  key={item.href}
                  className="border-b border-border py-7 sm:odd:border-r sm:px-7"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-display text-base font-semibold tabular-nums text-accent-text">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-accent-text ring-1 ring-border">
                          <Icon name={item.icon} className="h-4 w-4" />
                        </span>
                        <h3 className="font-display text-xl font-semibold">
                          <Link
                            href={item.href}
                            className="hover:text-accent-text"
                          >
                            {item.title}
                          </Link>
                        </h3>
                      </div>
                      <p className="mt-3 text-base leading-relaxed text-muted">
                        {item.summary}
                      </p>
                      <Link
                        href={item.href}
                        className="group mt-4 inline-flex items-center gap-1.5 text-base font-semibold text-accent-text hover:underline"
                      >
                        Explore {item.title}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
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
        <Section className="!py-12 sm:!py-14 lg:!py-[4.5rem]">
          <Container size="reading">
            <SectionHeader
              eyebrow="FAQ"
              title="Frequently Asked Questions"
            />
            <div className="mt-8">
              <FAQ items={service.faqs} />
            </div>
          </Container>
        </Section>
      ) : null}

      <CTASection
        className="!py-12 sm:!py-14 lg:!py-16"
        title={
          service.ctaTitle || "Want clearer priorities for your SEO?"
        }
        description={
          service.ctaDescription ||
          "Start with a review or audit, then build a practical plan around what will actually move the needle."
        }
        primaryLabel={primaryLabel}
        primaryHref={primaryHref}
        secondaryLabel={secondaryLabel}
        secondaryHref={secondaryHref}
      />
    </>
  );
}
