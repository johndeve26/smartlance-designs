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
import { ChecklistCard } from "@/components/checklists/checklist-card";
import { GuideCard } from "@/components/guides/guide-body";
import {
  loadGuideBySlug,
  loadPublishedChecklists,
} from "@/lib/content/phase3-public";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Website Project Checklists",
  description:
    "Use structured checklists to plan, review and validate important website work without losing track of the details.",
  path: "/checklists",
});

export default async function ChecklistsArchivePage() {
  const checklists = await loadPublishedChecklists();
  const featured = checklists[0];
  const redesignGuide = await loadGuideBySlug("website-redesign-guide");

  return (
    <>
      <StructuredData
        data={[
          webPageJsonLd({
            name: "Website Project Checklists",
            description:
              "Use structured checklists to plan, review and validate important website work without losing track of the details.",
            path: "/checklists",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: "Checklists", path: "/checklists" },
          ]),
        ]}
      />

      <section className="border-b border-border bg-surface-muted">
        <Container className="!pt-10 !pb-12 sm:!pb-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Resources", href: "/resources" },
              { label: "Checklists" },
            ]}
          />

          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Checklists</p>
            <h1 className="mt-4 font-display text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              Practical Checklists for Better Website Projects
            </h1>
            <p className="mt-5 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
              Use structured checklists to plan, review and validate important
              website work without losing track of the details.
            </p>
          </div>
        </Container>
      </section>

      {featured ? (
        <Section>
          <Container>
            <SectionHeader
              eyebrow="Featured checklist"
              title="Start With a Clear Verification List"
              description="Scannable references for planning, QA and launch — designed to sit alongside Guides, not replace them."
            />
            <div className="mt-10 max-w-3xl">
              <ChecklistCard checklist={featured} variant="featured" />
            </div>
          </Container>
        </Section>
      ) : null}

      <Section tone="muted">
        <Container>
          <SectionHeader
            eyebrow="About Checklists"
            title="What Smartlance Checklists Are For"
            description="Checklists help teams verify what has been done and what still needs attention — without turning strategy into another long article."
          />
          <ul className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                label: "Verify",
                body: "Confirm strategy, content, SEO, UX and launch details before they are missed.",
              },
              {
                label: "Coordinate",
                body: "Give designers, developers, marketers and stakeholders a shared review list.",
              },
              {
                label: "Launch carefully",
                body: "Reduce omissions around redirects, forms, analytics and post-launch monitoring.",
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

      {redesignGuide ? (
        <Section>
          <Container>
            <SectionHeader
              eyebrow="Related Guide"
              title="Need the Reasoning Behind the Checklist?"
              description="The Complete Website Redesign Guide explains why each area matters. The Checklist helps you verify it."
            />
            <div className="mt-10 max-w-3xl">
              <GuideCard guide={redesignGuide} variant="compact" />
            </div>
            <p className="mt-8">
              <Link
                href="/resources"
                className="inline-flex items-center gap-1.5 text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Explore All Resources
                <ArrowRight className="h-4 w-4" />
              </Link>
            </p>
          </Container>
        </Section>
      ) : null}

      <section className="py-12 sm:py-14">
        <Container>
          <AudienceSubscribeSection
            source="CHECKLIST"
            sourceUrl="/checklists"
            variant="resource"
          />
        </Container>
      </section>

      <CTASection
        title="Planning a Website Redesign?"
        description="If you'd like another set of eyes on the current site before making major changes, we can review the website and help identify where the biggest issues may be."
        primaryLabel="Get a Free Website Review"
        primaryHref="/free-website-review"
        secondaryLabel="Tell Us About Your Project"
        secondaryHref="/contact"
      />
    </>
  );
}
