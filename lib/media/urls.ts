import type { ProductFeatureSection, Project } from "@/types";

export function getMediaPublicBaseUrl(): string | null {
  const raw = process.env.MEDIA_PUBLIC_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

/** Map a site-relative media path to the configured public object-store URL. */
export function resolveMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const base = getMediaPublicBaseUrl();
  if (base && (path.startsWith("/images/") || path.startsWith("/og/"))) {
    return `${base}${path}`;
  }

  return path;
}

export function isCloudMediaUrl(src: string): boolean {
  const base = getMediaPublicBaseUrl();
  return Boolean(base && src.startsWith(`${base}/`));
}

export function isLocalProjectScreenshot(src: string): boolean {
  if (typeof src !== "string") return false;
  if (src.startsWith("/images/projects/")) return true;
  return isCloudMediaUrl(src) && src.includes("/images/projects/");
}

function resolveGallery<T extends { src: string }>(gallery: T[] | undefined): T[] | undefined {
  if (!gallery?.length) return gallery;
  return gallery.map((item) => ({
    ...item,
    src: resolveMediaUrl(item.src),
  }));
}

function resolveProductFeatures(
  features: ProductFeatureSection[] | undefined,
): ProductFeatureSection[] | undefined {
  if (!features?.length) return features;
  return features.map((feature) => ({
    ...feature,
    image: feature.image
      ? { ...feature.image, src: resolveMediaUrl(feature.image.src) }
      : feature.image,
  }));
}

export function resolveProjectMedia<T extends Project>(project: T): T {
  return {
    ...project,
    image: project.image ? resolveMediaUrl(project.image) : project.image,
    heroImage: project.heroImage
      ? resolveMediaUrl(project.heroImage)
      : project.heroImage,
    ogImagePath: project.ogImagePath
      ? resolveMediaUrl(project.ogImagePath)
      : project.ogImagePath,
    gallery: resolveGallery(project.gallery),
    productFeatures: resolveProductFeatures(project.productFeatures),
  };
}
