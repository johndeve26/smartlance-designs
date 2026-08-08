import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { getPublishedTools, getToolQuestionCount } from "@/data/tools";
import { getPublishedComparisons } from "@/data/comparisons";
import { getPublishedTemplates } from "@/data/templates";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Practical Tools for Better Website Decisions",
  description:
    "Use simple interactive tools to clarify website requirements and make better-informed planning decisions.",
  path: "/tools",
});

export default function ToolsArchivePage() {
  const tools = getPublishedTools();
  const featured = tools.find((item) => item.featured) ?? tools[0];
  const comparison = getPublishedComparisons().find(
    (item) => item.slug === "wordpress-vs-webflow",
  );
  const briefTemplate = getPublishedTemplates().find(
    (item) => item.slug === "website-project-brief-template",
  );

  return (
    <>
      <StructuredData
        data={[
          webPageJsonLd({
            name: "Practical Tools for Better Website Decisions",
            description:
              "Use simple interactive tools to clarify website requirements and make better-informed planning decisions.",
            path: "/tools",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: "Tools", path: "/tools" },
          ]),
        ]}
      />

      <section className="border-b border-border bg-surface-muted">
        <Container className="!pt-10 !pb-12 sm:!pb-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Resources", href: "/resources" },
              { label: "Tools" },
            ]}
          />

          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Tools</p>
            <h1 className="mt-4 font-display text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              Practical Tools for Better Website Decisions
            </h1>
            <p className="mt-5 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
              Use simple interactive tools to clarify website requirements and
              make better-informed planning decisions.
            </p>
          </div>
        </Container>
      </section>

      {featured ? (
        <Section>
          <Container>
            <SectionHeader
              eyebrow="Featured tool"
              title="Start With Clearer Platform Requirements"
              description="Interactive decision aids that help you shortlist options — without fake scores or one-size-fits-all winners."
            />
            <article className="mt-10 max-w-3xl border-t border-border pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                Tool
              </p>
              <h2 className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
                <Link
                  href={`/tools/${featured.slug}`}
                  className="hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {featured.title}
                </Link>
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
                {featured.description}
              </p>
              <p className="mt-4 text-sm text-subtle">
                {getToolQuestionCount(featured)} questions
              </p>
              <Link
                href={`/tools/${featured.slug}`}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Start Platform Selector
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
              What Smartlance Tools Are For
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Tools help you clarify requirements and narrow options. They are
              not quizzes for entertainment, affiliate funnels, or guarantees.
              The platform should follow the requirements — not the other way
              around.
            </p>
            <ul className="mt-6 space-y-3 text-base leading-relaxed text-muted">
              <li>Shortlist platforms based on project needs</li>
              <li>Surface trade-offs instead of fake certainty</li>
              <li>Point you to deeper Guides, Templates and Comparisons</li>
            </ul>
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface-muted">
        <Container>
          <SectionHeader
            eyebrow="Related decision resources"
            title="Pair Tools With Deeper Planning"
            description="Use a Tool to narrow options, a Template to capture requirements, and a Comparison when two platforms both look plausible."
          />
          <ul className="mt-10 max-w-2xl space-y-5">
            {briefTemplate ? (
              <li>
                <Link
                  href={`/templates/${briefTemplate.slug}`}
                  className="font-semibold text-foreground hover:text-accent-text"
                >
                  {briefTemplate.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  Capture goals, audience, content and constraints before you
                  commit.
                </p>
              </li>
            ) : null}
            {comparison ? (
              <li>
                <Link
                  href={`/compare/${comparison.slug}`}
                  className="font-semibold text-foreground hover:text-accent-text"
                >
                  {comparison.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  Neutral trade-offs when WordPress and Webflow both deserve a
                  look.
                </p>
              </li>
            ) : null}
            <li>
              <Link
                href="/platforms"
                className="font-semibold text-foreground hover:text-accent-text"
              >
                Explore all Platforms
              </Link>
            </li>
          </ul>
        </Container>
      </Section>

      <CTASection
        title="Still Not Sure Which Platform Fits?"
        description="The selector can narrow options, but the final choice should account for your content, integrations, workflow and future requirements."
        primaryLabel="Tell Us About Your Project"
        primaryHref="/contact"
        secondaryLabel="Explore All Platforms"
        secondaryHref="/platforms"
      />
    </>
  );
}
