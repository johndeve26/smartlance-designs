import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { getPublicSettings } from "@/lib/repositories/siteSettingsRepository";
import { getPublishedManagedPageByKey } from "@/lib/public/cache";
import {
  getSiteOrigin,
  resolveAbsoluteAssetUrl,
  resolveCanonicalUrl,
} from "@/lib/seo/canonical";

export type PageSeoInput = {
  title: string;
  description: string;
  path: string;
  canonicalPath?: string;
  canonicalOverride?: string | null;
  noIndex?: boolean;
  image?: string | null;
  type?: "website" | "article";
};

export function buildMetadataWithOrigin(
  input: PageSeoInput & {
    origin: string;
    defaultOgImage?: string;
    twitterHandle?: string;
  },
): Metadata {
  const canonical = resolveCanonicalUrl({
    origin: input.origin,
    path: input.path,
    canonicalPath: input.canonicalPath,
    canonicalOverride: input.canonicalOverride,
  });
  const defaultOg = input.defaultOgImage ?? siteConfig.ogImage;
  const imagePath = input.image?.trim() || defaultOg;
  const ogImage = resolveAbsoluteAssetUrl(input.origin, imagePath);

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: resolveCanonicalUrl({ origin: input.origin, path: input.path }),
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: input.type ?? "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [ogImage],
      ...(input.twitterHandle?.trim()
        ? { creator: input.twitterHandle.trim() }
        : siteConfig.twitterHandle
          ? { creator: siteConfig.twitterHandle }
          : {}),
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export async function buildPageMetadata(input: PageSeoInput): Promise<Metadata> {
  const settings = await getPublicSettings();
  return buildMetadataWithOrigin({
    ...input,
    origin: settings.url.replace(/\/$/, ""),
    defaultOgImage: settings.ogImage,
    twitterHandle: settings.presentation.twitterHandle,
  });
}

export async function buildManagedPageMetadata(
  key: string,
  fallback: { title: string; description: string; path: string },
): Promise<Metadata> {
  const managed = await getPublishedManagedPageByKey(key);
  if (!managed) {
    return buildPageMetadata({
      title: fallback.title,
      description: fallback.description,
      path: fallback.path,
    });
  }

  return buildPageMetadata({
    title: managed.seoTitle?.trim() || fallback.title,
    description: managed.seoDescription?.trim() || fallback.description,
    path: fallback.path,
    canonicalPath: managed.canonicalOverride || fallback.path,
    canonicalOverride: managed.canonicalOverride,
    noIndex: managed.noIndex,
    image: managed.ogImagePath,
  });
}

export async function getSiteOriginForSeo(): Promise<string> {
  return getSiteOrigin();
}
