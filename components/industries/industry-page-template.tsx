import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { Icon } from "@/components/ui/icon";
import { ProjectCard } from "@/components/ui/project-card";
import { getPublishedSolutionBySlug } from "@/lib/repositories/solutionsRepository";
import { loadPublishedWork } from "@/lib/content/phase3-public";
import {
  breadcrumbJsonLd,
  webPageJsonLd,
} from "@/lib/structured-data";
import type { IndustryPublicDetail, Project, Solution } from "@/types";

type IndustryPageTemplateProps = {
  industry: IndustryPublicDetail;
};

export async function IndustryPageTemplate({
  industry,
}: IndustryPageTemplateProps) {
  const allWork = await loadPublishedWork();
  const workBySlug = new Map(allWork.map((project) => [project.slug, project]));

  const relatedProjects =
    industry.hasVerifiedProjectExperience && industry.projectSlugs?.length
      ? industry.projectSlugs
          .map((slug) => workBySlug.get(slug))
          .filter((project): project is Project => Boolean(project))
      : [];

  const relatedSolutions = (
    await Promise.all(
      industry.relatedSolutionSlugs.map((slug) => getPublishedSolutionBySlug(slug)),
    )
  ).filter((solution): solution is Solution => Boolean(solution));

  const statusLabel =
    industry.hasVerifiedProjectExperience && relatedProjects.length > 0
      ? "Project experience"
      : industry.group === "proven"
        ? "Sector focus"
        : "Business support";

  const pageDescription = industry.description;

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Industries", path: "/industries" },
            { name: industry.name, path: `/industries/${industry.slug}` },
          ]),
          webPageJsonLd({
            name: industry.name,
            description: pageDescription,
            path: `/industries/${industry.slug}`,
          }),
        ]}
      />

      <section className="border-b border-border bg-surface-muted">
        <Container className="!pt-10 !pb-12 sm:!pb-14 lg:!pb-16">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Industries", href: "/industries" },
              { label: industry.name },
            ]}
          />

          <div className="mt-8 max-w-3xl">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-text">
                <Icon name={industry.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="eyebrow">{statusLabel}</p>
                <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
                  {industry.name}
                </h1>
              </div>
            </div>
            <p className="mt-6 text-base leading-[1.75] text-muted sm:text-lg">
              {pageDescription}
            </p>
          </div>
        </Container>
      </section>

      <Section className="!py-14 sm:!py-16">
        <Container>
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Why websites in this sector matter
            </h2>
            <p className="mt-4 text-base leading-[1.75] text-muted sm:text-[1.0625rem]">
              {industry.hasVerifiedProjectExperience
                ? "Customers in this sector compare options carefully before they enquire or book. Your website needs to explain what you offer, build trust quickly, and make the next step obvious."
                : "Businesses in this sector still need clear positioning, trustworthy structure, and pages that match how customers search and decide — even when the buying journey differs from hospitality or property."}
            </p>
          </div>
        </Container>
      </Section>

      {industry.relatedServices?.length ? (
        <Section tone="muted" className="!py-14 sm:!py-16">
          <Container>
            <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Relevant services
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {industry.relatedServices.map((service) => (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className="group flex h-full flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent/40 hover:bg-accent-soft/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="font-display text-lg font-semibold text-foreground group-hover:text-accent-text">
                      {service.label}
                    </span>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text">
                      Explore service
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-[3px] motion-reduce:transition-none" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {relatedSolutions.length > 0 ? (
        <Section className="!py-14 sm:!py-16">
          <Container>
            <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Relevant solutions
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {relatedSolutions.map((solution) => (
                <li key={solution.slug}>
                  <Link
                    href={`/solutions/${solution.slug}`}
                    className="group block rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent/40 hover:bg-accent-soft/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <p className="font-display text-lg font-semibold text-foreground group-hover:text-accent-text">
                      {solution.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {solution.shortDescription}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {relatedProjects.length > 0 ? (
        <Section tone="muted" className="!py-14 sm:!py-16">
          <Container>
            <div className="max-w-2xl">
              <p className="eyebrow">Verified work</p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-foreground sm:text-3xl">
                Published Smartlance projects
              </h2>
              <p className="mt-4 text-base leading-[1.7] text-muted">
                These case studies are linked to this industry in Smartlance
                records — not inferred from page titles alone.
              </p>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProjects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <CTASection
        title="Tell Us About Your Project"
        description={
          industry.hasVerifiedProjectExperience
            ? "Share how your business works and what you need your website to achieve next."
            : "Describe your sector, goals and current website challenges — we will suggest a sensible next step."
        }
        primaryLabel="Tell Us About Your Project"
        primaryHref="/contact"
        secondaryLabel="Explore Services"
        secondaryHref="/services"
      />
    </>
  );
}
