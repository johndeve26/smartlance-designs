import { homepageHeroProjectSlug } from "@/data/home";
import { getFeaturedProjects } from "@/data/portfolio";
import type { Project } from "@/types";

const WORK_SECTION_COUNT = 3;

/**
 * Projects shown in the Selected Work section.
 * Curated order comes from the portfolio data — not an arbitrary first-N query.
 */
export function getSelectedWorkProjects(): Project[] {
  return getFeaturedProjects()
    .filter((project) => project.slug !== homepageHeroProjectSlug)
    .slice(0, WORK_SECTION_COUNT);
}

/**
 * Hero showcase project.
 *
 * Uses the curated hero slug when published. Selected Work excludes that slug
 * so the same project does not appear twice on the homepage.
 */
export function getHeroShowcaseProject(): Project | undefined {
  const featured = getFeaturedProjects();

  const curated = featured.find(
    (project) =>
      project.slug === homepageHeroProjectSlug &&
      Boolean(project.heroImage || project.image),
  );
  if (curated) return curated;

  const usedInWork = new Set(
    getSelectedWorkProjects().map((project) => project.slug),
  );

  const eligible = featured.filter(
    (project) =>
      !usedInWork.has(project.slug) &&
      Boolean(project.heroImage || project.image),
  );

  return eligible[0] ?? featured[0];
}
