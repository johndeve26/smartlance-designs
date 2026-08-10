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
import { HomeBlogSection } from "@/components/home/blog-section";
import { FreeToolsSection } from "@/components/home/free-tools-section";
import { ClientPortalSection } from "@/components/home/client-portal-section";
import { HomeAiAutomationSection, HomeCoreCapabilitiesSection } from "@/components/home/ai-automation-section";
import { HomeCapabilityStrip } from "@/components/home/capability-strip";
import { HomeFinalCtaSection } from "@/components/home/final-cta-section";
import { homepageProcessSteps } from "@/lib/public/how-we-work-content";
import { getHomepageContent } from "@/lib/repositories/homepageRepository";
import {
  loadHomepageWorkShowcase,
} from "@/lib/home/showcase";
import { loadHomepageEditorialSections } from "@/lib/home/editorial";
import { loadPublishedIndustries } from "@/lib/content/phase3-public";
import {
  proofBarItems as typedProofBar,
  problemPoints as typedProblemPoints,
  growthSystemSteps as typedGrowthSteps,
  whySmartlanceItems as typedWhyItems,
  homepageServiceItems as typedServiceItems,
} from "@/data/home";
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
  const [workShowcase, editorial, industries] = await Promise.all([
    loadHomepageWorkShowcase(),
    loadHomepageEditorialSections({
      curatedTestimonialIds: home?.curatedTestimonialIds ?? [],
    }),
    loadPublishedIndustries(),
  ]);
  const { heroProject, selectedProjects } = workShowcase;
  const { insights } = editorial;
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
      : homepageProcessSteps;
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

  const hero = home?.hero ?? {
    eyebrow: "Websites, growth, AI & automation",
    headline: "Websites Built to Rank, Convert and Grow.",
    headlineAccent: "Rank",
    supporting:
      "Smartlance designs and builds websites, growth systems and digital solutions that help businesses attract customers, work smarter and scale with less friction.",
    primaryCtaLabel: "Tell Us About Your Project",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "Get a Free Website Review",
    secondaryCtaHref: "/free-website-review",
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
        heroProject={heroProject}
      />
      <HomeCapabilityStrip />
      {isVisible(visibility, "proofBarItems") ? (
        <TrustStrip items={proofBarItems} />
      ) : null}
      {isVisible(visibility, "problemPoints") ? (
        <ProblemSection points={problemPoints} />
      ) : null}
      <FreeToolsSection />
      <HomePortfolio selectedProjects={selectedProjects} />
      <HomeCoreCapabilitiesSection />
      <HomeAiAutomationSection />
      {isVisible(visibility, "processSteps") ? (
        <ProcessSection steps={processSteps} />
      ) : null}
      {isVisible(visibility, "whySmartlanceItems") ? (
        <WhySmartlance items={whySmartlanceItems} />
      ) : null}
      <HomeIndustriesTeaser industries={industries} />
      <ClientPortalSection />
      {isVisible(visibility, "growthSystemSteps") ? (
        <GrowthSystemSection steps={growthSystemSteps} />
      ) : null}
      {isVisible(visibility, "insights") ? (
        <HomeBlogSection posts={insights} />
      ) : null}
      <HomeFinalCtaSection />
    </>
  );
}
