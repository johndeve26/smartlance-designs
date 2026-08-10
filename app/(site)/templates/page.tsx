import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AudienceSubscribeSection } from "@/components/audience/subscribe-section-server";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import {
  loadChecklistBySlug,
  loadGuideBySlug,
  loadPublishedTemplates,
} from "@/lib/content/phase3-public";
import type { TemplateListingContent } from "@/lib/resources/discovery";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Templates for Planning Better Website Projects",
  description:
    "Reusable planning resources to help organize requirements, content, decisions and project information before website work begins.",
  path: "/templates",
});

function templateSectionCount(template: TemplateListingContent) {
  return template.listingSectionCount ?? template.sections.length;
}

export default async function TemplatesArchivePage() {
  const templates = await loadPublishedTemplates();
  const featured =
    (templates.find((item) => item.featured) as TemplateListingContent | undefined) ??
    (templates[0] as TemplateListingContent | undefined);
  const redesignGuide = await loadGuideBySlug("website-redesign-guide");
  const redesignChecklist = await loadChecklistBySlug("website-redesign-checklist");

  return (
    <>
      <StructuredData
        data={[
          webPageJsonLd({
            name: "Templates for Planning Better Website Projects",
            description:
              "Reusable planning resources to help organize requirements, content, decisions and project information before website work begins.",
            path: "/templates",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: "Templates", path: "/templates" },
          ]),
        ]}
      />

      <section className="border-b border-border bg-surface-muted">
        <Container className="!pt-10 !pb-12 sm:!pb-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Resources", href: "/resources" },
              { label: "Templates" },
            ]}
          />

          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Templates</p>
            <h1 className="mt-4 font-display text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              Templates for Planning Better Website Projects
            </h1>
            <p className="mt-5 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
              Reusable planning resources to help organize requirements,
              content, decisions and project information before website work
              begins.
            </p>
          </div>
        </Container>
      </section>

      {featured ? (
        <Section>
          <Container>
            <SectionHeader
              eyebrow="Featured template"
              title="Start With a Clear Project Brief"
              description="Fillable worksheets you can complete in the browser, save locally, copy and print — without an account."
            />
            <article className="mt-10 max-w-3xl border-t border-border pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                Template
              </p>
              <h2 className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
                <Link
                  href={`/templates/${featured.slug}`}
                  className="hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {featured.title}
                </Link>
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
                {featured.description}
              </p>
              <p className="mt-4 text-sm text-subtle">
                {templateSectionCount(featured)} sections
              </p>
              <Link
                href={`/templates/${featured.slug}`}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Use Template
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          </Container>
        </Section>
      ) : null}

      <Section className="!pt-0">
        <Container>
          <div className="max-w-2xl border-t border-border pt-12">
            <h2 className="font-display text-[1.5rem] font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
              What Smartlance Templates Are For
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Templates capture decisions — goals, audience, pages,
              functionality and constraints — so you can hand a clear brief to a
              designer, developer, agency or internal team. They are not Guides,
              Checklists, or contact forms.
            </p>
            <ul className="mt-6 space-y-3 text-base leading-relaxed text-muted">
              <li>Define requirements before requesting proposals</li>
              <li>Align stakeholders on scope and priorities</li>
              <li>Prepare useful context before a rebuild or new site</li>
            </ul>
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface-muted">
        <Container>
          <SectionHeader
            eyebrow="Related planning resources"
            title="Guides and Checklists That Pair Well"
            description="Use a Template to capture decisions, a Guide for deeper strategy, and a Checklist when you are verifying work."
          />
          <ul className="mt-10 max-w-2xl space-y-5">
            {redesignGuide ? (
              <li>
                <Link
                  href={`/guides/${redesignGuide.slug}`}
                  className="font-semibold text-foreground hover:text-accent-text"
                >
                  {redesignGuide.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  Long-form guidance for redesign and rebuild decisions.
                </p>
              </li>
            ) : null}
            {redesignChecklist ? (
              <li>
                <Link
                  href={`/checklists/${redesignChecklist.slug}`}
                  className="font-semibold text-foreground hover:text-accent-text"
                >
                  {redesignChecklist.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  Verification items for planning, QA and launch.
                </p>
              </li>
            ) : null}
            <li>
              <Link
                href="/resources"
                className="font-semibold text-foreground hover:text-accent-text"
              >
                Browse all Resources
              </Link>
            </li>
          </ul>
        </Container>
      </Section>

      <section className="py-12 sm:py-14">
        <Container>
          <AudienceSubscribeSection
            source="TEMPLATE"
            sourceUrl="/templates"
            variant="resource"
          />
        </Container>
      </section>

      <CTASection
        title="Need Help Turning a Brief Into a Website Plan?"
        description="Share what you already know about the project and we can help clarify scope, platform and next steps."
        primaryLabel="Tell Us About Your Project"
        primaryHref="/contact"
        secondaryLabel="Explore Website Solutions"
        secondaryHref="/solutions"
      />
    </>
  );
}
