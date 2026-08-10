import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { BlogMarkdown } from "@/components/blog/blog-markdown";
import { GlossaryVisual } from "@/components/glossary/glossary-visuals";
import {
  loadGlossaryBySlug,
  loadGuideBySlug,
  loadPublishedGlossary,
} from "@/lib/content/phase3-public";
import {
  resolveAdjacentGlossaryEntries,
  resolveRelatedGlossaryEntries,
} from "@/lib/resources/discovery";
import { glossaryTopicGroups } from "@/data/glossary";
import { getSolutionBySlug, getSolutionHref } from "@/data/solutions";
import { getServiceBySlug } from "@/data/services";
import { buildResourcePageMetadata } from "@/lib/seo/resource-metadata";
import {
  breadcrumbJsonLd,
  definedTermJsonLd,
} from "@/lib/structured-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const entries = await loadPublishedGlossary();
  return entries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await loadGlossaryBySlug(slug);
  if (!entry) return {};
  return buildResourcePageMetadata({
    kind: "glossary",
    slug: entry.slug,
    path: `/glossary/${entry.slug}`,
    fallbackTitle: entry.seoTitle || `What Is ${entry.term}?`,
    fallbackDescription: entry.seoDescription || entry.shortDefinition,
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function GlossaryTermPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await loadGlossaryBySlug(slug);
  if (!entry) notFound();

  const publishedGlossary = await loadPublishedGlossary();
  const topicLabel =
    glossaryTopicGroups.find((group) => group.id === entry.glossaryTopicGroup)
      ?.label ?? "";
  const relatedTerms = resolveRelatedGlossaryEntries(entry, publishedGlossary);
  const { previous, next } = resolveAdjacentGlossaryEntries(
    entry.slug,
    publishedGlossary,
  );

  const relatedSolutions = (entry.relatedSolutionSlugs ?? [])
    .map((solutionSlug) => getSolutionBySlug(solutionSlug))
    .filter((solution) => solution?.published)
    .slice(0, 2);

  const relatedServices = (entry.relatedServiceHrefs ?? [])
    .map((href) => getServiceBySlug(href.replace(/^\/services\//, "")))
    .filter((service): service is NonNullable<typeof service> => Boolean(service))
    .slice(0, 2);

  const relatedGuides = (
    await Promise.all(
      (entry.relatedGuideSlugs ?? []).map((guideSlug) => loadGuideBySlug(guideSlug)),
    )
  )
    .filter((guide): guide is NonNullable<typeof guide> => Boolean(guide))
    .slice(0, 1);

  const relatedSeo = entry.relatedSeoHrefs ?? [];

  const ctaSecondaryHref =
    entry.glossaryTopicGroup === "performance"
      ? "/solutions/slow-website"
      : "/contact";
  const ctaSecondaryLabel =
    entry.glossaryTopicGroup === "performance"
      ? "Explore Slow Website"
      : "Tell Us About Your Website";

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: "Glossary", path: "/glossary" },
            { name: entry.term, path: `/glossary/${entry.slug}` },
          ]),
          definedTermJsonLd({
            name: entry.term,
            description: entry.shortDefinition,
            path: `/glossary/${entry.slug}`,
          }),
        ]}
      />

      <header className="border-b border-border bg-surface">
        <Container className="pt-8 pb-10 sm:pb-12">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Resources", href: "/resources" },
              { label: "Glossary", href: "/glossary" },
              { label: entry.term },
            ]}
          />

          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
              Glossary
            </p>
            <h1 className="mt-3.5 font-display text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
              <dfn className="not-italic">{entry.term}</dfn>
            </h1>
            {entry.expansion ? (
              <p className="mt-3 text-lg text-muted sm:text-xl">
                {entry.expansion}
              </p>
            ) : null}
            <p className="mt-5 text-[1.25rem] leading-relaxed text-foreground sm:text-[1.375rem]">
              {entry.shortDefinition}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              {topicLabel ? (
                <>
                  <span className="font-medium text-foreground">{topicLabel}</span>
                  <span aria-hidden className="text-subtle">
                    ·
                  </span>
                </>
              ) : null}
              <span>Smartlance Designs</span>
              <span aria-hidden className="text-subtle">
                ·
              </span>
              <time dateTime={entry.publishedAt}>
                {formatDate(entry.publishedAt)}
              </time>
            </div>
          </div>
        </Container>
      </header>

      <Section className="!pt-10 !pb-12 sm:!pt-12 sm:!pb-16">
        <Container>
          <article>
            <section>
              <h2 className="font-display text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
                What Is {entry.term}?
              </h2>
              <div className="prose-smartlance mt-4">
                <BlogMarkdown content={entry.fullExplanation} />
              </div>
              {entry.visual ? <GlossaryVisual visual={entry.visual} /> : null}
            </section>

            {entry.whyItMatters ? (
              <section className="mt-12">
                <h2 className="font-display text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
                  Why It Matters
                </h2>
                <div className="prose-smartlance mt-4">
                  <BlogMarkdown content={entry.whyItMatters} />
                </div>
              </section>
            ) : null}

            {entry.example ? (
              <section className="mt-12">
                <h2 className="font-display text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
                  Where You Encounter It
                </h2>
                <div className="prose-smartlance mt-4">
                  <BlogMarkdown content={entry.example} />
                </div>
              </section>
            ) : null}

            {entry.commonMisconceptions?.length ? (
              <section className="mt-12">
                <h2 className="font-display text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
                  Common Misunderstandings
                </h2>
                <ul className="mt-5 space-y-4">
                  {entry.commonMisconceptions.map((item) => (
                    <li
                      key={item}
                      className="rounded-xl border border-border bg-surface-muted px-5 py-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {entry.sections?.map((section) => (
              <section key={section.id} className="mt-12">
                <h2
                  id={section.id}
                  className="scroll-mt-28 font-display text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]"
                >
                  {section.title}
                </h2>
                <div className="prose-smartlance mt-4">
                  <BlogMarkdown content={section.body} />
                </div>
              </section>
            ))}

            {relatedTerms.length > 0 ? (
              <section className="mt-14 border-t border-border pt-10">
                <h2 className="font-display text-xl font-semibold text-foreground sm:text-[1.375rem]">
                  Related Terms
                </h2>
                <ul className="mt-4 space-y-3">
                  {relatedTerms.map((term) => (
                    <li key={term.slug}>
                      <Link
                        href={`/glossary/${term.slug}`}
                        className="font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {term.term}
                        {term.expansion ? (
                          <span className="font-normal text-muted">
                            {" "}
                            — {term.expansion}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(relatedSolutions.length > 0 ||
              relatedServices.length > 0 ||
              relatedGuides.length > 0 ||
              relatedSeo.length > 0) && (
              <section className="mt-10 border-t border-border pt-10">
                <h2 className="font-display text-xl font-semibold text-foreground sm:text-[1.375rem]">
                  Related Resources
                </h2>
                <ul className="mt-4 space-y-3">
                  {relatedSeo.map((href) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {href === "/seo"
                          ? "SEO Overview"
                          : href === "/seo/technical-seo"
                            ? "Technical SEO"
                            : href}
                      </Link>
                    </li>
                  ))}
                  {relatedGuides.map((guide) => (
                    <li key={guide.slug}>
                      <Link
                        href={`/guides/${guide.slug}`}
                        className="font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {guide.title}
                      </Link>
                    </li>
                  ))}
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
              </section>
            )}

            {(previous || next) && (
              <nav
                aria-label="Adjacent glossary terms"
                className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between"
              >
                {previous ? (
                  <Link
                    href={`/glossary/${previous.slug}`}
                    className="text-sm font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    ← {previous.term}
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/glossary/${next.slug}`}
                    className="text-sm font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-right"
                  >
                    {next.term} →
                  </Link>
                ) : null}
              </nav>
            )}
          </article>
        </Container>
      </Section>

      <CTASection
        title="Need Help Applying This to Your Website?"
        description="Explore practical website solutions or tell us what you are trying to improve."
        primaryLabel="Explore Website Solutions"
        primaryHref="/solutions"
        secondaryLabel={ctaSecondaryLabel}
        secondaryHref={ctaSecondaryHref}
      />
    </>
  );
}
