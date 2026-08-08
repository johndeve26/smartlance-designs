import type { Metadata } from "next";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import {
  IndustriesFeaturedExperience,
  IndustriesFundamentals,
  IndustriesHero,
  IndustriesJourneys,
  IndustriesSelectedWork,
  IndustriesSupporting,
} from "@/components/industries/industries-sections";
import {
  featuredIndustryGroups,
  industriesSelectedWorkSlugs,
} from "@/data/industries";
import { loadPublishedWork } from "@/lib/content/phase3-public";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import type { Project } from "@/types";

export const metadata: Metadata = buildMetadata({
  title: "Website & SEO Experience by Industry",
  description:
    "Smartlance Designs builds websites and SEO strategies around how different businesses work — with hands-on experience across hospitality, short-term rentals, property management and real estate.",
  path: "/industries",
});

export default async function IndustriesPage() {
  const visible = await loadPublishedWork();
  const projectsBySlug = new Map(
    visible.map((project) => [project.slug, project]),
  );

  const heroProjects = resolveUniqueProjects(
    [
      "the-coast",
      "gemini-corporate-relocations",
      "overlook-cabin-rentals",
      ...featuredIndustryGroups.flatMap((group) => group.projectSlugs),
    ],
    projectsBySlug,
    3,
  );

  const selectedWork = industriesSelectedWorkSlugs
    .map((slug) => projectsBySlug.get(slug))
    .filter((project): project is Project => Boolean(project));

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
        ])}
      />

      <IndustriesHero projects={heroProjects} />
      <IndustriesFeaturedExperience projectsBySlug={projectsBySlug} />
      <IndustriesJourneys />
      <IndustriesSupporting />
      <IndustriesSelectedWork projects={selectedWork} />
      <IndustriesFundamentals />

      <CTASection
        title="Don't See Your Industry Here?"
        description="That doesn't mean we can't help. Tell us how your business works and what you need your website to achieve."
        primaryLabel="Tell Us About Your Project"
        primaryHref="/contact"
        secondaryLabel="Get a Free Website Review"
        secondaryHref="/free-website-review"
      />
    </>
  );
}

function resolveUniqueProjects(
  slugs: string[],
  projectsBySlug: Map<string, Project>,
  limit: number,
) {
  const seen = new Set<string>();
  const result: Project[] = [];

  for (const slug of slugs) {
    if (seen.has(slug)) continue;
    const project = projectsBySlug.get(slug);
    if (!project) continue;
    seen.add(slug);
    result.push(project);
    if (result.length >= limit) break;
  }

  return result;
}
