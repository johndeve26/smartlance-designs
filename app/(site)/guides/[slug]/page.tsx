import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AudienceSubscribeSection } from "@/components/audience/subscribe-section-server";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { BlogCard } from "@/components/ui/blog-card";
import { ArticleReadingProgress } from "@/components/blog/article-reading-progress";
import {
  ArticleCopyLink,
  ArticleToc,
} from "@/components/blog/article-toc";
import { GuideBody } from "@/components/guides/guide-body";
import { GuideHero } from "@/components/guides/guide-hero";
import {
  getGuideToc,
} from "@/data/guides";
import {
  loadGuideBySlug,
  loadPublishedGuides,
} from "@/lib/content/phase3-public";
import { resolveRelatedPublishedGuides } from "@/lib/resources/discovery";
import { getSolutionBySlug, getSolutionHref } from "@/data/solutions";
import { getServiceBySlug } from "@/data/services";
import { getPostBySlug } from "@/lib/blog";
import { buildResourcePageMetadata } from "@/lib/seo/resource-metadata";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { cn } from "@/lib/utils";
import type { BlogPostMeta } from "@/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const guides = await loadPublishedGuides();
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await loadGuideBySlug(slug);
  if (!guide) return {};
  return buildResourcePageMetadata({
    kind: "guide",
    slug: guide.slug,
    path: `/guides/${guide.slug}`,
    fallbackTitle: guide.seoTitle || guide.title,
    fallbackDescription: guide.seoDescription || guide.description,
    fallbackImage: guide.heroImage,
    article: true,
  });
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = await loadGuideBySlug(slug);
  if (!guide) notFound();

  const toc = getGuideToc(guide).map((item) => ({
    id: item.id,
    text: item.title,
  }));
  const showToc = toc.length >= 3;

  const publishedGuides = await loadPublishedGuides();
  const relatedGuides = resolveRelatedPublishedGuides(guide.slug, publishedGuides, 3);
  const relatedSolutions = (guide.relatedSolutionSlugs ?? [])
    .map((solutionSlug) => getSolutionBySlug(solutionSlug))
    .filter((solution) => solution?.published)
    .slice(0, 2);

  const relatedServices = (guide.relatedServiceHrefs ?? [])
    .map((href) => {
      const serviceSlug = href.replace(/^\/services\//, "");
      return getServiceBySlug(serviceSlug);
    })
    .filter((service): service is NonNullable<typeof service> => Boolean(service))
    .slice(0, 4);

  const relatedInsights = (guide.relatedInsightSlugs ?? [])
    .map((insightSlug) => getPostBySlug(insightSlug))
    .filter((post): post is NonNullable<typeof post> => post != null)
    .slice(0, 3) as BlogPostMeta[];

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: "Guides", path: "/guides" },
            { name: guide.title, path: `/guides/${guide.slug}` },
          ]),
          articleJsonLd({
            title: guide.title,
            description: guide.description,
            path: `/guides/${guide.slug}`,
            publishedAt: guide.publishedAt,
            updatedAt: guide.updatedAt,
            author: guide.author,
            schemaType: "Article",
          }),
        ]}
      />

      <ArticleReadingProgress />
      <GuideHero guide={guide} />

      <Section className="!pt-10 !pb-12 sm:!pt-12 sm:!pb-14">
        <Container>
          {showToc ? (
            <div className="mb-8 xl:hidden">
              <ArticleToc headings={toc} variant="mobile" />
            </div>
          ) : null}

          <div
            className={cn(
              "grid gap-12",
              showToc
                ? "xl:grid-cols-[minmax(0,1fr)_15.5rem] xl:gap-16"
                : undefined,
            )}
          >
            <div className="min-w-0">
              <article id="article-body">
                <GuideBody guide={guide} />
              </article>

              {(relatedSolutions.length > 0 || relatedServices.length > 0) && (
                <div className="mt-14 space-y-10 border-t border-border pt-10">
                  {relatedSolutions.length > 0 ? (
                    <div>
                      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                        Related solutions
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
                                <span className="font-display text-xl font-semibold text-foreground transition-colors group-hover:text-accent-text sm:text-[1.375rem]">
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
                        Related services
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
                <div className="mt-14 border-t border-border pt-10">
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

              {relatedGuides.length > 0 ? (
                <div className="mt-14 border-t border-border pt-10">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                    Related Guides
                  </p>
                  <ul className="mt-4 space-y-3">
                    {relatedGuides.map((related) => (
                      <li key={related.slug}>
                        <Link
                          href={`/guides/${related.slug}`}
                          className="font-semibold text-accent-text hover:underline"
                        >
                          {related.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-8 text-[0.9375rem] text-muted">
                <ArticleCopyLink />
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    `https://www.smartlancedesigns.com/guides/${guide.slug}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Share on LinkedIn
                </a>
              </div>
            </div>

            {showToc ? (
              <aside className="hidden xl:block">
                <div className="sticky top-28 space-y-8">
                  <ArticleToc headings={toc} variant="desktop" />
                  <div className="rounded-xl border border-border bg-surface-muted p-5">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                      Related
                    </p>
                    <p className="mt-2.5 font-display text-lg font-semibold text-foreground">
                      Website Redesign
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      When you are ready for help planning or delivering the
                      redesign.
                    </p>
                    <Link
                      href="/services/website-redesign"
                      className="mt-4 inline-flex text-sm font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Explore the service →
                    </Link>
                  </div>
                </div>
              </aside>
            ) : null}
          </div>
        </Container>
      </Section>

      <Section className="!pt-0 !pb-12">
        <Container>
          <AudienceSubscribeSection
            source="GUIDE"
            sourceUrl={`/guides/${slug}`}
            variant="resource"
          />
        </Container>
      </Section>

      <CTASection
        title="Planning a Website Redesign?"
        description="Tell us what is changing, what needs to be preserved and what you want the new website to do better."
        primaryLabel="Tell Us About Your Project"
        primaryHref="/contact"
        secondaryLabel="Get a Free Website Review"
        secondaryHref="/free-website-review"
      />
    </>
  );
}
