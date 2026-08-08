import {
  CTA_LABELS,
  SITE_ROUTES,
  platformConnections,
  serviceToSolutions,
  solutionJourney,
  type RelatedHref,
  type RelationPriority,
} from "@/data/site-relationships";

const priorityRank: Record<RelationPriority, number> = {
  primary: 0,
  secondary: 1,
  contextual: 2,
};

export function sortByPriority(items: RelatedHref[]): RelatedHref[] {
  return [...items].sort(
    (a, b) => priorityRank[a.priority] - priorityRank[b.priority],
  );
}

export function takeRelated(
  items: RelatedHref[] | undefined,
  limit: number,
): RelatedHref[] {
  if (!items?.length) return [];
  return sortByPriority(items).slice(0, limit);
}

export function getSolutionsForServiceHref(
  href: string,
  limit = 3,
): RelatedHref[] {
  return takeRelated(serviceToSolutions[href], limit);
}

export function getJourneyForSolution(slug: string) {
  return solutionJourney[slug] ?? null;
}

export function getServicesForSolution(slug: string, limit = 4): RelatedHref[] {
  return takeRelated(solutionJourney[slug]?.services, limit);
}

export function getResourcesForSolution(slug: string, limit = 3): RelatedHref[] {
  return takeRelated(solutionJourney[slug]?.resources, limit);
}

export function solutionAllowsFreeReview(slug: string): boolean {
  const journey = solutionJourney[slug];
  if (!journey) return true;
  return journey.existingSiteAction !== false;
}

export function getPlatformConnection(slug: string) {
  return (
    platformConnections[slug] ?? {
      showSelector: true,
    }
  );
}

export { CTA_LABELS, SITE_ROUTES };
