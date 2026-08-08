import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { BlogCard } from "@/components/ui/blog-card";
import { ChecklistInteractive } from "@/components/checklists/checklist-interactive";
import {
  getChecklistBySlug,
  getChecklistItemCount,
  getChecklistNav,
  getPublishedChecklists,
} from "@/data/checklists";
import { getGuideBySlug } from "@/data/guides";
import { getComparisonBySlug } from "@/data/comparisons";
import { getSolutionBySlug, getSolutionHref } from "@/data/solutions";
import { getServiceBySlug } from "@/data/services";
import { getPostBySlug } from "@/lib/blog";
import { buildResourcePageMetadata } from "@/lib/seo/resource-metadata";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import type { BlogPostMeta } from "@/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublishedChecklists().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const checklist = getChecklistBySlug(slug);
  if (!checklist) return {};
  return buildResourcePageMetadata({
    kind: "checklist",
    slug: checklist.slug,
    path: `/checklists/${checklist.slug}`,
    fallbackTitle: checklist.seoTitle || checklist.title,
    fallbackDescription: checklist.seoDescription || checklist.description,
    article: true,
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ChecklistDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const checklist = getChecklistBySlug(slug);
  if (!checklist) notFound();

  const itemCount = getChecklistItemCount(checklist);
  const nav = getChecklistNav(checklist);

  const relatedGuide = checklist.relatedGuideSlugs?.[0]
    ? getGuideBySlug(checklist.relatedGuideSlugs[0])
    : undefined;

  const relatedComparison = checklist.relatedComparisonSlugs?.[0]
    ? getComparisonBySlug(checklist.relatedComparisonSlugs[0])
    : undefined;

  const relatedSolutions = (checklist.relatedSolutionSlugs ?? [])
    .map((solutionSlug) => getSolutionBySlug(solutionSlug))
    .filter((solution) => solution?.published)
    .slice(0, 2);

  const relatedServices = (checklist.relatedServiceHrefs ?? [])
    .map((href) => getServiceBySlug(href.replace(/^\/services\//, "")))
    .filter((service): service is NonNullable<typeof service> => Boolean(service))
    .slice(0, 4);

  const relatedInsights = (checklist.relatedInsightSlugs ?? [])
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
            { name: "Checklists", path: "/checklists" },
            { name: checklist.title, path: `/checklists/${checklist.slug}` },
          ]),
          articleJsonLd({
            title: checklist.title,
            description: checklist.description,
            path: `/checklists/${checklist.slug}`,
            publishedAt: checklist.publishedAt,
            updatedAt: checklist.updatedAt,
            author: checklist.author,
            schemaType: "Article",
          }),
        ]}
      />

      <header className="checklist-hero border-b border-border bg-surface print:border-0">
        <Container className="pt-8 pb-10 sm:pb-12">
          <div className="print:hidden">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Resources", href: "/resources" },
                { label: "Checklists", href: "/checklists" },
                { label: checklist.title },
              ]}
            />
          </div>

          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
              Checklist
            </p>
            <h1 className="mt-3.5 max-w-[40rem] font-display text-[clamp(2.25rem,4vw,3.75rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              {checklist.title}
            </h1>
            <p className="mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted sm:text-lg sm:leading-[1.65]">
              {checklist.subtitle || checklist.description}
            </p>
            {checklist.intro ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
                {checklist.intro}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span className="font-medium text-foreground">
                {checklist.author?.trim() || "Smartlance Designs"}
              </span>
              <span aria-hidden className="text-subtle">
                ·
              </span>
              <time dateTime={checklist.publishedAt}>
                {formatDate(checklist.publishedAt)}
              </time>
              <span aria-hidden className="text-subtle">
                ·
              </span>
              <span>
                {checklist.sections.length} sections · {itemCount} items
              </span>
            </div>

            {relatedGuide ? (
              <p className="mt-6 print:hidden">
                <Link
                  href={`/guides/${relatedGuide.slug}`}
                  className="inline-flex text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Need more context? Read the Complete Website Redesign Guide →
                </Link>
              </p>
            ) : null}
          </div>
        </Container>
      </header>

      <Section className="!pt-8 !pb-12 sm:!pt-10 sm:!pb-16 checklist-body">
        <Container>
          <p className="mb-8 text-[0.9375rem] leading-relaxed text-muted sm:text-base print:hidden">
            Check items as you review them. Progress stays in this browser only
            — it is not a measure of overall project completion.
          </p>

          <ChecklistInteractive checklist={checklist} nav={nav} />

          <aside className="mt-16 rounded-xl border border-border bg-surface-muted px-5 py-6 sm:px-6 print:hidden">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
              Important
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold text-foreground sm:text-[1.375rem]">
              A Checklist Can&apos;t Decide the Strategy for You
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              Not every item applies to every website. This checklist is meant
              to reduce omissions — not replace project-specific judgment.
              Completing it does not guarantee rankings, accessibility
              compliance, security, conversion improvement or a perfect launch.
            </p>
          </aside>

          <div className="mt-14 space-y-10 border-t border-border pt-10 print:hidden">
            {relatedGuide ? (
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                  Related Guide
                </p>
                <p className="mt-2 font-display text-xl font-semibold text-foreground">
                  <Link
                    href={`/guides/${relatedGuide.slug}`}
                    className="hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {relatedGuide.title}
                  </Link>
                </p>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                  Need the reasoning behind the checklist? Read the Guide for
                  strategy, SEO, content and launch decisions.
                </p>
              </div>
            ) : null}

            {relatedComparison ? (
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                  Platform decision
                </p>
                <p className="mt-2 text-base text-muted">
                  Still deciding whether the redesign should change platforms?
                </p>
                <Link
                  href={`/compare/${relatedComparison.slug}`}
                  className="mt-2 inline-flex font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {relatedComparison.optionA} vs {relatedComparison.optionB} →
                </Link>
              </div>
            ) : null}

            {relatedSolutions.length > 0 ? (
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
                  Related Solutions
                </p>
                <ul className="mt-4 space-y-3">
                  {relatedSolutions.map((solution) => {
                    const href = getSolutionHref(solution!);
                    if (!href) return null;
                    return (
                      <li key={solution!.slug}>
                        <Link
                          href={href}
                          className="font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          {solution!.title}
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

            {relatedInsights.length > 0 ? (
              <div>
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
          </div>
        </Container>
      </Section>

      <div className="print:hidden">
        <CTASection
          title="Planning a Website Redesign?"
          description="If you'd like another set of eyes on the current site before making major changes, we can review the website and help identify where the biggest issues may be."
          primaryLabel="Get a Free Website Review"
          primaryHref="/free-website-review"
          secondaryLabel="Tell Us About Your Project"
          secondaryHref="/contact"
        />
      </div>
    </>
  );
}
