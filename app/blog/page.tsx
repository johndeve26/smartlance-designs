import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BlogCard } from "@/components/ui/blog-card";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { BlogCategoryNav } from "@/components/blog/blog-category-nav";
import { BlogPagination } from "@/components/blog/blog-pagination";
import {
  BLOG_PAGE_SIZE,
  blogCategories,
  getFeaturedInsightsPosts,
} from "@/lib/blog";
import { loadPublishedInsights } from "@/lib/content/phase3-public";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import type { BlogCategory } from "@/types";

type PageProps = {
  searchParams: Promise<{ page?: string; category?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || "1") || 1);
  const category = params.category || "";
  const base = buildMetadata({
    title: "Insights — Website Design, SEO and Growth",
    description:
      "Practical articles from Smartlance Designs on website design, development, SEO, conversion, performance and vacation rental websites.",
    path: "/blog",
    noIndex: page > 1,
  });

  if (category) {
    return {
      ...base,
      title: `${category} articles | Insights`,
      description: `Smartlance Designs articles about ${category.toLowerCase()}.`,
      robots: page > 1 ? { index: false, follow: true } : base.robots,
    };
  }

  return base;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || "1") || 1);
  const category = params.category || undefined;
  const allPosts = await loadPublishedInsights();
  const used = new Set(allPosts.map((post) => post.category));
  const categories = blogCategories.filter((c) => used.has(c));
  const searchIndex = allPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
  }));

  const showFeatured = page === 1 && !category;
  // Featured curation still uses markdown-aware helper when DB empty;
  // when DB-backed, filter featured from loaded posts.
  const featured = showFeatured
    ? allPosts.filter((p) => p.featured).length
      ? [...allPosts]
          .filter((p) => p.featured)
          .sort(
            (a, b) =>
              new Date(b.publishedAt).getTime() -
              new Date(a.publishedAt).getTime(),
          )
          .slice(0, 3)
      : getFeaturedInsightsPosts(3)
    : [];
  const excludeSlugs = showFeatured ? featured.map((post) => post.slug) : [];

  let filtered = category
    ? allPosts.filter((post) => post.category === (category as BlogCategory))
    : allPosts;
  if (excludeSlugs.length) {
    const excluded = new Set(excludeSlugs);
    filtered = filtered.filter((post) => !excluded.has(post.slug));
  }
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * BLOG_PAGE_SIZE;
  const posts = filtered.slice(start, start + BLOG_PAGE_SIZE);

  const publishedTotal = allPosts.length;
  const [lead, ...supporting] = featured;

  function hrefFor(nextPage: number, nextCategory?: string) {
    const query = new URLSearchParams();
    const cat = nextCategory === undefined ? category : nextCategory;
    if (cat) query.set("category", cat);
    if (nextPage > 1) query.set("page", String(nextPage));
    const q = query.toString();
    return q ? `/blog?${q}` : "/blog";
  }

  const archiveHeading = category
    ? `${category} Insights`
    : showFeatured
      ? "Explore All Insights"
      : "Latest Insights";

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />

      <Section className="!pt-10 !pb-10 sm:!pb-12">
        <Container>
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Blog" }]}
          />
          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Blog</p>
            <h1 className="heading-section mt-3 font-display font-semibold">
              Insights
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              Practical guidance on websites, SEO, conversion and digital growth
              — plus specialist insights for hospitality and vacation-rental
              businesses.
            </p>
          </div>

          <div className="mt-8 border-t border-border pt-8">
            <BlogCategoryNav
              categories={categories}
              active={category}
              posts={searchIndex}
            />
          </div>
        </Container>
      </Section>

      {showFeatured && lead ? (
        <Section className="!pt-0 !pb-0">
          <Container>
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Featured</p>
                <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                  Featured Insights
                </h2>
              </div>
            </div>
            <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-x-8">
              <div className="lg:col-span-8">
                <BlogCard post={lead} variant="lead" priority />
              </div>
              {supporting.length > 0 ? (
                <div className="grid gap-10 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:gap-10">
                  {supporting.map((post) => (
                    <BlogCard key={post.slug} post={post} variant="featured" />
                  ))}
                </div>
              ) : null}
            </div>
          </Container>
        </Section>
      ) : null}

      <Section
        className={
          showFeatured ? "!pt-10 !pb-12 sm:!pt-12 sm:!pb-14" : "!pt-0 !pb-12 sm:!pb-14"
        }
      >
        <Container>
          <div className="mb-8 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              {archiveHeading}
            </h2>
            <p className="text-base text-muted">
              Showing{" "}
              <span className="tabular-nums font-medium text-foreground">
                {posts.length}
              </span>{" "}
              of{" "}
              <span className="tabular-nums font-medium text-foreground">
                {category ? total : publishedTotal}
              </span>{" "}
              {category ? `${category} articles` : "articles"}
              {totalPages > 1 ? (
                <span className="text-subtle">
                  {" "}
                  · Page {current} of {totalPages}
                </span>
              ) : null}
            </p>
          </div>

          {posts.length > 0 ? (
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3 xl:gap-y-14">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-muted/50 px-6 py-12 text-center">
              <h3 className="font-display text-2xl font-semibold">
                No articles in this category yet.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-base text-muted">
                Try another category, or browse the full Insights archive.
              </p>
              <Link
                href="/blog"
                className="mt-6 inline-flex text-base font-semibold text-accent-text hover:underline"
              >
                View all insights →
              </Link>
            </div>
          )}

          <BlogPagination
            current={current}
            totalPages={totalPages}
            hrefFor={(nextPage) => hrefFor(nextPage)}
          />
        </Container>
      </Section>

      <CTASection
        className="!py-12 sm:!py-14 lg:!py-16"
        title="Need Help Putting These Ideas Into Practice?"
        description="If your website needs better design, stronger SEO or clearer conversion paths, Smartlance can help you decide what to improve first."
        primaryLabel="Get a Free Website Review"
        primaryHref="/free-website-review"
        secondaryLabel="Tell Us About Your Project"
        secondaryHref="/contact"
      />
    </>
  );
}
