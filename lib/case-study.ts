import type { Project, ProjectCaseStudyPoint } from "@/types";
import { caseStudyNarratives } from "@/data/case-study-narratives";
import { getVisibleProjects } from "@/data/portfolio";
import { getPlatformHrefForName } from "@/data/platforms";
import { resolveMediaUrl } from "@/lib/media/urls";

const SERVICE_HREFS: Record<string, string> = {
  "Website Design": "/services/website-design",
  "Website Development": "/services/website-development",
  SEO: "/seo",
  "E-commerce": "/services/ecommerce-development",
  Branding: "/services/website-design",
};

export function getServiceHref(service: string) {
  return SERVICE_HREFS[service] || "/services";
}

export function getUniqueProjectImages(project: Project) {
  const images: { src: string; alt: string; caption?: string }[] = [];
  const seen = new Set<string>();

  const push = (src?: string, alt?: string, caption?: string) => {
    if (!src?.trim() || seen.has(src)) return;
    seen.add(src);
    images.push({
      src,
      alt: alt || `${project.name} website`,
      caption,
    });
  };

  const primary = project.heroImage || project.image;
  push(primary, project.heroImageAlt || project.imageAlt);

  // cover.webp and hero.webp are identical twins on every current project —
  // do not treat the portfolio cover as a second storytelling asset.
  const coverIsHeroTwin =
    Boolean(project.heroImage && project.image) &&
    /\/cover\.webp$/.test(project.image || "") &&
    /\/hero\.webp$/.test(project.heroImage || "") &&
    (project.image || "").replace(/cover\.webp$/, "") ===
      (project.heroImage || "").replace(/hero\.webp$/, "");

  if (project.image && project.image !== primary && !coverIsHeroTwin) {
    push(project.image, project.imageAlt);
  }

  for (const item of project.gallery ?? []) {
    push(item.src, item.alt, item.caption);
  }

  return images;
}

export function resolveCaseStudyContent(project: Project) {
  const narrative = caseStudyNarratives[project.slug];
  const images = getUniqueProjectImages(project);
  const heroImage = images[0];
  const galleryImages = images.slice(1);

  const challenges: ProjectCaseStudyPoint[] =
    project.challenges?.length
      ? project.challenges
      : narrative?.challenges ??
        (project.challenge
          ? [{ title: "The challenge", description: project.challenge }]
          : []);

  const approachSteps: ProjectCaseStudyPoint[] =
    project.approachSteps?.length
      ? project.approachSteps
      : narrative?.approachSteps ?? [];

  const solutionPoints: ProjectCaseStudyPoint[] =
    project.solutionPoints?.length
      ? project.solutionPoints
      : narrative?.solutionPoints ?? [];

  const highlights =
    project.highlights?.length
      ? project.highlights
      : narrative?.highlights ?? [];

  const outcomes = [
    ...(project.measurableResults ?? []),
    ...(project.results ?? []),
  ].filter((item, index, list) => list.indexOf(item) === index);

  const sectionHeadings = {
    intro: narrative?.introHeading,
    challenge: narrative?.sectionHeadings?.challenge,
    approach: narrative?.sectionHeadings?.approach,
    solution: narrative?.sectionHeadings?.solution,
    outcome: narrative?.outcomeHeading,
    engineering: narrative?.sectionHeadings?.engineering,
    platform: narrative?.sectionHeadings?.platform,
    principles: narrative?.sectionHeadings?.principles,
    saasInfrastructure: narrative?.sectionHeadings?.saasInfrastructure,
    ...project.sectionHeadings,
  };

  return {
    heroStatement:
      project.heroStatement ||
      narrative?.heroStatement ||
      project.shortDescription ||
      project.objective ||
      "",
    introHeading: sectionHeadings.intro,
    overview:
      project.overview ||
      project.shortDescription ||
      project.objective ||
      "",
    challenges,
    approachSteps,
    solutionPoints,
    solutionSummary:
      narrative?.solutionIntro || project.solution,
    highlights,
    outcomes,
    resultSummary: project.resultSummary || "",
    outcomeHeading:
      project.outcomeHeading ||
      narrative?.outcomeHeading ||
      sectionHeadings.outcome ||
      "What changed after the project",
    sectionHeadings,
    platformContext:
      project.platformContext || narrative?.platformContext || "",
    platformHeading: sectionHeadings.platform,
    platformHref: getPlatformHrefForName(project.platform),
    heroImage,
    galleryImages,
    gallerySections:
      project.gallery?.length ? project.gallery : narrative?.gallery ?? [],
    hasDistinctGallery: galleryImages.length > 0,
    serviceLinks: project.serviceLinks ?? narrative?.serviceLinks,
    engineeringIntro:
      project.engineeringIntro ?? narrative?.engineeringIntro,
    engineeringStacks:
      project.engineeringStacks ?? narrative?.engineeringStacks,
    caseStudyCta: project.caseStudyCta ?? narrative?.caseStudyCta,
    externalLinkLabel:
      project.externalLinkLabel ?? narrative?.externalLinkLabel,
    heroEyebrow: project.heroEyebrow ?? narrative?.heroEyebrow,
    heroSupportingCopy:
      project.heroSupportingCopy ?? narrative?.heroSupportingCopy,
    productPrinciples:
      project.productPrinciples ?? narrative?.productPrinciples ?? [],
    productFeatures: (
      project.productFeatures ?? narrative?.productFeatures ?? []
    ).map((feature) =>
      feature.image
        ? {
            ...feature,
            image: { ...feature.image, src: resolveMediaUrl(feature.image.src) },
          }
        : feature,
    ),
    saasInfrastructure:
      project.saasInfrastructure ?? narrative?.saasInfrastructure ?? [],
    showArchitectureDiagram:
      project.showArchitectureDiagram ??
      narrative?.showArchitectureDiagram ??
      false,
    isProductCaseStudy: project.caseStudyKind === "product",
  };
}

export function getAdjacentProjects(slug: string) {
  const list = getVisibleProjects();
  const index = list.findIndex((project) => project.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: index > 0 ? list[index - 1] : null,
    next: index < list.length - 1 ? list[index + 1] : null,
  };
}
