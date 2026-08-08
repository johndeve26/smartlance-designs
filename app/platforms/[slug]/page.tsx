import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PlatformPageTemplate } from "@/components/platforms/platform-page-template";
import {
  getPublishedPlatformBySlug,
  listPublishedPlatforms,
} from "@/lib/repositories/platformsRepository";
import { findActiveRedirect } from "@/lib/repositories/redirectsRepository";
import { getVisibleProjects } from "@/data/portfolio";
import { buildPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const platforms = await listPublishedPlatforms();
  return platforms.map((platform) => ({ slug: platform.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const platform = await getPublishedPlatformBySlug(slug);
  if (!platform) return {};
  return buildPageMetadata({
    title: platform.metaTitle || platform.title,
    description: platform.metaDescription || platform.summary,
    path: platform.href,
    canonicalOverride: platform.canonicalOverride,
    noIndex: platform.noIndex,
    image: platform.ogImagePath,
  });
}

export default async function PlatformPage({ params }: PageProps) {
  const { slug } = await params;
  const platform = await getPublishedPlatformBySlug(slug);

  if (!platform) {
    const redirectRow = await findActiveRedirect(`/platforms/${slug}`);
    if (redirectRow?.destination) {
      redirect(redirectRow.destination);
    }
    notFound();
  }

  const relatedProjects = getVisibleProjects().filter((project) => {
    const projectPlatforms = [
      project.platform,
      ...(project.platforms ?? []),
    ].filter(Boolean);
    return projectPlatforms.includes(platform.platformMatch);
  });

  return (
    <PlatformPageTemplate
      platform={platform}
      relatedProjects={relatedProjects}
    />
  );
}
