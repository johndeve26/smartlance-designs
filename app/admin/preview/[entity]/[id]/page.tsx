import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  ADMIN_PREVIEW_COOKIE,
  verifyPreviewToken,
} from "@/lib/admin/crypto";
import { getSessionUser } from "@/lib/admin/session";
import { getServiceForPreview } from "@/lib/repositories/servicesRepository";
import { getSolutionForPreview } from "@/lib/repositories/solutionsRepository";
import { getPlatformForPreview } from "@/lib/repositories/platformsRepository";
import { getWorkForPreview } from "@/lib/repositories/workRepository";
import { CaseStudyPageBody } from "@/components/work/case-study/case-study-page-body";
import { getInsightByIdAdmin, toPublicInsight } from "@/lib/repositories/insightsRepository";
import { getResourceByIdAdmin } from "@/lib/repositories/resourcesRepository";
import { getIndustryByIdAdmin } from "@/lib/repositories/industriesRepository";
import { getHomepageForPreview } from "@/lib/repositories/homepageRepository";
import { BlogMarkdown } from "@/components/blog/blog-markdown";
import { ServicePageTemplate } from "@/components/services/service-page-template";
import { PlatformPageTemplate } from "@/components/platforms/platform-page-template";
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

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  params: Promise<{ entity: string; id: string }>;
  searchParams: Promise<{ preview?: string }>;
};

const ENTITY_MAP: Record<string, string> = {
  service: "Service",
  solution: "Solution",
  platform: "Platform",
  work: "WorkProject",
  insight: "Insight",
  resource: "CmsResource",
  industry: "Industry",
  homepage: "HomepageContent",
};

async function authorizePreview(
  entityType: string,
  entityId: string,
  queryToken?: string,
) {
  const session = await getSessionUser();
  if (session) return true;

  const jar = await cookies();
  const cookieToken = jar.get(ADMIN_PREVIEW_COOKIE)?.value;
  const token = queryToken || cookieToken;
  if (!token) return false;

  const verified = verifyPreviewToken(token, entityType, entityId);
  return Boolean(verified);
}

function renderSolutionPreview(
  solution: NonNullable<
    Awaited<ReturnType<typeof getSolutionForPreview>>
  >["solution"],
  pageContent: Record<string, unknown> | null,
) {
  if (!pageContent || typeof pageContent.kind !== "string") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">{solution.title}</h1>
        <p className="mt-2 text-neutral-600">{solution.shortDescription}</p>
        <p className="mt-6 text-sm text-amber-700">
          No pageContent JSON stored for this draft — catalogue fields only.
        </p>
      </div>
    );
  }

  const content = pageContent as SolutionPageContent;

  if (isLocalVisibilitySolutionContent(content)) {
    return (
      <LocalVisibilitySolutionPage solution={solution} content={content} />
    );
  }
  if (isEcommerceGrowthSolutionContent(content)) {
    return (
      <EcommerceGrowthSolutionPage solution={solution} content={content} />
    );
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">{solution.title}</h1>
      <p className="mt-2 text-neutral-600">
        Unrecognized pageContent kind for preview.
      </p>
    </div>
  );
}

export default async function AdminPreviewPage({
  params,
  searchParams,
}: PageProps) {
  const { entity, id } = await params;
  const { preview: queryToken } = await searchParams;
  const entityType = ENTITY_MAP[entity];
  if (!entityType) notFound();

  const ok = await authorizePreview(entityType, id, queryToken);
  if (!ok) notFound();

  if (entityType === "Service") {
    const service = await getServiceForPreview(id);
    if (!service) notFound();
    return <ServicePageTemplate service={service} />;
  }

  if (entityType === "Platform") {
    const platform = await getPlatformForPreview(id);
    if (!platform) notFound();
    return <PlatformPageTemplate platform={platform} />;
  }

  if (entityType === "Solution") {
    const data = await getSolutionForPreview(id);
    if (!data) notFound();
    return renderSolutionPreview(data.solution, data.pageContent);
  }

  if (entityType === "WorkProject") {
    const project = await getWorkForPreview(id);
    if (!project) notFound();
    return <CaseStudyPageBody project={project} preview />;
  }

  if (entityType === "Insight") {
    const row = await getInsightByIdAdmin(id);
    if (!row) notFound();
    const post = toPublicInsight(row);
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs uppercase tracking-wide text-amber-700">Draft preview</p>
        <h1 className="mt-2 text-3xl font-semibold">{post.title}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {post.publishedAt.slice(0, 10)} · {post.category}
        </p>
        <div className="prose-smartlance mt-8">
          <BlogMarkdown content={post.content} />
        </div>
      </div>
    );
  }

  if (entityType === "CmsResource") {
    const row = await getResourceByIdAdmin(id);
    if (!row) notFound();
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs uppercase tracking-wide text-amber-700">Draft preview</p>
        <h1 className="mt-2 text-3xl font-semibold">{row.title}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {row.type} · {row.href}
        </p>
        <p className="mt-4 text-neutral-600">{row.description}</p>
        <pre className="mt-8 overflow-auto rounded bg-neutral-100 p-4 text-xs">
          {JSON.stringify(row.payload, null, 2)}
        </pre>
      </div>
    );
  }

  if (entityType === "Industry") {
    const row = await getIndustryByIdAdmin(id);
    if (!row) notFound();
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs uppercase tracking-wide text-amber-700">Draft preview</p>
        <h1 className="mt-2 text-3xl font-semibold">{row.name}</h1>
        <p className="mt-4 text-neutral-600">{row.description}</p>
      </div>
    );
  }

  if (entityType === "HomepageContent") {
    const home = await getHomepageForPreview();
    if (!home) notFound();
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs uppercase tracking-wide text-amber-700">
          Homepage draft preview
        </p>
        <p className="mt-4 text-sm uppercase tracking-wide text-neutral-500">
          {home.hero.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          {home.hero.headline}
          {home.hero.headlineAccent ? (
            <span className="text-[var(--brand,#F47A48)]">
              {" "}
              {home.hero.headlineAccent}
            </span>
          ) : null}
        </h1>
        <p className="mt-4 text-neutral-600">{home.hero.supporting}</p>
        <p className="mt-6 text-sm">
          <span className="font-medium">{home.hero.primaryCtaLabel}</span>
          {" → "}
          {home.hero.primaryCtaHref}
          {" · "}
          <span className="font-medium">{home.hero.secondaryCtaLabel}</span>
          {" → "}
          {home.hero.secondaryCtaHref}
        </p>
        <p className="mt-8 text-xs text-neutral-500">
          SEO: {home.seoTitle || home.metaTitle || "—"}
        </p>
      </div>
    );
  }

  notFound();
}
