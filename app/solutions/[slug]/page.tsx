import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SolutionPageTemplate } from "@/components/solutions/solution-page-template";
import { RankingSolutionPage } from "@/components/solutions/solution-ranking-page";
import { PerformanceSolutionPage } from "@/components/solutions/solution-performance-page";
import { OutdatedSolutionPage } from "@/components/solutions/solution-outdated-page";
import { ConversionsSolutionPage } from "@/components/solutions/solution-conversions-page";
import { MigrationSolutionPage } from "@/components/solutions/solution-migration-page";
import { NewBusinessSolutionPage } from "@/components/solutions/solution-new-business-page";
import { EcommerceGrowthSolutionPage } from "@/components/solutions/solution-ecommerce-page";
import { LocalVisibilitySolutionPage } from "@/components/solutions/solution-local-visibility-page";
import {
  getPublishedSolutionBySlug,
  getSolutionPageContentBySlug,
  listPublishedSolutions,
} from "@/lib/repositories/solutionsRepository";
import { findActiveRedirect } from "@/lib/repositories/redirectsRepository";
import {
  isConversionsSolutionContent,
  isEcommerceGrowthSolutionContent,
  isLeadsSolutionContent,
  isLocalVisibilitySolutionContent,
  isMigrationSolutionContent,
  isNewBusinessSolutionContent,
  isOutdatedSolutionContent,
  isPerformanceSolutionContent,
  isRankingSolutionContent,
  type SolutionPageContent,
} from "@/data/solution-pages";
import { buildMetadata, buildPageMetadata } from "@/lib/seo";

type SolutionSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const solutions = await listPublishedSolutions();
  return solutions.map((solution) => ({
    slug: solution.slug,
  }));
}

export async function generateMetadata({
  params,
}: SolutionSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const solution = await getPublishedSolutionBySlug(slug);

  if (!solution) {
    return buildMetadata({
      title: "Solution Not Found",
      description: "This solution page is not available.",
      path: `/solutions/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: solution.seoTitle || solution.title,
    description: solution.seoDescription || solution.shortDescription,
    path: `/solutions/${solution.slug}`,
    canonicalOverride: solution.canonicalOverride,
    noIndex: solution.noIndex,
    image: solution.ogImagePath,
  });
}

export default async function SolutionSlugPage({
  params,
}: SolutionSlugPageProps) {
  const { slug } = await params;
  const solution = await getPublishedSolutionBySlug(slug);
  const pageContent = await getSolutionPageContentBySlug(slug);

  if (!solution || !pageContent) {
    const redirectRow = await findActiveRedirect(`/solutions/${slug}`);
    if (redirectRow?.destination) {
      redirect(redirectRow.destination);
    }
    notFound();
  }

  const content = pageContent as SolutionPageContent;

  if (isLocalVisibilitySolutionContent(content)) {
    return (
      <LocalVisibilitySolutionPage solution={solution} content={content} />
    );
  }

  if (isEcommerceGrowthSolutionContent(content)) {
    return <EcommerceGrowthSolutionPage solution={solution} content={content} />;
  }

  if (isNewBusinessSolutionContent(content)) {
    return <NewBusinessSolutionPage solution={solution} content={content} />;
  }

  if (isMigrationSolutionContent(content)) {
    return <MigrationSolutionPage solution={solution} content={content} />;
  }

  if (isConversionsSolutionContent(content)) {
    return <ConversionsSolutionPage solution={solution} content={content} />;
  }

  if (isOutdatedSolutionContent(content)) {
    return <OutdatedSolutionPage solution={solution} content={content} />;
  }

  if (isPerformanceSolutionContent(content)) {
    return <PerformanceSolutionPage solution={solution} content={content} />;
  }

  if (isRankingSolutionContent(content)) {
    return <RankingSolutionPage solution={solution} content={content} />;
  }

  if (isLeadsSolutionContent(content)) {
    return <SolutionPageTemplate solution={solution} content={content} />;
  }

  notFound();
}
