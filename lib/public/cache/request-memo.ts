import { cache } from "react";
import {
  getCachedHomepageContent,
  listCachedPublishedServices,
  getCachedPublishedServiceBySlug,
  listCachedPublishedSolutions,
  getCachedPublishedSolutionBySlug,
  listCachedPublishedPlatforms,
  getCachedPublishedPlatformBySlug,
  listCachedPublishedWork,
  getCachedPublishedWorkBySlug,
  getCachedPublishedHomepageHero,
  getCachedPublishedFeaturedWork,
  listCachedPublishedInsights,
  getCachedPublishedInsightBySlug,
  listCachedHomepageInsights,
  listCachedCuratedHomepageTestimonials,
  listCachedPublishedIndustries,
  getCachedPublishedIndustryBySlug,
  getCachedPublishedResourceBySlug,
  listCachedAllPublishedResourceListingRows,
  getCachedPublishedManagedPageByKey,
  getCachedCmsContentRuntime,
  getCachedPublicSitemapEntries,
} from "@/lib/public/cache/cached-reads";

/** Per-request dedup on top of cross-request unstable_cache layers. */
export const getHomepageContent = cache(getCachedHomepageContent);
export const listPublishedServices = cache(listCachedPublishedServices);
export const getPublishedServiceBySlug = cache(getCachedPublishedServiceBySlug);
export const listPublishedSolutions = cache(listCachedPublishedSolutions);
export const getPublishedSolutionBySlug = cache(getCachedPublishedSolutionBySlug);
export const listPublishedPlatforms = cache(listCachedPublishedPlatforms);
export const getPublishedPlatformBySlug = cache(getCachedPublishedPlatformBySlug);
export const listPublishedWork = cache(listCachedPublishedWork);
export const getPublishedWorkBySlug = cache(getCachedPublishedWorkBySlug);
export const getPublishedHomepageHero = cache(getCachedPublishedHomepageHero);
export const getPublishedFeaturedWork = cache(getCachedPublishedFeaturedWork);
export const listPublishedInsights = cache(listCachedPublishedInsights);
export const getPublishedInsightBySlug = cache(getCachedPublishedInsightBySlug);
export const listHomepageInsights = cache(listCachedHomepageInsights);
export const listCuratedHomepageTestimonials = cache(
  listCachedCuratedHomepageTestimonials,
);
export const listPublishedIndustries = cache(listCachedPublishedIndustries);
export const getPublishedIndustryBySlug = cache(getCachedPublishedIndustryBySlug);
export const getPublishedResourceBySlug = cache(getCachedPublishedResourceBySlug);
export const listAllPublishedResourceListingRows = cache(
  listCachedAllPublishedResourceListingRows,
);
export const getPublishedManagedPageByKey = cache(getCachedPublishedManagedPageByKey);
export const resolveCmsContentRuntime = cache(getCachedCmsContentRuntime);
export const resolveWorkContentRuntime = cache(getCachedCmsContentRuntime);
export const buildPublicSitemapEntries = cache(getCachedPublicSitemapEntries);
