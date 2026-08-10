import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AudienceSubscribeSection } from "@/components/audience/subscribe-section-server";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { BlogCard } from "@/components/ui/blog-card";
import { Button } from "@/components/ui/button";
import { ProjectBriefForm } from "@/components/templates/project-brief-form";
import {
  getTemplateNav,
  getTemplateSectionCount,
} from "@/data/templates";
import {
  loadChecklistBySlug,
  loadComparisonBySlug,
  loadGuideBySlug,
  loadPublishedTemplates,
  loadTemplateBySlug,
} from "@/lib/content/phase3-public";
import { getSolutionBySlug, getSolutionHref } from "@/data/solutions";
import { getServiceBySlug } from "@/data/services";
import { getPostBySlug } from "@/lib/blog";
import { buildResourcePageMetadata } from "@/lib/seo/resource-metadata";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/structured-data";
import type { BlogPostMeta } from "@/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const templates = await loadPublishedTemplates();
  return templates.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await loadTemplateBySlug(slug);
  if (!template) return {};
  return buildResourcePageMetadata({
    kind: "template",
    slug: template.slug,
    path: `/templates/${template.slug}`,
    fallbackTitle: template.seoTitle || template.title,
    fallbackDescription: template.seoDescription || template.description,
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const template = await loadTemplateBySlug(slug);
  if (!template) notFound();

  const sectionCount = getTemplateSectionCount(template);
  const nav = getTemplateNav(template);

  const relatedGuide = template.relatedGuideSlugs?.[0]
    ? await loadGuideBySlug(template.relatedGuideSlugs[0])
    : undefined;

  const relatedComparison = template.relatedComparisonSlugs?.[0]
    ? await loadComparisonBySlug(template.relatedComparisonSlugs[0])
    : undefined;

  const relatedChecklist = template.relatedChecklistSlugs?.[0]
    ? await loadChecklistBySlug(template.relatedChecklistSlugs[0])
    : undefined;

  const relatedSolutions = (template.relatedSolutionSlugs ?? [])
    .map((solutionSlug) => getSolutionBySlug(solutionSlug))
    .filter(
      (solution): solution is NonNullable<typeof solution> =>
        Boolean(solution?.published),
    )
    .slice(0, 3);

  const relatedServices = (template.relatedServiceHrefs ?? [])
    .map((href) => getServiceBySlug(href.replace(/^\/services\//, "")))
    .filter((service): service is NonNullable<typeof service> => Boolean(service))
    .slice(0, 4);

  const relatedInsights = (template.relatedInsightSlugs ?? [])
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
            { name: "Templates", path: "/templates" },
            {
              name: template.title,
              path: `/templates/${template.slug}`,
            },
          ]),
          webPageJsonLd({
            name: template.title,
            description: template.description,
            path: `/templates/${template.slug}`,
          }),
        ]}
      />

      <section className="template-hero border-b border-border bg-surface-muted print:hidden">
        <Container className="!pt-10 !pb-12 sm:!pb-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Resources", href: "/resources" },
              { label: "Templates", href: "/templates" },
              { label: template.title },
            ]}
          />

          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Template</p>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,4vw,3.5rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
              {template.title}
            </h1>
            {template.subtitle ? (
              <p className="mt-5 max-w-2xl text-base leading-[1.7] text-muted sm:text-lg">
                {template.subtitle}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-subtle">
              <span>{sectionCount} sections</span>
              <span aria-hidden>·</span>
              <span>Published {formatDate(template.publishedAt)}</span>
              <span aria-hidden>·</span>
              <span>Smartlance Designs</span>
            </div>

            <p className="mt-6 max-w-2xl rounded-md border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
              Your answers stay in this browser unless you choose to copy or
              send them.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              Still figuring out what kind of project this is?{" "}
              <Link
                href="/project-planner"
                className="font-semibold text-accent-text hover:underline"
              >
                Use Project Planner →
              </Link>
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <a href="#project-brief">Use the Template</a>
              </Button>
              {template.slug === "website-project-brief-template" ? (
                <Button asChild variant="outline">
                  <Link href="/website-brief">Open interactive builder</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      <Section className="!py-10 sm:!py-12">
        <Container>
          <ProjectBriefForm template={template} nav={nav} />
        </Container>
      </Section>

      <Section className="border-t border-border bg-surface-muted print:hidden">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-[1.5rem] font-semibold tracking-tight">
                Related planning resources
              </h2>
              <ul className="mt-6 space-y-4">
                {relatedGuide ? (
                  <li>
                    <Link
                      href={`/guides/${relatedGuide.slug}`}
                      className="font-semibold text-accent-text hover:underline"
                    >
                      {relatedGuide.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted">
                      Useful when an existing site is being redesigned or
                      rebuilt.
                    </p>
                  </li>
                ) : null}
                {relatedComparison ? (
                  <li>
                    <Link
                      href={`/compare/${relatedComparison.slug}`}
                      className="font-semibold text-accent-text hover:underline"
                    >
                      {relatedComparison.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted">
                      Helpful when the target platform is still undecided — not
                      the only options.
                    </p>
                  </li>
                ) : null}
                <li>
                  <Link
                    href="/platforms"
                    className="font-semibold text-accent-text hover:underline"
                  >
                    Explore Platforms
                  </Link>
                </li>
                {relatedChecklist ? (
                  <li>
                    <p className="text-sm text-muted">
                      Already building or preparing to launch?
                    </p>
                    <Link
                      href={`/checklists/${relatedChecklist.slug}`}
                      className="font-semibold text-accent-text hover:underline"
                    >
                      {relatedChecklist.title}
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>

            <div>
              {relatedSolutions.length > 0 ? (
                <div>
                  <h2 className="font-display text-[1.5rem] font-semibold tracking-tight">
                    Related solutions
                  </h2>
                  <ul className="mt-6 space-y-3">
                    {relatedSolutions.map((solution) => {
                      const href = getSolutionHref(solution);
                      if (!href) return null;
                      return (
                      <li key={solution.slug}>
                        <Link
                          href={href}
                          className="font-semibold text-accent-text hover:underline"
                        >
                          {solution.title}
                        </Link>
                      </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {relatedServices.length > 0 ? (
                <div className={relatedSolutions.length > 0 ? "mt-10" : undefined}>
                  <h2 className="font-display text-[1.5rem] font-semibold tracking-tight">
                    Related services
                  </h2>
                  <ul className="mt-6 space-y-3">
                    {relatedServices.map((service) => (
                      <li key={service.slug}>
                        <Link
                          href={service.href}
                          className="font-semibold text-accent-text hover:underline"
                        >
                          {service.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          {relatedInsights.length > 0 ? (
            <div className="mt-14">
              <h2 className="font-display text-[1.5rem] font-semibold tracking-tight">
                Related insights
              </h2>
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
        </Container>
      </Section>

      <Section className="!pt-0 !pb-12 print:hidden">
        <Container>
          <AudienceSubscribeSection
            source="TEMPLATE"
            sourceUrl={`/templates/${slug}`}
            variant="resource"
          />
        </Container>
      </Section>

      <div className="print:hidden">
        <CTASection
          title="Need Help Applying This Brief?"
          description="If you would like a second pair of eyes on scope, platform or next steps, tell us about the project — copy the brief first if you want to include it."
          primaryLabel="Tell Us About Your Project"
          primaryHref="/contact"
          secondaryLabel="How Project Scope Works"
          secondaryHref="/pricing"
        />
      </div>
    </>
  );
}
