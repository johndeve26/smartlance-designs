/**
 * Resources content architecture.
 * RESOURCE TYPES COMPLETE — 7/7 LIVE:
 * Insights, Guides, Comparisons, Checklists, Glossary, Templates, Tools.
 */

import type { BlogCategory, BlogPostMeta } from "@/types";
import type {
  GuideContent,
  ComparisonContent,
  ChecklistContent,
  GlossaryContent,
  TemplateContent,
  ToolContent,
} from "@/data/resource-content-types";
import { getPublishedGuides } from "@/data/guides";
import { getPublishedComparisons } from "@/data/comparisons";
import { getPublishedChecklists } from "@/data/checklists";
import { getPublishedGlossaryEntries } from "@/data/glossary";
import { getPublishedTemplates } from "@/data/templates";
import { getPublishedTools } from "@/data/tools";
import { getAllPosts, getFeaturedInsightsPosts } from "@/lib/blog";

export type ResourceType =
  | "insight"
  | "guide"
  | "comparison"
  | "checklist"
  | "glossary"
  | "template"
  | "tool";

export type ResourceTopicId =
  | "website-design"
  | "website-development"
  | "seo"
  | "conversion"
  | "ecommerce"
  | "website-performance"
  | "platforms"
  | "digital-marketing"
  | "hospitality-vacation-rentals";

/** Future-ready Resource record — Insights adapt from Blog; Guides from guides registry. */
export type Resource = {
  id: string;
  title: string;
  slug: string;
  type: ResourceType;
  description: string;
  published: boolean;
  featured?: boolean;
  href: string;
  topicIds: ResourceTopicId[];
  relatedServiceHrefs?: string[];
  relatedPlatformSlugs?: string[];
  relatedIndustrySlugs?: string[];
  relatedSolutionSlugs?: string[];
  image?: string;
  imageAlt?: string;
  publishedAt?: string;
  updatedAt?: string;
  readingTime?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
};

export type ResourceTypeConfig = {
  type: ResourceType;
  label: string;
  description: string;
  /** When true, an archive destination is public */
  published: boolean;
  archivePath: string | null;
  shortLabel?: string;
};

export type ResourceTopic = {
  id: ResourceTopicId;
  label: string;
  description: string;
  /** Stable blog category filter when one exists */
  blogCategory?: BlogCategory;
  /** Non-blog destination when topic maps to another hub */
  href?: string;
};

export type ResourceGoal = {
  id: string;
  label: string;
  description: string;
  href: string;
};

export const resourceTypeConfigs: ResourceTypeConfig[] = [
  {
    type: "insight",
    label: "Insights",
    description:
      "Practical articles and observations on websites, SEO and growth.",
    published: true,
    archivePath: "/blog",
    shortLabel: "INSIGHT",
  },
  {
    type: "guide",
    label: "Guides",
    description:
      "Long-form evergreen references for planning major website decisions.",
    published: true,
    archivePath: "/guides",
    shortLabel: "GUIDE",
  },
  {
    type: "comparison",
    label: "Comparisons",
    description:
      "Side-by-side trade-offs when choosing between platforms or approaches.",
    published: true,
    archivePath: "/compare",
    shortLabel: "COMPARISON",
  },
  {
    type: "checklist",
    label: "Checklists",
    description:
      "Interactive verification lists for planning, QA and launch — not long-form guides.",
    published: true,
    archivePath: "/checklists",
    shortLabel: "CHECKLIST",
  },
  {
    type: "glossary",
    label: "Glossary",
    description:
      "Plain-English reference definitions for website, SEO and conversion terms.",
    published: true,
    archivePath: "/glossary",
    shortLabel: "GLOSSARY",
  },
  {
    type: "template",
    label: "Templates",
    description:
      "Fillable worksheets to capture project requirements before work begins.",
    published: true,
    archivePath: "/templates",
    shortLabel: "TEMPLATE",
  },
  {
    type: "tool",
    label: "Tools",
    description:
      "Interactive decision aids that shortlist options from your requirements.",
    published: true,
    archivePath: "/tools",
    shortLabel: "TOOL",
  },
];

export const resourceTopics: ResourceTopic[] = [
  {
    id: "website-design",
    label: "Website Design",
    description: "Structure, clarity and visual systems that support the business.",
    blogCategory: "Website Design",
  },
  {
    id: "website-development",
    label: "Website Development",
    description: "Builds, platforms and technical foundations.",
    blogCategory: "Website Development",
  },
  {
    id: "seo",
    label: "SEO",
    description: "Search visibility, structure and technical foundations.",
    blogCategory: "SEO",
  },
  {
    id: "conversion",
    label: "Conversion",
    description: "Turning visits into enquiries, bookings and sales.",
    blogCategory: "Conversion",
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    description: "Product discovery, shopping journeys and store experience.",
    blogCategory: "E-commerce",
  },
  {
    id: "website-performance",
    label: "Website Performance",
    description: "Speed, responsiveness and page experience.",
    blogCategory: "Performance",
  },
  {
    id: "platforms",
    label: "Platforms",
    description: "Choosing and working with the right website platform.",
    href: "/platforms",
  },
  {
    id: "digital-marketing",
    label: "Digital Marketing",
    description: "Campaign and marketing support around the website.",
    blogCategory: "Digital Marketing",
  },
  {
    id: "hospitality-vacation-rentals",
    label: "Hospitality & Vacation Rentals",
    description: "Websites and discovery for hospitality and rental businesses.",
    blogCategory: "Vacation Rentals",
  },
];

export const resourceGoals: ResourceGoal[] = [
  {
    id: "plan-new-website",
    label: "Plan a New Website",
    description: "Start with goals, audience and structure before design.",
    href: "/solutions/new-business-website",
  },
  {
    id: "improve-search",
    label: "Improve Search Visibility",
    description: "Help the right people find the website.",
    href: "/solutions/website-not-ranking",
  },
  {
    id: "increase-conversions",
    label: "Increase Website Conversions",
    description: "Reduce friction between interest and action.",
    href: "/solutions/low-website-conversions",
  },
  {
    id: "improve-performance",
    label: "Improve Website Performance",
    description: "Make important pages feel faster and more usable.",
    href: "/solutions/slow-website",
  },
  {
    id: "choose-platform",
    label: "Choose a Platform",
    description: "Match requirements to WordPress, Shopify, Webflow and more.",
    href: "/platforms",
  },
  {
    id: "redesign",
    label: "Redesign an Existing Website",
    description: "Decide whether a refresh, redesign or rebuild fits.",
    href: "/solutions/outdated-website",
  },
  {
    id: "online-store",
    label: "Improve an Online Store",
    description: "Strengthen discovery, product experience and checkout.",
    href: "/solutions/ecommerce-growth",
  },
  {
    id: "local-customers",
    label: "Reach More Local Customers",
    description: "Improve local discovery, trust and contact paths.",
    href: "/solutions/local-business-visibility",
  },
];

/** Formats explained on the hub even when archives are not live yet */
export const explainedResourceTypes: ResourceType[] = [
  "insight",
  "guide",
  "comparison",
  "checklist",
  "glossary",
  "template",
  "tool",
];

const BLOG_CATEGORY_TO_TOPICS: Partial<
  Record<BlogCategory, ResourceTopicId[]>
> = {
  "Website Design": ["website-design"],
  "Website Development": ["website-development"],
  SEO: ["seo"],
  Conversion: ["conversion"],
  Performance: ["website-performance"],
  "Digital Marketing": ["digital-marketing"],
  "Vacation Rentals": ["hospitality-vacation-rentals"],
  Hospitality: ["hospitality-vacation-rentals"],
  "E-commerce": ["ecommerce"],
  "Business Growth": ["conversion", "digital-marketing"],
};

const FEATURED_INSIGHT_SLUGS = [
  "what-makes-a-website-convert",
  "website-redesign-checklist",
  "technical-seo-foundations",
  "tools-to-test-wordpress-website",
] as const;

export function getResourceTypeConfig(type: ResourceType) {
  return resourceTypeConfigs.find((item) => item.type === type);
}

export function getPublishedResourceTypes() {
  return resourceTypeConfigs.filter(
    (item) => item.published && Boolean(item.archivePath),
  );
}

export function getTopicHref(topic: ResourceTopic) {
  if (topic.href) return topic.href;
  if (topic.blogCategory) {
    return `/blog?category=${encodeURIComponent(topic.blogCategory)}`;
  }
  return "/blog";
}

export function insightFromBlogPost(post: BlogPostMeta): Resource {
  return {
    id: `insight-${post.slug}`,
    title: post.title,
    slug: post.slug,
    type: "insight",
    description: post.description,
    published: post.published !== false,
    featured: post.featured,
    href: `/blog/${post.slug}`,
    topicIds: BLOG_CATEGORY_TO_TOPICS[post.category] ?? [],
    relatedServiceHrefs: post.relatedServiceHrefs,
    image: post.heroImage,
    imageAlt: post.heroImageAlt,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    readingTime: post.readingTime,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    tags: post.tags,
  };
}

export function guideToResource(guide: GuideContent): Resource {
  return {
    id: `guide-${guide.slug}`,
    title: guide.title,
    slug: guide.slug,
    type: "guide",
    description: guide.description,
    published: guide.published,
    featured: guide.featured,
    href: `/guides/${guide.slug}`,
    topicIds: guide.topicIds,
    relatedServiceHrefs: guide.relatedServiceHrefs,
    relatedSolutionSlugs: guide.relatedSolutionSlugs,
    image: guide.heroImage,
    imageAlt: guide.heroImageAlt,
    publishedAt: guide.publishedAt,
    updatedAt: guide.updatedAt,
    readingTime: guide.readingTime,
    seoTitle: guide.seoTitle,
    seoDescription: guide.seoDescription,
  };
}

export function comparisonToResource(
  comparison: ComparisonContent,
): Resource {
  return {
    id: `comparison-${comparison.slug}`,
    title: comparison.title,
    slug: comparison.slug,
    type: "comparison",
    description: comparison.description,
    published: comparison.published,
    featured: comparison.featured,
    href: `/compare/${comparison.slug}`,
    topicIds: comparison.topicIds,
    relatedServiceHrefs: comparison.relatedServiceHrefs,
    relatedPlatformSlugs: comparison.relatedPlatformSlugs,
    relatedSolutionSlugs: comparison.relatedSolutionSlugs,
    publishedAt: comparison.publishedAt,
    updatedAt: comparison.updatedAt,
    readingTime: comparison.readingTime,
    seoTitle: comparison.seoTitle,
    seoDescription: comparison.seoDescription,
  };
}

export function checklistToResource(checklist: ChecklistContent): Resource {
  return {
    id: `checklist-${checklist.slug}`,
    title: checklist.title,
    slug: checklist.slug,
    type: "checklist",
    description: checklist.description,
    published: checklist.published,
    featured: checklist.featured,
    href: `/checklists/${checklist.slug}`,
    topicIds: checklist.topicIds,
    relatedServiceHrefs: checklist.relatedServiceHrefs,
    relatedSolutionSlugs: checklist.relatedSolutionSlugs,
    publishedAt: checklist.publishedAt,
    updatedAt: checklist.updatedAt,
    seoTitle: checklist.seoTitle,
    seoDescription: checklist.seoDescription,
  };
}

export function glossaryToResource(entry: GlossaryContent): Resource {
  return {
    id: `glossary-${entry.slug}`,
    title: entry.term,
    slug: entry.slug,
    type: "glossary",
    description: entry.shortDefinition,
    published: entry.published,
    featured: entry.featured,
    href: `/glossary/${entry.slug}`,
    topicIds: entry.topicIds,
    relatedServiceHrefs: entry.relatedServiceHrefs,
    relatedSolutionSlugs: entry.relatedSolutionSlugs,
    publishedAt: entry.publishedAt,
    updatedAt: entry.updatedAt,
    seoTitle: entry.seoTitle,
    seoDescription: entry.seoDescription,
  };
}

export function templateToResource(template: TemplateContent): Resource {
  return {
    id: `template-${template.slug}`,
    title: template.title,
    slug: template.slug,
    type: "template",
    description: template.description,
    published: template.published,
    featured: template.featured,
    href: `/templates/${template.slug}`,
    topicIds: template.topicIds,
    relatedServiceHrefs: template.relatedServiceHrefs,
    relatedSolutionSlugs: template.relatedSolutionSlugs,
    publishedAt: template.publishedAt,
    updatedAt: template.updatedAt,
    seoTitle: template.seoTitle,
    seoDescription: template.seoDescription,
  };
}

export function toolToResource(tool: ToolContent): Resource {
  return {
    id: `tool-${tool.slug}`,
    title: tool.title,
    slug: tool.slug,
    type: "tool",
    description: tool.description,
    published: tool.published,
    featured: tool.featured,
    href: `/tools/${tool.slug}`,
    topicIds: tool.topicIds,
    relatedServiceHrefs: tool.relatedServiceHrefs,
    relatedSolutionSlugs: tool.relatedSolutionSlugs,
    publishedAt: tool.publishedAt,
    updatedAt: tool.updatedAt,
    seoTitle: tool.seoTitle,
    seoDescription: tool.seoDescription,
  };
}

/** All published Insights adapted from the Blog source of truth */
export function getPublishedInsightResources(): Resource[] {
  return getAllPosts().map(insightFromBlogPost);
}

export function getPublishedGuideResources(): Resource[] {
  return getPublishedGuides().map(guideToResource);
}

export function getPublishedComparisonResources(): Resource[] {
  return getPublishedComparisons().map(comparisonToResource);
}

export function getPublishedChecklistResources(): Resource[] {
  return getPublishedChecklists().map(checklistToResource);
}

export function getPublishedGlossaryResources(): Resource[] {
  return getPublishedGlossaryEntries().map(glossaryToResource);
}

export function getPublishedTemplateResources(): Resource[] {
  return getPublishedTemplates().map(templateToResource);
}

export function getPublishedToolResources(): Resource[] {
  return getPublishedTools().map(toolToResource);
}

/**
 * All published Resource types (Insights through Tools).
 */
export function getPublishedResources(): Resource[] {
  return [
    ...getPublishedGuideResources(),
    ...getPublishedComparisonResources(),
    ...getPublishedChecklistResources(),
    ...getPublishedGlossaryResources(),
    ...getPublishedTemplateResources(),
    ...getPublishedToolResources(),
    ...getPublishedInsightResources(),
  ];
}

/**
 * Featured mix: prefer a featured Guide as lead when available,
 * then curated Insights for supporting slots.
 * Comparisons stay available in type navigation / format area.
 */
export function getFeaturedResources(count = 3): Resource[] {
  const result: Resource[] = [];
  const featuredGuide = getPublishedGuideResources().find(
    (resource) => resource.featured,
  );
  if (featuredGuide) result.push(featuredGuide);

  const all = getAllPosts();
  const preferred = FEATURED_INSIGHT_SLUGS.map((slug) =>
    all.find((post) => post.slug === slug),
  ).filter((post): post is NonNullable<typeof post> => Boolean(post));

  for (const post of preferred) {
    if (result.length >= count) break;
    result.push(insightFromBlogPost(post));
  }

  if (result.length < count) {
    const fill = getFeaturedInsightsPosts(count);
    for (const post of fill) {
      if (result.length >= count) break;
      if (
        !result.some(
          (item) => item.slug === post.slug && item.type === "insight",
        )
      ) {
        result.push(insightFromBlogPost(post));
      }
    }
  }

  return result.slice(0, count);
}

export function getLatestInsightResources(count = 6): Resource[] {
  return getAllPosts().slice(0, count).map(insightFromBlogPost);
}

export function getResourcesByType(type: ResourceType): Resource[] {
  if (type === "insight") return getPublishedInsightResources();
  if (type === "guide") return getPublishedGuideResources();
  if (type === "comparison") return getPublishedComparisonResources();
  if (type === "checklist") return getPublishedChecklistResources();
  if (type === "glossary") return getPublishedGlossaryResources();
  if (type === "template") return getPublishedTemplateResources();
  if (type === "tool") return getPublishedToolResources();
  return getPublishedResources().filter((resource) => resource.type === type);
}

export function getResourcesByTopic(topicId: ResourceTopicId): Resource[] {
  return getPublishedResources().filter((resource) =>
    resource.topicIds.includes(topicId),
  );
}

export function getInsightCount() {
  return getAllPosts().length;
}

export function getGuideCount() {
  return getPublishedGuides().length;
}

export function getComparisonCount() {
  return getPublishedComparisons().length;
}

export function getChecklistCount() {
  return getPublishedChecklists().length;
}

export function getGlossaryCount() {
  return getPublishedGlossaryEntries().length;
}

export function getTemplateCount() {
  return getPublishedTemplates().length;
}

export function getToolCount() {
  return getPublishedTools().length;
}

/** Route families not yet activated as public archives */
export const unpublishedResourceRouteFamilies = [] as const;
