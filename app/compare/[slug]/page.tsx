import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { BlogCard } from "@/components/ui/blog-card";
import { ArticleCopyLink } from "@/components/blog/article-toc";
import { GuideCard } from "@/components/guides/guide-body";
import { ComparisonHero } from "@/components/comparisons/comparison-hero";
import {
  ComparisonBestFit,
  ComparisonDecisionMatrix,
  ComparisonDecisionQuestions,
  ComparisonFaq,
  ComparisonPlatformLinks,
  ComparisonPrinciple,
  ComparisonQuickFit,
  ComparisonSections,
  ComparisonTable,
} from "@/components/comparisons/comparison-sections";
import { BlogMarkdown } from "@/components/blog/blog-markdown";
import {
  getComparisonBySlug,
  getPublishedComparisons,
  getRelatedPublishedComparisons,
} from "@/data/comparisons";
import { getGuideBySlug } from "@/data/guides";
import { getSolutionBySlug, getSolutionHref } from "@/data/solutions";
import { getServiceBySlug } from "@/data/services";
import { getPostBySlug } from "@/lib/blog";
import { buildResourcePageMetadata } from "@/lib/seo/resource-metadata";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
} from "@/lib/structured-data";
import type { BlogPostMeta } from "@/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublishedComparisons().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);
  if (!comparison) return {};
  return buildResourcePageMetadata({
    kind: "comparison",
    slug: comparison.slug,
    path: `/compare/${comparison.slug}`,
    fallbackTitle: comparison.seoTitle || comparison.title,
    fallbackDescription: comparison.seoDescription || comparison.description,
    article: true,
  });
}

export default async function ComparisonDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);
  if (!comparison) notFound();

  const relatedComparisons = getRelatedPublishedComparisons(comparison.slug, 3);
  const relatedGuides = (comparison.relatedGuideSlugs ?? [])
    .map((guideSlug) => getGuideBySlug(guideSlug))
    .filter((guide): guide is NonNullable<typeof guide> => Boolean(guide));

  const relatedSolutions = (comparison.relatedSolutionSlugs ?? [])
    .map((solutionSlug) => getSolutionBySlug(solutionSlug))
    .filter((solution) => solution?.published)
    .slice(0, 3);

  const relatedServices = (comparison.relatedServiceHrefs ?? [])
    .map((href) => getServiceBySlug(href.replace(/^\/services\//, "")))
    .filter((service): service is NonNullable<typeof service> => Boolean(service))
    .slice(0, 4);

  const relatedInsights = (comparison.relatedInsightSlugs ?? [])
    .map((insightSlug) => getPostBySlug(insightSlug))
    .filter((post): post is NonNullable<typeof post> => post != null)
    .slice(0, 3) as BlogPostMeta[];

  const optionAHref = `/platforms/${comparison.relatedPlatformSlugs?.[0] ?? "wordpress"}`;
  const optionBHref = `/platforms/${comparison.relatedPlatformSlugs?.[1] ?? "webflow"}`;

  const earlySectionIds = new Set([
    "platform-model",
    "hosting",
    "design-workflow",
    "development-flexibility",
    "cms-content",
    "maintenance-security",
    "integrations",
    "seo",
    "performance",
    "ecommerce",
    "team-workflow",
    "ownership-portability",
    "cost",
  ]);
  const lateSectionIds = new Set([
    "avoid-starting",
    "existing-wordpress",
    "existing-webflow",
    "redesign-vs-migration",
    "smartlance-approach",
    "final-verdict",
  ]);
  const earlySections = {
    ...comparison,
    sections: comparison.sections.filter((section) =>
      earlySectionIds.has(section.id),
    ),
  };
  const lateSections = {
    ...comparison,
    sections: comparison.sections.filter((section) =>
      lateSectionIds.has(section.id),
    ),
  };

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: "Comparisons", path: "/compare" },
            {
              name: `${comparison.optionA} vs ${comparison.optionB}`,
              path: `/compare/${comparison.slug}`,
            },
          ]),
          articleJsonLd({
            title: comparison.title,
            description: comparison.description,
            path: `/compare/${comparison.slug}`,
            publishedAt: comparison.publishedAt,
            updatedAt: comparison.updatedAt,
            author: comparison.author,
            schemaType: "Article",
          }),
          ...(comparison.faqs?.length
            ? [faqJsonLd(comparison.faqs)]
            : []),
        ]}
      />

      <ComparisonHero comparison={comparison} />

      <Section className="!pt-10 !pb-12 sm:!pt-12 sm:!pb-16">
        <Container>
          <div className="space-y-16 sm:space-y-20">
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                Quick answer
              </p>
              <div className="prose-smartlance mt-4">
                <BlogMarkdown content={comparison.summary} />
              </div>
            </section>

            <ComparisonQuickFit comparison={comparison} />
            <ComparisonTable comparison={comparison} />
            <ComparisonSections comparison={earlySections} />
            <ComparisonPrinciple />
            <ComparisonDecisionMatrix comparison={comparison} />
            <ComparisonBestFit comparison={comparison} />
            <ComparisonDecisionQuestions comparison={comparison} />
            <ComparisonSections comparison={lateSections} />

            <section>
              <h2 className="font-display text-[1.875rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.125rem]">
                Explore Both Platforms
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted">
                Platform pages explain how Smartlance approaches implementation
                — without partnership claims.
              </p>
              <div className="mt-6">
                <ComparisonPlatformLinks
                  optionA={comparison.optionA}
                  optionB={comparison.optionB}
                  optionAHref={optionAHref}
                  optionBHref={optionBHref}
                />
              </div>
            </section>

            {(relatedGuides.length > 0 ||
              relatedSolutions.length > 0 ||
              relatedServices.length > 0) && (
              <div className="space-y-10 border-t border-border pt-10">
                {relatedGuides.length > 0 ? (
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                      Related Guide
                    </p>
                    <div className="mt-5 max-w-xl">
                      {relatedGuides.map((guide) => (
                        <GuideCard
                          key={guide.slug}
                          guide={guide}
                          variant="compact"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {relatedSolutions.length > 0 ? (
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                      Related Solutions
                    </p>
                    <ul className="mt-4 space-y-4">
                      {relatedSolutions.map((solution) => {
                        const href = getSolutionHref(solution!);
                        if (!href) return null;
                        return (
                          <li key={solution!.slug}>
                            <Link
                              href={href}
                              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                              <span className="font-display text-xl font-semibold text-foreground transition-colors group-hover:text-accent-text">
                                {solution!.title}
                              </span>
                              <span className="mt-1.5 block text-[0.9375rem] leading-relaxed text-muted">
                                {solution!.shortDescription}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}

                {relatedServices.length > 0 ? (
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                      Related Services
                    </p>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {relatedServices.map((service) => (
                        <li key={service.slug}>
                          <Link
                            href={service.href}
                            className="font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            {service.shortTitle || service.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {relatedInsights.length > 0 ? (
              <div className="border-t border-border pt-10">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                  Related Insights
                </p>
                <div className="mt-6 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                  {relatedInsights.map((post, index) => (
                    <BlogCard
                      key={post.slug}
                      post={post}
                      variant="editorial"
                      fallbackIndex={index}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {relatedComparisons.length > 0 ? (
              <div className="border-t border-border pt-10">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                  Related Comparisons
                </p>
                <ul className="mt-4 space-y-3">
                  {relatedComparisons.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/compare/${item.slug}`}
                        className="font-semibold text-accent-text hover:underline"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <ComparisonFaq comparison={comparison} />

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-8 text-[0.9375rem] text-muted">
              <ArticleCopyLink />
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  `https://www.smartlancedesigns.com/compare/${comparison.slug}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Share on LinkedIn
              </a>
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Still Deciding Between WordPress and Webflow?"
        description="Tell us what the website needs to do, who will manage it and what you expect to add later. We can help you evaluate the platform before the build starts."
        primaryLabel="Tell Us About Your Project"
        primaryHref="/contact"
        secondaryLabel="Explore Platforms"
        secondaryHref="/platforms"
      />
    </>
  );
}
