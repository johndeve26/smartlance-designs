import type { Metadata } from "next";
import { HomeHero } from "@/components/home/hero";
import { TrustStrip, type ProofBarItem } from "@/components/home/trust-strip";
import {
  ProblemSection,
  type ProblemPoint,
} from "@/components/home/problem-section";
import {
  HomeServices,
  type HomepageServiceItem,
} from "@/components/home/services-section";
import {
  GrowthSystemSection,
  type GrowthSystemStep,
} from "@/components/home/growth-system";
import { HomePortfolio } from "@/components/home/portfolio-section";
import { HomeIndustriesTeaser } from "@/components/home/industries-teaser";
import {
  WhySmartlance,
  type WhySmartlanceItem,
} from "@/components/home/why-smartlance";
import { ProcessSection } from "@/components/home/process-section";
import {
  FreeReviewTeaser,
  type ReviewChecklistItem,
} from "@/components/home/free-review-teaser";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { HomeSeoSection } from "@/components/home/seo-section";
import { HomeBlogSection } from "@/components/home/blog-section";
import { getHomepageContent } from "@/lib/repositories/homepageRepository";
import {
  proofBarItems as typedProofBar,
  problemPoints as typedProblemPoints,
  growthSystemSteps as typedGrowthSteps,
  whySmartlanceItems as typedWhyItems,
  processSteps as typedProcessSteps,
  reviewChecklist as typedReviewChecklist,
  seoHighlights as typedSeoHighlights,
  homepageServiceItems as typedServiceItems,
  homepageTestimonialIds as typedTestimonialIds,
} from "@/data/home";
import { getTestimonialById } from "@/data/testimonials";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import type { ProcessStep } from "@/types";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function isVisible(
  visibility: Record<string, boolean>,
  key: string,
): boolean {
  return visibility[key] !== false;
}

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomepageContent();
  const title =
    home?.seoTitle ||
    home?.metaTitle ||
    `${siteConfig.name} | ${siteConfig.tagline}`;
  const description =
    home?.seoDescription || home?.metaDescription || siteConfig.description;

  return buildPageMetadata({
    title,
    description,
    path: "/",
    canonicalPath: home?.canonicalOverride || "/",
    canonicalOverride: home?.canonicalOverride,
    image: home?.ogImagePath || siteConfig.ogImage,
    noIndex: home?.noIndex ?? false,
  });
}

export default async function HomePage() {
  const home = await getHomepageContent();
  const sections = home?.sections ?? {};
  const visibility = home?.sectionVisibility ?? {};

  const proofBarItems =
    asArray<ProofBarItem>(sections.proofBarItems).length > 0
      ? asArray<ProofBarItem>(sections.proofBarItems)
      : typedProofBar;
  const problemPoints =
    asArray<ProblemPoint>(sections.problemPoints).length > 0
      ? asArray<ProblemPoint>(sections.problemPoints)
      : typedProblemPoints;
  const growthSystemSteps =
    asArray<GrowthSystemStep>(sections.growthSystemSteps).length > 0
      ? asArray<GrowthSystemStep>(sections.growthSystemSteps)
      : typedGrowthSteps;
  const whySmartlanceItems =
    asArray<WhySmartlanceItem>(sections.whySmartlanceItems).length > 0
      ? asArray<WhySmartlanceItem>(sections.whySmartlanceItems)
      : typedWhyItems;
  const processSteps =
    asArray<ProcessStep>(sections.processSteps).length > 0
      ? asArray<ProcessStep>(sections.processSteps)
      : typedProcessSteps;
  const reviewChecklist =
    asArray<ReviewChecklistItem>(sections.reviewChecklist).length > 0
      ? asArray<ReviewChecklistItem>(sections.reviewChecklist)
      : typedReviewChecklist;
  const seoHighlights =
    asArray<string>(sections.seoHighlights).length > 0
      ? asArray<string>(sections.seoHighlights)
      : typedSeoHighlights;

  const curatedServiceItems = (
    asArray<HomepageServiceItem>(home?.curatedServiceItems).length > 0
      ? asArray<HomepageServiceItem>(home?.curatedServiceItems)
      : typedServiceItems
  ).filter(
    (item) =>
      item &&
      typeof item.slug === "string" &&
      typeof item.href === "string" &&
      typeof item.title === "string",
  );

  const testimonialIds =
    (home?.curatedTestimonialIds?.length ?? 0) > 0
      ? home!.curatedTestimonialIds
      : typedTestimonialIds;

  const testimonials = testimonialIds
    .map((id) => getTestimonialById(id))
    .filter(
      (item): item is NonNullable<ReturnType<typeof getTestimonialById>> =>
        Boolean(item),
    );

  const hero = home?.hero ?? {
    eyebrow: "Website design, development & SEO",
    headline: "Websites Built to Rank, Convert and Grow.",
    headlineAccent: "Rank",
    supporting: siteConfig.description,
    primaryCtaLabel: "Tell Us About Your Project",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "View Our Work",
    secondaryCtaHref: "/work",
  };

  return (
    <>
      <HomeHero
        eyebrow={hero.eyebrow}
        headline={hero.headline}
        headlineAccent={hero.headlineAccent}
        supporting={hero.supporting}
        primaryCtaLabel={hero.primaryCtaLabel}
        primaryCtaHref={hero.primaryCtaHref}
        secondaryCtaLabel={hero.secondaryCtaLabel}
        secondaryCtaHref={hero.secondaryCtaHref}
      />
      {isVisible(visibility, "proofBarItems") ? (
        <TrustStrip items={proofBarItems} />
      ) : null}
      {isVisible(visibility, "problemPoints") ? (
        <ProblemSection points={problemPoints} />
      ) : null}
      {isVisible(visibility, "curatedServiceItems") &&
      curatedServiceItems.length > 0 ? (
        <HomeServices items={curatedServiceItems} />
      ) : null}
      {isVisible(visibility, "growthSystemSteps") ? (
        <GrowthSystemSection steps={growthSystemSteps} />
      ) : null}
      <HomePortfolio />
      <HomeIndustriesTeaser />
      {isVisible(visibility, "whySmartlanceItems") ? (
        <WhySmartlance items={whySmartlanceItems} />
      ) : null}
      {isVisible(visibility, "processSteps") ? (
        <ProcessSection steps={processSteps} />
      ) : null}
      {isVisible(visibility, "reviewChecklist") ? (
        <FreeReviewTeaser checklist={reviewChecklist} />
      ) : null}
      {isVisible(visibility, "testimonials") && testimonials.length > 0 ? (
        <TestimonialsSection items={testimonials} />
      ) : null}
      {isVisible(visibility, "seoHighlights") ? (
        <HomeSeoSection highlights={seoHighlights} />
      ) : null}
      <HomeBlogSection />
      {/* Page ends on the global pre-footer CTA — no second closing CTA here. */}
    </>
  );
}
