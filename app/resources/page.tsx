import type { Metadata } from "next";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import {
  ResourcesBrowseByGoal,
  ResourcesBrowseByTopic,
  ResourcesFeatured,
  ResourcesHero,
  ResourcesLatestInsights,
  ResourcesPlatformSelectorCallout,
  ResourcesReviewCta,
  ResourcesTypeExplainer,
} from "@/components/resources/resources-sections";
import { getPublishedGuides } from "@/data/guides";
import { getPublishedComparisons } from "@/data/comparisons";
import {
  getFeaturedResources,
  getLatestInsightResources,
} from "@/data/resources";
import { getPostBySlug } from "@/lib/blog";
import { buildManagedPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/structured-data";
import type { BlogPostMeta } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("resources", {
    title: "Website Resources, Guides & Insights",
    description:
      "Practical resources for planning, improving and growing websites — including website design, SEO, conversion, performance and platform guidance.",
    path: "/resources",
  });
}

function toPosts(slugs: string[]): BlogPostMeta[] {
  return slugs
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is NonNullable<typeof post> => post != null);
}

export default function ResourcesPage() {
  const featuredResources = getFeaturedResources(3);
  const guideSlug = featuredResources.find((r) => r.type === "guide")?.slug;
  const leadGuide = guideSlug
    ? getPublishedGuides().find((guide) => guide.slug === guideSlug)
    : null;

  const supportingComparison =
    getPublishedComparisons().find((item) => item.featured) ??
    getPublishedComparisons()[0] ??
    null;

  const insightFeatured = featuredResources.filter((r) => r.type === "insight");
  const supportingInsights = toPosts(insightFeatured.map((r) => r.slug)).slice(
    0,
    2,
  );
  const featuredInsightSlugs = new Set(supportingInsights.map((p) => p.slug));

  const latestResources = getLatestInsightResources(8);
  const latestPosts = toPosts(
    latestResources
      .map((r) => r.slug)
      .filter((slug) => !featuredInsightSlugs.has(slug)),
  ).slice(0, 6);

  return (
    <>
      <StructuredData
        data={[
          webPageJsonLd({
            name: "Website Resources, Guides & Insights",
            description:
              "Practical resources for planning, improving and growing websites — including website design, SEO, conversion, performance and platform guidance.",
            path: "/resources",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
          ]),
        ]}
      />

      <ResourcesHero />

      <ResourcesFeatured
        leadGuide={leadGuide || null}
        supportingComparison={supportingComparison}
        supportingInsights={supportingInsights}
      />

      <ResourcesPlatformSelectorCallout />

      <ResourcesBrowseByGoal />
      <ResourcesBrowseByTopic />
      <ResourcesLatestInsights posts={latestPosts} />
      <ResourcesTypeExplainer />
      <ResourcesReviewCta />

      <CTASection
        title="Ready to Put the Advice Into Practice?"
        description="Explore our services or tell us what you're trying to improve and we'll help you identify the most useful next step."
        primaryLabel="Explore Services"
        primaryHref="/services"
        secondaryLabel="Tell Us About Your Website"
        secondaryHref="/contact"
      />
    </>
  );
}
