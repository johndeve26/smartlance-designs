import { homepageHeroProjectSlug } from "@/data/home";
import { getFeaturedProjects } from "@/data/portfolio";
import type { Project } from "@/types";

const WORK_SECTION_COUNT = 3;

/**
 * Projects shown in the Selected Work section.
 * Curated order comes from the portfolio data — not an arbitrary first-N query.
 */
export function getSelectedWorkProjects(): Project[] {
  return getFeaturedProjects().slice(0, WORK_SECTION_COUNT);
}

/**
 * Hero showcase project.
 *
 * Honours the curated hero slug, but only after excluding everything rendered
 * in Selected Work — so the same project image can never appear twice on the
 * homepage even if curation changes. Falls back to the first featured project
 * only when nothing else is published.
 */
export function getHeroShowcaseProject(): Project | undefined {
  const featured = getFeaturedProjects();
  const usedInWork = new Set(
    getSelectedWorkProjects().map((project) => project.slug),
  );

  const eligible = featured.filter(
    (project) =>
      !usedInWork.has(project.slug) &&
      Boolean(project.heroImage || project.image),
  );

  return (
    eligible.find((project) => project.slug === homepageHeroProjectSlug) ??
    eligible[0] ??
    featured[0]
  );
}
