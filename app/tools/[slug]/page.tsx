import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { Button } from "@/components/ui/button";
import { PlatformSelector } from "@/components/tools/platform-selector";
import {
  getPublishedTools,
  getToolBySlug,
  getToolQuestionCount,
} from "@/data/tools";
import { buildResourcePageMetadata } from "@/lib/seo/resource-metadata";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/structured-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublishedTools().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  return buildResourcePageMetadata({
    kind: "tool",
    slug: tool.slug,
    path: `/tools/${tool.slug}`,
    fallbackTitle: tool.seoTitle || tool.title,
    fallbackDescription: tool.seoDescription || tool.description,
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const questionCount = getToolQuestionCount(tool);

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: "Tools", path: "/tools" },
            { name: tool.title, path: `/tools/${tool.slug}` },
          ]),
          webPageJsonLd({
            name: tool.title,
            description: tool.description,
            path: `/tools/${tool.slug}`,
          }),
        ]}
      />

      <section className="border-b border-border bg-surface-muted">
        <Container className="!pt-10 !pb-12 sm:!pb-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Resources", href: "/resources" },
              { label: "Tools", href: "/tools" },
              { label: tool.title },
            ]}
          />

          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Tool</p>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,4vw,3.5rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
              {tool.title}
            </h1>
            {tool.subtitle ? (
              <p className="mt-5 max-w-2xl text-base leading-[1.7] text-muted sm:text-lg">
                {tool.subtitle}
              </p>
            ) : null}

            <p className="mt-6 max-w-2xl border-l-2 border-accent pl-4 text-base font-medium leading-relaxed text-foreground">
              The platform should follow the requirements — not the other way
              around.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-subtle">
              <span>{questionCount} questions</span>
              <span aria-hidden>·</span>
              <span>Published {formatDate(tool.publishedAt)}</span>
              <span aria-hidden>·</span>
              <span>Smartlance Designs</span>
            </div>

            <p className="mt-6 max-w-2xl rounded-md border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
              Your answers stay in this browser. Nothing is submitted to
              Smartlance.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              Still defining the overall project?{" "}
              <Link
                href="/project-planner"
                className="font-semibold text-accent-text hover:underline"
              >
                Plan Your Project →
              </Link>
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <a href="#platform-selector">Start Selector</a>
              </Button>
              <Button asChild variant="outline">
                <Link href="/platforms">Explore Platforms</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Section className="!py-10 sm:!py-12">
        <Container size="interactive">
          <PlatformSelector
              tool={{
                title: tool.title,
                slug: tool.slug,
                relatedTemplateSlugs: tool.relatedTemplateSlugs,
                relatedGuideSlugs: tool.relatedGuideSlugs,
                relatedChecklistSlugs: tool.relatedChecklistSlugs,
                relatedComparisonSlugs: tool.relatedComparisonSlugs,
              }}
            />
        </Container>
      </Section>

      <div className="print:hidden">
        <CTASection
          title="Still Not Sure Which Platform Fits?"
          description="The selector can narrow the options, but the final choice should account for your content, integrations, workflow and future requirements."
          primaryLabel="Tell Us About Your Project"
          primaryHref="/contact"
          secondaryLabel="Explore All Platforms"
          secondaryHref="/platforms"
        />
      </div>
    </>
  );
}
