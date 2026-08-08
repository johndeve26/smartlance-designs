import type { ResourceKind } from "@prisma/client";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { getPublishedResourceBySlug } from "@/lib/repositories/resourcesRepository";
import { hasDatabaseUrl } from "@/lib/db";

export async function buildResourcePageMetadata(input: {
  kind: ResourceKind;
  slug: string;
  path: string;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackImage?: string;
  article?: boolean;
}) {
  if (hasDatabaseUrl()) {
    const row = await getPublishedResourceBySlug(input.kind, input.slug);
    if (row) {
      return buildPageMetadata({
        title: row.seoTitle?.trim() || input.fallbackTitle,
        description: row.seoDescription?.trim() || input.fallbackDescription,
        path: input.path,
        canonicalPath: row.canonicalOverride || input.path,
        canonicalOverride: row.canonicalOverride,
        noIndex: row.noIndex,
        image: row.ogImagePath || row.heroImagePath || input.fallbackImage,
        type: input.article ? "article" : "website",
      });
    }
  }

  return buildPageMetadata({
    title: input.fallbackTitle,
    description: input.fallbackDescription,
    path: input.path,
    image: input.fallbackImage,
    type: input.article ? "article" : "website",
  });
}
