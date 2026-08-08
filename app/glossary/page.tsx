import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { GlossaryArchiveClient } from "@/components/glossary/glossary-archive-client";
import {
  getFeaturedGlossaryEntries,
  getGlossaryAlphabeticalGroups,
  getGlossaryCount,
  getGlossaryEntriesByTopicGroup,
  getGlossarySearchIndex,
  glossaryTopicGroups,
} from "@/data/glossary";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Website & SEO Glossary",
  description:
    "Clear explanations of the website, SEO, performance and conversion terms you may encounter while planning or improving a website.",
  path: "/glossary",
});

export default function GlossaryArchivePage() {
  const count = getGlossaryCount();
  const searchIndex = getGlossarySearchIndex();
  const featured = getFeaturedGlossaryEntries(4).map((entry) => ({
    slug: entry.slug,
    term: entry.term,
    acronym: entry.acronym,
    expansion: entry.expansion,
    aliases: entry.aliases ?? [],
    shortDefinition: entry.shortDefinition,
    topicGroup: entry.glossaryTopicGroup,
    topicLabel:
      glossaryTopicGroups.find((group) => group.id === entry.glossaryTopicGroup)
        ?.label ?? "",
  }));

  const alphabetical = getGlossaryAlphabeticalGroups().map((group) => ({
    letter: group.letter,
    terms: group.terms.map((entry) => ({
      slug: entry.slug,
      term: entry.term,
      acronym: entry.acronym,
      expansion: entry.expansion,
      aliases: entry.aliases ?? [],
      shortDefinition: entry.shortDefinition,
      topicGroup: entry.glossaryTopicGroup,
      topicLabel:
        glossaryTopicGroups.find(
          (topic) => topic.id === entry.glossaryTopicGroup,
        )?.label ?? "",
    })),
  }));

  const topicGroups = glossaryTopicGroups.map((group) => ({
    ...group,
    terms: getGlossaryEntriesByTopicGroup(group.id).map((entry) => ({
      slug: entry.slug,
      term: entry.term,
      acronym: entry.acronym,
      expansion: entry.expansion,
      aliases: entry.aliases ?? [],
      shortDefinition: entry.shortDefinition,
      topicGroup: entry.glossaryTopicGroup,
      topicLabel: group.label,
    })),
  }));

  return (
    <>
      <StructuredData
        data={[
          webPageJsonLd({
            name: "Website & SEO Glossary",
            description:
              "Clear explanations of the website, SEO, performance and conversion terms you may encounter while planning or improving a website.",
            path: "/glossary",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: "Glossary", path: "/glossary" },
          ]),
        ]}
      />

      <section className="border-b border-border bg-surface-muted">
        <Container className="!pt-10 !pb-12 sm:!pb-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Resources", href: "/resources" },
              { label: "Glossary" },
            ]}
          />

          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Glossary</p>
            <h1 className="mt-4 font-display text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              Website &amp; SEO Terms, Explained Clearly
            </h1>
            <p className="mt-5 max-w-xl text-base leading-[1.7] text-muted sm:text-lg">
              Clear explanations of the website, SEO, performance and conversion
              terms you may encounter while planning or improving a website.
            </p>
            <p className="mt-4 text-sm text-subtle">
              {count} {count === 1 ? "term" : "terms"}
            </p>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <GlossaryArchiveClient
            items={searchIndex}
            featured={featured}
            alphabetical={alphabetical}
            topicGroups={topicGroups}
          />
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <SectionHeader
            eyebrow="Resources"
            title="Need More Than a Definition?"
            description="Guides, comparisons and checklists go deeper when a term sits inside a larger website decision."
          />
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            <Link
              href="/guides"
              className="inline-flex items-center gap-1.5 font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Explore Guides
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Browse Resources
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Need Help Applying This to Your Website?"
        description="Explore practical website solutions or tell us what you are trying to improve."
        primaryLabel="Explore Website Solutions"
        primaryHref="/solutions"
        secondaryLabel="Tell Us About Your Website"
        secondaryHref="/contact"
      />
    </>
  );
}
