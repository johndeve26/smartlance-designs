import { getLatestPosts } from "@/lib/blog";
import { homepageTestimonialIds as typedTestimonialIds } from "@/data/home";
import { getTestimonialById } from "@/data/testimonials";
import {
  CmsDatabaseUnavailableError,
  resolveCmsContentRuntime,
} from "@/lib/content/content-source";
import {
  listHomepageInsights,
  type HomepageInsightCard,
} from "@/lib/repositories/insightsRepository";
import { listCuratedHomepageTestimonials } from "@/lib/repositories/testimonialsRepository";
import type { Testimonial } from "@/types";

export const HOMEPAGE_INSIGHTS_LIMIT = 3;

function getTypedHomepageInsights(): HomepageInsightCard[] {
  return getLatestPosts(HOMEPAGE_INSIGHTS_LIMIT).map((post) => ({
    ...post,
    relatedServiceHrefs: post.relatedServiceHrefs ?? [],
    published: post.published ?? true,
  }));
}

function getTypedHomepageTestimonials(curatedIds: string[]): Testimonial[] {
  const ids =
    curatedIds.length > 0 ? curatedIds : [...typedTestimonialIds];
  return ids
    .map((id) => getTestimonialById(id))
    .filter((item): item is Testimonial => Boolean(item));
}

async function resolveEditorialRuntime() {
  try {
    return await resolveCmsContentRuntime();
  } catch (error) {
    if (error instanceof CmsDatabaseUnavailableError) {
      console.error("[homepage-editorial] CMS database unavailable", error);
      return "fail-closed" as const;
    }
    console.error("[homepage-editorial] unexpected runtime resolution failure", error);
    return "fail-closed" as const;
  }
}

/**
 * Homepage Insights — published DB rows only in DATABASE mode.
 * No insight curation field exists yet; uses latest published selection (featured-first, limit 3).
 */
export async function loadHomepageInsights(): Promise<HomepageInsightCard[]> {
  const runtime = await resolveEditorialRuntime();
  if (runtime === "fail-closed") return [];
  if (runtime === "typed-fallback") return getTypedHomepageInsights();

  try {
    return await listHomepageInsights(HOMEPAGE_INSIGHTS_LIMIT);
  } catch (error) {
    console.error("[homepage-editorial] insights query failed", error);
    return [];
  }
}

/**
 * Homepage Testimonials — resolves published Homepage curation IDs against DB.
 * Only verified + published testimonials; invalid references are omitted (no typed fill-in).
 */
export async function loadHomepageTestimonials(
  curatedIds: string[],
): Promise<Testimonial[]> {
  const runtime = await resolveEditorialRuntime();
  if (runtime === "fail-closed") return [];
  if (runtime === "typed-fallback") {
    return getTypedHomepageTestimonials(curatedIds);
  }

  if (!curatedIds.length) return [];

  try {
    return await listCuratedHomepageTestimonials(curatedIds);
  } catch (error) {
    console.error("[homepage-editorial] testimonials query failed", error);
    return [];
  }
}

/** Parallel loader for homepage Insights + Testimonials strips. */
export async function loadHomepageEditorialSections(input: {
  curatedTestimonialIds: string[];
}) {
  const [insights, testimonials] = await Promise.all([
    loadHomepageInsights(),
    loadHomepageTestimonials(input.curatedTestimonialIds),
  ]);
  return { insights, testimonials };
}
