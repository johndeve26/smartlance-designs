import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import {
  buildMetadataWithOrigin,
  type PageSeoInput,
} from "@/lib/seo/page-metadata";
import { siteOriginFromConfig } from "@/lib/seo/canonical";

type BuildMetadataInput = PageSeoInput & {
  /** @deprecated Prefer buildPageMetadata for DB-backed canonical host. */
  path?: string;
  image?: string;
};

/** Sync metadata helper — uses env site URL. Prefer buildPageMetadata in new code. */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  return buildMetadataWithOrigin({
    title: input.title,
    description: input.description,
    path: input.path ?? "",
    canonicalPath: input.canonicalPath,
    canonicalOverride: input.canonicalOverride,
    noIndex: input.noIndex,
    image: input.image,
    type: input.type,
    origin: siteOriginFromConfig(),
    defaultOgImage: siteConfig.ogImage,
  });
}

export { buildPageMetadata, buildManagedPageMetadata } from "@/lib/seo/page-metadata";
export { resolveCanonicalUrl, getSiteOrigin } from "@/lib/seo/canonical";
export type { PageSeoInput } from "@/lib/seo/page-metadata";
