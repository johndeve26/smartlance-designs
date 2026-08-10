import type { Metadata } from "next";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import {
  SolutionsApproach,
  SolutionsFaq,
  SolutionsHero,
  SolutionsOverlapCallout,
  SolutionsPlannerPromo,
  SolutionsProblemFinder,
  SolutionsProblemFlow,
  SolutionsSelectedWork,
  SolutionsTerritories,
} from "@/components/solutions/solutions-sections";
import {
  solutionsHubFaqs,
  solutionsSelectedWorkSlugs,
  getPublishedSolutions as getTypedPublishedSolutions,
} from "@/data/solutions";
import { listPublishedSolutions } from "@/lib/public/cache";
import { getProjectBySlug } from "@/data/portfolio";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structured-data";
import type { Project, Solution } from "@/types";

export const metadata: Metadata = buildMetadata({
  title: "Website Solutions for Growth, SEO & Conversion",
  description:
    "Explore practical solutions for websites that are not ranking, converting, performing or supporting business growth.",
  path: "/solutions",
});

export default async function SolutionsPage() {
  // Prefer DB; typed catalogue is only used when the DB is empty (e.g. pre-seed build).
  const fromDb = await listPublishedSolutions();
  const published =
    fromDb.length > 0 ? fromDb : getTypedPublishedSolutions();
  const solutionsBySlug = Object.fromEntries(
    published.map((solution) => [solution.slug, solution]),
  ) as Record<string, Solution>;

  const projects = solutionsSelectedWorkSlugs
    .map((slug) => getProjectBySlug(slug))
    .filter((project): project is Project => Boolean(project));

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Solutions", path: "/solutions" },
          ]),
          faqJsonLd([...solutionsHubFaqs]),
        ]}
      />

      <SolutionsHero />
      <SolutionsProblemFinder />
      <SolutionsTerritories solutionsBySlug={solutionsBySlug} />
      <SolutionsOverlapCallout />
      <SolutionsApproach />
      <SolutionsSelectedWork projects={projects} />
      <SolutionsProblemFlow solutionsBySlug={solutionsBySlug} />
      <SolutionsPlannerPromo />
      <SolutionsFaq />

      <CTASection
        title="Not Sure Which Solution Fits?"
        description="Tell us what's happening with your website and what you want it to do better. We'll help identify the most useful next step."
        primaryLabel="Tell Us About Your Project"
        primaryHref="/contact"
        secondaryLabel="Get a Free Website Review"
        secondaryHref="/free-website-review"
      />
    </>
  );
}
