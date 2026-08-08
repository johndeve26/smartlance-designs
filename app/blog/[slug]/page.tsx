import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { ArticleHero } from "@/components/blog/article-hero";
import {
  ArticleNav,
  ArticleRelated,
} from "@/components/blog/article-related";
import { ArticleReadingProgress } from "@/components/blog/article-reading-progress";
import { ArticleSidebarCta } from "@/components/blog/article-sidebar-cta";
import {
  ArticleCopyLink,
  ArticleToc,
} from "@/components/blog/article-toc";
import { BlogMarkdown } from "@/components/blog/blog-markdown";
import { getArticleCta } from "@/lib/article-cta";
import {
  extractHeadings,
  getAdjacentPosts,
  getRelatedPosts,
} from "@/lib/blog";
import {
  loadInsightBySlug,
  loadPublishedInsights,
} from "@/lib/content/phase3-public";
import { buildPageMetadata } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await loadPublishedInsights();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadInsightBySlug(slug);
  if (!post) return {};
  return buildPageMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.description,
    path: `/blog/${post.slug}`,
    canonicalPath: post.canonicalUrl || `/blog/${post.slug}`,
    canonicalOverride: post.canonicalUrl,
    noIndex: post.noIndex,
    type: "article",
    image: post.heroImage,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await loadInsightBySlug(slug);
  if (!post) notFound();

  const headings = extractHeadings(post.content);
  const related = getRelatedPosts(post.slug, 3);
  const { previous, next } = getAdjacentPosts(post.slug);
  const cta = getArticleCta(post.category, post.relatedServiceHrefs?.[0]);
  const showToc = headings.length >= 3;

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          articleJsonLd({
            title: post.title,
            description: post.description,
            path: `/blog/${post.slug}`,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            image: post.heroImage,
            author: post.author,
          }),
        ]}
      />

      <ArticleReadingProgress />
      <ArticleHero post={post} />

      <Section className="!pt-10 !pb-12 sm:!pt-12 sm:!pb-14">
        <Container>
          {showToc ? (
            <div className="mb-8 xl:hidden">
              <ArticleToc headings={headings} variant="mobile" />
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
              <article id="article-body" className="prose-smartlance">
                <BlogMarkdown content={post.content} />
              </article>

              <div className="mt-12 border-t border-border pt-8">
                <div className="max-w-xl">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                    Related service
                  </p>
                  <p className="mt-2.5 font-display text-xl font-semibold sm:text-[1.375rem]">
                    {cta.endTitle}
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-muted sm:text-[1.0625rem]">
                    {cta.sidebarBody}
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
                    <Link
                      href={cta.sidebarPrimaryHref}
                      className="text-base font-semibold text-accent-text hover:underline"
                    >
                      {cta.sidebarPrimaryLabel} →
                    </Link>
                    <Link
                      href="/free-website-review"
                      className="text-base font-medium text-muted hover:text-accent-text hover:underline"
                    >
                      Get a Free Website Review →
                    </Link>
                  </div>
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                    <Link
                      href={`/blog?category=${encodeURIComponent(post.category)}`}
                      className="font-semibold uppercase tracking-[0.12em] text-accent-text hover:underline"
                    >
                      {post.category}
                    </Link>
                    {post.readingTime ? (
                      <>
                        <span aria-hidden className="text-subtle">
                          ·
                        </span>
                        <span>{post.readingTime}</span>
                      </>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <ArticleCopyLink />
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://www.smartlancedesigns.com/blog/${post.slug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-muted transition-colors hover:text-accent-text"
                    >
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {showToc ? (
              <aside className="hidden xl:block">
                <div className="sticky top-28 space-y-8">
                  <ArticleToc headings={headings} variant="desktop" />
                  <ArticleSidebarCta cta={cta} />
                </div>
              </aside>
            ) : null}
          </div>
        </Container>
      </Section>

      <ArticleRelated posts={related} />

      <ArticleNav previous={previous} next={next} />

      <CTASection
        className="!py-14 sm:!py-16 lg:!py-[4.5rem]"
        title={cta.title}
        description={cta.description}
        primaryLabel={cta.primaryLabel}
        primaryHref={cta.primaryHref}
        secondaryLabel={cta.secondaryLabel}
        secondaryHref={cta.secondaryHref}
      />
    </>
  );
}
