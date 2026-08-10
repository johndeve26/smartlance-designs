import { unstable_cache } from "next/cache";
import { getHomepageContent as getHomepageContentUncached } from "@/lib/repositories/homepageRepository";
import {
  listPublishedServices as listPublishedServicesUncached,
  getPublishedServiceBySlug as getPublishedServiceBySlugUncached,
} from "@/lib/repositories/servicesRepository";
import {
  listPublishedSolutions as listPublishedSolutionsUncached,
  getPublishedSolutionBySlug as getPublishedSolutionBySlugUncached,
} from "@/lib/repositories/solutionsRepository";
import {
  listPublishedPlatforms as listPublishedPlatformsUncached,
  getPublishedPlatformBySlug as getPublishedPlatformBySlugUncached,
} from "@/lib/repositories/platformsRepository";
import {
  listPublishedWork as listPublishedWorkUncached,
  getPublishedWorkBySlug as getPublishedWorkBySlugUncached,
  getPublishedHomepageHero as getPublishedHomepageHeroUncached,
  listPublishedFeaturedWork as listPublishedFeaturedWorkUncached,
} from "@/lib/repositories/workRepository";
import {
  listPublishedInsights as listPublishedInsightsUncached,
  getPublishedInsightBySlug as getPublishedInsightBySlugUncached,
  listHomepageInsights as listHomepageInsightsUncached,
} from "@/lib/repositories/insightsRepository";
import {
  listPublishedIndustries as listPublishedIndustriesUncached,
  getPublishedIndustryBySlug as getPublishedIndustryBySlugUncached,
} from "@/lib/repositories/industriesRepository";
import {
  listCuratedHomepageTestimonials as listCuratedHomepageTestimonialsUncached,
} from "@/lib/repositories/testimonialsRepository";
import {
  getPublishedResourceBySlug as getPublishedResourceBySlugUncached,
  listAllPublishedResourceListingRows as listAllPublishedResourceListingRowsUncached,
} from "@/lib/repositories/resourcesRepository";
import { getPublishedManagedPageByKey as getPublishedManagedPageByKeyUncached } from "@/lib/managed-pages/public";
import { resolveWorkContentRuntime as resolveWorkContentRuntimeUncached } from "@/lib/content/work-source";
import { buildPublicSitemapEntries as buildPublicSitemapEntriesUncached } from "@/lib/seo/sitemap-entries";
import { CACHE_TAGS } from "@/lib/public/cache/tags";
import {
  PUBLIC_CACHE_REVALIDATE_SECONDS,
  shouldBypassPublicCache,
} from "@/lib/public/cache/config";

type CacheOptions = {
  tags: string[];
  revalidate: number;
};

function cacheOptions(tags: string[]): CacheOptions {
  return {
    tags,
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
  };
}

function cached<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  keyParts: string[],
  tags: string[],
): (...args: A) => Promise<R> {
  if (shouldBypassPublicCache()) return fn;
  const wrapped = unstable_cache(fn, keyParts, cacheOptions(tags));
  return (...args: A) => wrapped(...args);
}

export const getCachedHomepageContent = cached(
  getHomepageContentUncached,
  ["public-homepage"],
  [CACHE_TAGS.homepage],
);

export const listCachedPublishedServices = cached(
  listPublishedServicesUncached,
  ["public-services-list"],
  [CACHE_TAGS.services, CACHE_TAGS.servicesHub],
);

export function getCachedPublishedServiceBySlug(slug: string) {
  if (shouldBypassPublicCache()) return getPublishedServiceBySlugUncached(slug);
  return unstable_cache(
    () => getPublishedServiceBySlugUncached(slug),
    ["public-service", slug],
    cacheOptions([
      CACHE_TAGS.service(slug),
      CACHE_TAGS.services,
      CACHE_TAGS.servicesHub,
    ]),
  )();
}

export const listCachedPublishedSolutions = cached(
  listPublishedSolutionsUncached,
  ["public-solutions-list"],
  [CACHE_TAGS.solutions, CACHE_TAGS.solutionsHub],
);

export function getCachedPublishedSolutionBySlug(slug: string) {
  if (shouldBypassPublicCache()) return getPublishedSolutionBySlugUncached(slug);
  return unstable_cache(
    () => getPublishedSolutionBySlugUncached(slug),
    ["public-solution", slug],
    cacheOptions([
      CACHE_TAGS.solution(slug),
      CACHE_TAGS.solutions,
      CACHE_TAGS.solutionsHub,
    ]),
  )();
}

export const listCachedPublishedPlatforms = cached(
  listPublishedPlatformsUncached,
  ["public-platforms-list"],
  [CACHE_TAGS.platforms, CACHE_TAGS.platformsHub],
);

export function getCachedPublishedPlatformBySlug(slug: string) {
  if (shouldBypassPublicCache()) return getPublishedPlatformBySlugUncached(slug);
  return unstable_cache(
    () => getPublishedPlatformBySlugUncached(slug),
    ["public-platform", slug],
    cacheOptions([
      CACHE_TAGS.platform(slug),
      CACHE_TAGS.platforms,
      CACHE_TAGS.platformsHub,
    ]),
  )();
}

export const listCachedPublishedWork = cached(
  listPublishedWorkUncached,
  ["public-work-list"],
  [CACHE_TAGS.work, CACHE_TAGS.workHub],
);

export function getCachedPublishedWorkBySlug(slug: string) {
  if (shouldBypassPublicCache()) return getPublishedWorkBySlugUncached(slug);
  return unstable_cache(
    () => getPublishedWorkBySlugUncached(slug),
    ["public-work", slug],
    cacheOptions([CACHE_TAGS.workItem(slug), CACHE_TAGS.work, CACHE_TAGS.workHub]),
  )();
}

export const getCachedPublishedHomepageHero = cached(
  getPublishedHomepageHeroUncached,
  ["public-work-homepage-hero"],
  [CACHE_TAGS.work, CACHE_TAGS.homepage],
);

export function getCachedPublishedFeaturedWork(excludeSlug?: string) {
  const key = excludeSlug ?? "__none__";
  if (shouldBypassPublicCache()) {
    return listPublishedFeaturedWorkUncached(excludeSlug);
  }
  return unstable_cache(
    () => listPublishedFeaturedWorkUncached(excludeSlug),
    ["public-work-featured", key],
    cacheOptions([CACHE_TAGS.work, CACHE_TAGS.homepage]),
  )();
}

export const listCachedPublishedInsights = cached(
  listPublishedInsightsUncached,
  ["public-insights-list"],
  [CACHE_TAGS.insights, CACHE_TAGS.blogHub],
);

export function getCachedPublishedInsightBySlug(slug: string) {
  if (shouldBypassPublicCache()) return getPublishedInsightBySlugUncached(slug);
  return unstable_cache(
    () => getPublishedInsightBySlugUncached(slug),
    ["public-insight", slug],
    cacheOptions([
      CACHE_TAGS.insight(slug),
      CACHE_TAGS.insights,
      CACHE_TAGS.blogHub,
    ]),
  )();
}

export const listCachedHomepageInsights = cached(
  listHomepageInsightsUncached,
  ["public-homepage-insights"],
  [CACHE_TAGS.insights, CACHE_TAGS.homepage, CACHE_TAGS.blogHub],
);

export function listCachedCuratedHomepageTestimonials(ids: string[]) {
  const key = ids.slice().sort().join(",") || "__empty__";
  if (shouldBypassPublicCache()) {
    return listCuratedHomepageTestimonialsUncached(ids);
  }
  return unstable_cache(
    () => listCuratedHomepageTestimonialsUncached(ids),
    ["public-homepage-testimonials", key],
    cacheOptions([CACHE_TAGS.testimonials, CACHE_TAGS.homepage]),
  )();
}

export const listCachedPublishedIndustries = cached(
  listPublishedIndustriesUncached,
  ["public-industries-list"],
  [CACHE_TAGS.industries],
);

export function getCachedPublishedIndustryBySlug(slug: string) {
  if (shouldBypassPublicCache()) return getPublishedIndustryBySlugUncached(slug);
  return unstable_cache(
    () => getPublishedIndustryBySlugUncached(slug),
    ["public-industry", slug],
    cacheOptions([CACHE_TAGS.industries]),
  )();
}

export function getCachedPublishedResourceBySlug(
  type: Parameters<typeof getPublishedResourceBySlugUncached>[0],
  slug: string,
) {
  if (shouldBypassPublicCache()) {
    return getPublishedResourceBySlugUncached(type, slug);
  }
  return unstable_cache(
    () => getPublishedResourceBySlugUncached(type, slug),
    ["public-resource", type, slug],
    cacheOptions([
      CACHE_TAGS.resource(type, slug),
      CACHE_TAGS.resources,
      CACHE_TAGS.resourcesHub,
    ]),
  )();
}

export const listCachedAllPublishedResourceListingRows = cached(
  listAllPublishedResourceListingRowsUncached,
  ["public-resources-listing"],
  [CACHE_TAGS.resources, CACHE_TAGS.resourcesHub],
);

export function getCachedPublishedManagedPageByKey(key: string) {
  if (shouldBypassPublicCache()) return getPublishedManagedPageByKeyUncached(key);
  return unstable_cache(
    () => getPublishedManagedPageByKeyUncached(key),
    ["public-managed-page", key],
    cacheOptions([CACHE_TAGS.managedPage(key)]),
  )();
}

export const getCachedCmsContentRuntime = cached(
  resolveWorkContentRuntimeUncached,
  ["public-cms-runtime"],
  [CACHE_TAGS.cmsRuntime],
);

export const getCachedPublicSitemapEntries = cached(
  buildPublicSitemapEntriesUncached,
  ["public-sitemap"],
  [CACHE_TAGS.sitemap],
);
