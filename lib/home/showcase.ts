import { homepageHeroProjectSlug } from "@/data/home";
import { getFeaturedProjects } from "@/data/portfolio";
import {
  resolveWorkContentRuntime,
  WorkDatabaseUnavailableError,
} from "@/lib/content/work-source";
import {
  getPublishedHomepageHero,
  listPublishedFeaturedWork,
} from "@/lib/repositories/workRepository";
import type { Project } from "@/types";

/** Selected Work section: 1 featured row + 2 supporting cards. */
export const SELECTED_WORK_LIMIT = 3;

const EMPTY_SHOWCASE: {
  heroProject?: Project;
  selectedProjects: Project[];
} = {
  heroProject: undefined,
  selectedProjects: [],
};

function hasShowcaseImage(project: Project): boolean {
  return Boolean(project.heroImage || project.image);
}

/**
 * STATIC / PRE-IMPORT FALLBACK ONLY — used when the database is unavailable or
 * Work has not been imported yet. Do not call in DB-authoritative production mode.
 */
function getTypedSelectedWorkProjects(): Project[] {
  return getFeaturedProjects()
    .filter((project) => project.slug !== homepageHeroProjectSlug)
    .slice(0, SELECTED_WORK_LIMIT);
}

/**
 * STATIC / PRE-IMPORT FALLBACK ONLY.
 * Uses curated `homepageHeroProjectSlug` when published with a showcase image.
 */
function getTypedHeroShowcaseProject(): Project | undefined {
  const featured = getFeaturedProjects();

  const curated = featured.find(
    (project) =>
      project.slug === homepageHeroProjectSlug && hasShowcaseImage(project),
  );
  if (curated) return curated;

  const usedInWork = new Set(
    getTypedSelectedWorkProjects().map((project) => project.slug),
  );

  const eligible = featured.filter(
    (project) => !usedInWork.has(project.slug) && hasShowcaseImage(project),
  );

  return eligible[0] ?? featured[0];
}

function getTypedShowcaseBundle() {
  return {
    heroProject: getTypedHeroShowcaseProject(),
    selectedProjects: getTypedSelectedWorkProjects(),
  };
}

async function loadDatabaseShowcase(): Promise<{
  heroProject?: Project;
  selectedProjects: Project[];
}> {
  try {
    const hero = await getPublishedHomepageHero();
    const selectedProjects = (
      await listPublishedFeaturedWork(hero?.slug)
    ).slice(0, SELECTED_WORK_LIMIT);

    return {
      heroProject: hero ?? undefined,
      selectedProjects,
    };
  } catch (error) {
    console.error("[showcase] database query failed", error);
    return EMPTY_SHOWCASE;
  }
}

async function resolveShowcaseRuntime() {
  try {
    return await resolveWorkContentRuntime();
  } catch (error) {
    if (error instanceof WorkDatabaseUnavailableError) {
      console.error("[showcase] work database unavailable", error);
      return "fail-closed" as const;
    }
    console.error("[showcase] unexpected runtime resolution failure", error);
    return "fail-closed" as const;
  }
}

/**
 * @deprecated Prefer `loadHeroShowcaseProject()` in server components.
 * Sync typed fallback for legacy callers and pre-import environments.
 */
export function getHeroShowcaseProject(): Project | undefined {
  return getTypedHeroShowcaseProject();
}

/**
 * @deprecated Prefer `loadSelectedWorkProjects()` in server components.
 */
export function getSelectedWorkProjects(): Project[] {
  return getTypedSelectedWorkProjects();
}

/**
 * Homepage hero from Admin Work (`featuredHomepage = true`, published only).
 *
 * DB-authoritative mode: returns undefined when no published hero is flagged —
 * typed `homepageHeroProjectSlug` is NOT resurrected.
 */
export async function loadHeroShowcaseProject(): Promise<Project | undefined> {
  const runtime = await resolveShowcaseRuntime();
  if (runtime === "fail-closed") return undefined;
  if (runtime === "typed-fallback") return getTypedHeroShowcaseProject();

  const showcase = await loadDatabaseShowcase();
  return showcase.heroProject;
}

/**
 * Homepage Selected Work from Admin Work (`featured = true`, published only).
 * Ordered by `displayOrder`, excludes the homepage hero, capped at SELECTED_WORK_LIMIT.
 */
export async function loadSelectedWorkProjects(options?: {
  excludeHeroSlug?: string;
}): Promise<Project[]> {
  const runtime = await resolveShowcaseRuntime();
  if (runtime === "fail-closed") return [];
  if (runtime === "typed-fallback") return getTypedSelectedWorkProjects();

  try {
    const excludeSlug =
      options?.excludeHeroSlug ??
      (await getPublishedHomepageHero())?.slug;
    return (await listPublishedFeaturedWork(excludeSlug)).slice(
      0,
      SELECTED_WORK_LIMIT,
    );
  } catch (error) {
    console.error("[showcase] selected work query failed", error);
    return [];
  }
}

/** Single round-trip loader for homepage hero + Selected Work. */
export async function loadHomepageWorkShowcase(): Promise<{
  heroProject?: Project;
  selectedProjects: Project[];
}> {
  const runtime = await resolveShowcaseRuntime();
  if (runtime === "fail-closed") return EMPTY_SHOWCASE;
  if (runtime === "typed-fallback") return getTypedShowcaseBundle();

  return loadDatabaseShowcase();
}
