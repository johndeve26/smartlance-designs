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
import {
  loadPublishedComparisons,
  loadPublishedGuides,
  loadPublishedInsights,
  loadPublishedTools,
  loadResourceDiscoveryCounts,
} from "@/lib/content/phase3-public";
import { getPublicResourceHref } from "@/lib/resources/discovery";
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

export default async function ResourcesPage() {
  const [guides, comparisons, insights, tools, counts] = await Promise.all([
    loadPublishedGuides(),
    loadPublishedComparisons(),
    loadPublishedInsights(),
    loadPublishedTools(),
    loadResourceDiscoveryCounts(),
  ]);

  const leadGuide =
    guides.find((guide) => guide.featured) ??
    guides.find((guide) => guide.slug === "website-redesign-guide") ??
    guides[0] ??
    null;

  const supportingComparison =
    comparisons.find((item) => item.featured) ?? comparisons[0] ?? null;

  const platformSelector = tools.find(
    (tool) => tool.slug === "website-platform-selector",
  );
  const toolHref = platformSelector
    ? getPublicResourceHref("tool", platformSelector.slug)
    : null;

  const insightPosts = insights as BlogPostMeta[];
  const featuredInsightSlugs = new Set(
    [
      "what-makes-a-website-convert",
      "website-redesign-checklist",
      "technical-seo-foundations",
      "tools-to-test-wordpress-website",
    ].filter((slug) => insightPosts.some((post) => post.slug === slug)),
  );

  const supportingInsights = insightPosts
    .filter((post) => featuredInsightSlugs.has(post.slug))
    .slice(0, 2);

  const latestPosts = insightPosts
    .filter((post) => !featuredInsightSlugs.has(post.slug))
    .slice(0, 6);

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

      <ResourcesHero counts={counts} insightCount={insightPosts.length} />

      <ResourcesFeatured
        leadGuide={leadGuide}
        supportingComparison={supportingComparison}
        supportingInsights={supportingInsights}
      />

      <ResourcesPlatformSelectorCallout toolHref={toolHref} />

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
