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
import { GuideCard } from "@/components/guides/guide-body";
import { loadPublishedGuides } from "@/lib/content/phase3-public";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Website Guides for Planning, SEO & Growth",
  description:
    "Long-form practical guidance for planning, improving and managing websites, SEO, conversion and digital growth.",
  path: "/guides",
});

export default async function GuidesArchivePage() {
  const guides = await loadPublishedGuides();
  const featured = guides[0];

  return (
    <>
      <StructuredData
        data={[
          webPageJsonLd({
            name: "Website Guides for Planning, SEO & Growth",
            description:
              "Long-form practical guidance for planning, improving and managing websites, SEO, conversion and digital growth.",
            path: "/guides",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: "Guides", path: "/guides" },
          ]),
        ]}
      />

      <section className="border-b border-border bg-surface-muted">
        <Container className="!pt-10 !pb-12 sm:!pb-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Resources", href: "/resources" },
              { label: "Guides" },
            ]}
          />

          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Guides</p>
            <h1 className="mt-4 font-display text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              Detailed Guides for Better Website Decisions
            </h1>
            <p className="mt-5 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
              Long-form practical guidance for planning, improving and managing
              websites, SEO, conversion and digital growth.
            </p>
          </div>
        </Container>
      </section>

      {featured ? (
        <Section>
          <Container>
            <SectionHeader
              eyebrow="Current guides"
              title="Featured Guide"
              description="Start with a cornerstone reference — written to help you plan carefully before you change the website."
            />
            <div className="mt-10 max-w-4xl">
              <GuideCard guide={featured} variant="featured" />
            </div>
          </Container>
        </Section>
      ) : null}

      <Section tone="muted">
        <Container>
          <SectionHeader
            eyebrow="About Guides"
            title="What Smartlance Guides Are For"
            description="Guides are evergreen references for larger decisions — deeper than Insights, and focused on planning rather than selling a single service."
          />
          <ul className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                label: "Plan",
                body: "Clarify goals, scope and sequence before design or development begins.",
              },
              {
                label: "Protect",
                body: "Preserve useful content, URLs, SEO foundations and working integrations.",
              },
              {
                label: "Decide",
                body: "Choose between refresh, redesign, rebuild, platform change and launch priorities.",
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
              eyebrow="Insights"
              title="Explore Insights"
              description="Shorter practical articles on websites, SEO and growth — including checklist-style notes that complement this Guide."
              className="mb-0"
            />
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 self-start text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              View All Insights
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>

      <section className="py-12 sm:py-14">
        <Container>
          <AudienceSubscribeSection source="GUIDE" sourceUrl="/guides" variant="resource" />
        </Container>
      </section>

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
