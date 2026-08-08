import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { GuideCard } from "@/components/guides/guide-body";
import { ComparisonCard } from "@/components/comparisons/comparison-hero";
import { getPublishedComparisons } from "@/data/comparisons";
import { getPublishedGuides } from "@/data/guides";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Website Platform Comparisons",
  description:
    "Understand the trade-offs between website platforms, tools and approaches before deciding what fits your project.",
  path: "/compare",
});

export default function CompareArchivePage() {
  const comparisons = getPublishedComparisons();
  const featured = comparisons[0];
  const redesignGuide = getPublishedGuides().find(
    (guide) => guide.slug === "website-redesign-guide",
  );

  return (
    <>
      <StructuredData
        data={[
          webPageJsonLd({
            name: "Website Platform Comparisons",
            description:
              "Understand the trade-offs between website platforms, tools and approaches before deciding what fits your project.",
            path: "/compare",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: "Comparisons", path: "/compare" },
          ]),
        ]}
      />

      <section className="border-b border-border bg-surface-muted">
        <Container className="!pt-10 !pb-12 sm:!pb-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Resources", href: "/resources" },
              { label: "Comparisons" },
            ]}
          />

          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Comparisons</p>
            <h1 className="mt-4 font-display text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              Compare Website Platforms Without the Sales Pitch
            </h1>
            <p className="mt-5 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
              Understand the trade-offs between website platforms, tools and
              approaches before deciding what fits your project.
            </p>
          </div>
        </Container>
      </section>

      {featured ? (
        <Section>
          <Container>
            <SectionHeader
              eyebrow="Featured comparison"
              title="Start With a Clear Trade-Off"
              description="Side-by-side guidance written to help you decide — not to declare a universal winner."
            />
            <div className="mt-10 max-w-4xl">
              <ComparisonCard comparison={featured} variant="featured" />
            </div>
          </Container>
        </Section>
      ) : null}

      <Section tone="muted">
        <Container>
          <SectionHeader
            eyebrow="Approach"
            title="What Makes a Useful Comparison?"
            description="Smartlance comparisons weigh requirements, workflow, flexibility, maintenance, growth and technical constraints — rather than declaring one product universally superior."
          />
          <ul className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                label: "Requirements first",
                body: "Content, design, integrations and management needs come before platform preference.",
              },
              {
                label: "Trade-offs, not scores",
                body: "Each option makes some work easier and places different responsibilities on your team.",
              },
              {
                label: "Implementation matters",
                body: "A capable platform with weak structure or maintenance can still produce a poor website.",
              },
            ].map((item) => (
              <li key={item.label}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
                  {item.label}
                </p>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader
              eyebrow="Platforms"
              title="Explore Platforms"
              description="See how Smartlance approaches WordPress, Webflow and other website platforms."
              className="mb-0"
            />
            <Link
              href="/platforms"
              className="inline-flex items-center gap-1.5 self-start text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              View All Platforms
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>

      {redesignGuide ? (
        <Section tone="muted">
          <Container>
            <SectionHeader
              eyebrow="Related resources"
              title="Also Useful When Platform Choice Is Part of a Redesign"
              description="Changing platforms is a migration decision — not only a design preference."
            />
            <div className="mt-10 max-w-3xl">
              <GuideCard guide={redesignGuide} variant="compact" />
            </div>
          </Container>
        </Section>
      ) : null}

      <CTASection
        title="Still Deciding Between Platforms?"
        description="Tell us what the website needs to do, who will manage it and what you expect to add later. We can help you evaluate the platform before the build starts."
        primaryLabel="Tell Us About Your Project"
        primaryHref="/contact"
        secondaryLabel="Explore Platforms"
        secondaryHref="/platforms"
      />
    </>
  );
}
