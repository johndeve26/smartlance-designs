import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { ProjectCard } from "@/components/ui/project-card";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { CaseStudyHero } from "@/components/work/case-study/case-study-hero";
import { CaseStudyQuote } from "@/components/work/case-study/case-study-quote";
import {
  CaseStudyApproach,
  CaseStudyArchitectureDiagram,
  CaseStudyChallenge,
  CaseStudyEngineering,
  CaseStudyGallery,
  CaseStudyHighlights,
  CaseStudyIntro,
  CaseStudyNav,
  CaseStudyOutcome,
  CaseStudyPrinciples,
  CaseStudyProductFeatures,
  CaseStudySaasInfrastructure,
  CaseStudyServicesPlatform,
  CaseStudySolution,
} from "@/components/work/case-study/case-study-sections";
import { PortfolioViewTracker } from "@/components/work/portfolio-view-tracker";
import {
  getRelatedProjects,
} from "@/data/portfolio";
import {
  loadPublishedWork,
  loadTestimonialForWork,
  loadWorkBySlug,
} from "@/lib/content/phase3-public";
import {
  getAdjacentProjects,
  getServiceHref,
  resolveCaseStudyContent,
} from "@/lib/case-study";
import { buildPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const projects = await loadPublishedWork();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await loadWorkBySlug(slug);
  if (!project) return {};
  return buildPageMetadata({
    title: project.metaTitle || project.name,
    description: project.metaDescription || project.shortDescription || "",
    path: `/work/${project.slug}`,
    canonicalOverride: project.canonicalOverride,
    noIndex: project.noIndex || !project.published,
    image: project.ogImagePath || project.heroImage || project.image,
  });
}

const SERVICE_BLURBS: Record<string, string> = {
  "Website Design":
    "Clear visual hierarchy and conversion-focused layouts tailored to the business.",
  "Website Development":
    "Responsive builds with maintainable structure for ongoing content updates.",
  SEO: "Search foundations that support discoverability without inventing rankings.",
  "E-commerce": "Store experience and product presentation that support purchase paths.",
  Branding: "Cohesive brand presentation across digital touchpoints.",
  "Website Redesign":
    "A structured refresh that improves clarity, usability and conversion paths.",
};

export default async function CaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await loadWorkBySlug(slug);
  if (!project) notFound();

  const content = resolveCaseStudyContent(project);
  const related = getRelatedProjects(project.relatedSlugs)
    .filter((item) => item.slug !== project.slug)
    .slice(0, 2);
  const { previous, next } = getAdjacentProjects(project.slug);

  const linkedTestimonial = await loadTestimonialForWork(project.slug);

  const feedback =
    linkedTestimonial && linkedTestimonial.quote.trim().length > 0
      ? {
          quote: linkedTestimonial.quote,
          name: linkedTestimonial.name,
          role: [linkedTestimonial.role, linkedTestimonial.company]
            .filter(Boolean)
            .join(", "),
        }
      : project.clientFeedback &&
          !project.clientFeedback.isPlaceholder &&
          project.clientFeedback.quote.trim().length > 0
        ? {
            quote: project.clientFeedback.quote,
            name: project.clientFeedback.name,
            role: project.clientFeedback.role,
          }
        : null;

  const serviceLinks = content.serviceLinks?.length
    ? content.serviceLinks
        .filter((service) => service.label.trim().length > 0)
        .map((service) => ({
          label: service.label,
          href: service.href ?? "",
          description: service.description,
        }))
    : project.services.map((service) => ({
        label: service,
        href:
          project.relatedServiceHrefs?.find((href) =>
            href.includes(service.toLowerCase().replace(/\s+/g, "-")),
          ) || getServiceHref(service),
        description: SERVICE_BLURBS[service],
      }));

  const servicesFromHrefs =
    !content.serviceLinks?.length && project.relatedServiceHrefs
      ? project.relatedServiceHrefs
          .map((href) => {
            const match = serviceLinks.find((item) => item.href === href);
            if (match) return match;
            const label =
              href.includes("website-design")
                ? "Website Design"
                : href.includes("website-development")
                  ? "Website Development"
                  : href.includes("website-redesign")
                    ? "Website Redesign"
                    : href.includes("website-maintenance")
                      ? "Website Maintenance"
                      : href.includes("/seo")
                        ? "SEO"
                        : null;
            if (!label) return null;
            return {
              label,
              href,
              description: SERVICE_BLURBS[label],
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
      : [];

  const services =
    servicesFromHrefs.length > 0 ? servicesFromHrefs : serviceLinks;

  const cta = content.caseStudyCta;
  const galleryItems = content.gallerySections.filter(
    (item) => item.src !== content.heroImage?.src,
  );
  const usesFeatureSections = content.productFeatures.length > 0;
  const solutionItems = content.solutionPoints;

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
          { name: project.name, path: `/work/${project.slug}` },
        ])}
      />

      <CaseStudyHero
        project={project}
        statement={content.heroStatement}
        image={content.heroImage}
        supportingImage={
          content.hasDistinctGallery ? content.galleryImages[0] : undefined
        }
        externalLinkLabel={content.externalLinkLabel}
        eyebrow={content.heroEyebrow}
        supportingCopy={content.heroSupportingCopy}
      />

      <CaseStudyIntro
        heading={content.introHeading}
        overview={content.overview}
      />

      <CaseStudyChallenge
        items={content.challenges}
        heading={content.sectionHeadings.challenge}
      />

      {content.productPrinciples.length > 0 ? (
        <CaseStudyPrinciples
          items={content.productPrinciples}
          heading={content.sectionHeadings.principles}
        />
      ) : null}

      <CaseStudyApproach
        items={content.approachSteps}
        heading={content.sectionHeadings.approach}
      />

      {!usesFeatureSections && galleryItems.length > 0 ? (
        <CaseStudyGallery items={[galleryItems[0]]} />
      ) : null}

      <CaseStudySolution
        summary={content.solutionSummary}
        items={solutionItems}
        heading={content.sectionHeadings.solution}
        visual={
          !usesFeatureSections &&
          content.hasDistinctGallery &&
          !galleryItems.length
            ? content.galleryImages[0]
            : undefined
        }
      />

      {usesFeatureSections ? (
        <CaseStudyProductFeatures features={content.productFeatures} />
      ) : null}

      {!usesFeatureSections && galleryItems.length > 1 ? (
        <CaseStudyGallery items={galleryItems.slice(1, 3)} />
      ) : null}

      <CaseStudyHighlights items={content.highlights} />

      {!usesFeatureSections && galleryItems.length > 3 ? (
        <CaseStudyGallery items={galleryItems.slice(3)} />
      ) : null}

      <CaseStudyOutcome
        heading={content.outcomeHeading}
        summary={content.resultSummary}
        items={content.outcomes}
      />

      {content.saasInfrastructure.length > 0 ? (
        <CaseStudySaasInfrastructure
          stacks={content.saasInfrastructure}
          heading={content.sectionHeadings.saasInfrastructure}
        />
      ) : null}

      {content.showArchitectureDiagram ? <CaseStudyArchitectureDiagram /> : null}

      {content.engineeringStacks?.length ? (
        <CaseStudyEngineering
          intro={content.engineeringIntro}
          stacks={content.engineeringStacks}
          heading={content.sectionHeadings.engineering}
        />
      ) : null}

      {feedback ? (
        <CaseStudyQuote
          quote={feedback.quote}
          name={feedback.name}
          role={feedback.role}
        />
      ) : null}

      <CaseStudyServicesPlatform
        services={services.filter((service) => service.href || service.description)}
        platform={project.platform}
        platformHref={content.platformHref}
        platformContext={content.platformContext}
        platformHeading={content.platformHeading}
      />

      {related.length > 0 ? (
        <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
          <Container>
            <SectionHeader
              eyebrow="More work"
              title="Related projects"
              description="Other Smartlance projects with related industries, platforms or services."
            />
            <div
              className={`mt-10 grid gap-x-8 gap-y-12 ${
                related.length === 1 ? "max-w-xl" : "sm:grid-cols-2"
              }`}
            >
              {related.map((item) => (
                <ProjectCard
                  key={item.slug}
                  project={item}
                  variant="featured"
                />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <CaseStudyNav
        previous={
          previous
            ? { name: previous.name, href: `/work/${previous.slug}` }
            : null
        }
        next={next ? { name: next.name, href: `/work/${next.slug}` } : null}
      />

      <CTASection
        className="!py-14 sm:!py-16 lg:!py-[4.5rem]"
        title={
          cta?.title ??
          (content.isProductCaseStudy
            ? "Planning a Digital Product or Platform?"
            : "Planning a Similar Website Project?")
        }
        description={
          cta?.description ??
          (content.isProductCaseStudy
            ? "If you need a custom platform, marketplace, dashboard or web application, tell us what you're building and what the product needs to do."
            : "If you need a clearer, better-performing website, tell us what your business needs.")
        }
        primaryLabel={cta?.primaryLabel ?? "Tell Us About Your Project"}
        primaryHref={cta?.primaryHref ?? "/contact"}
        secondaryLabel="View Our Work"
        secondaryHref="/work"
      />

      <PortfolioViewTracker slug={project.slug} />
    </>
  );
}
