import { siteConfig } from "@/lib/site";
import { getPublicSettings } from "@/lib/repositories/siteSettingsRepository";

/** Canonical production origin (DB canonicalHost when configured). */
export async function getSiteOrigin(): Promise<string> {
  const settings = await getPublicSettings();
  return settings.url.replace(/\/$/, "");
}

export function resolveCanonicalUrl(input: {
  origin: string;
  path?: string;
  canonicalPath?: string;
  canonicalOverride?: string | null;
}): string {
  const override = input.canonicalOverride?.trim();
  const base = input.origin.replace(/\/$/, "");

  if (override) {
    if (/^https?:\/\//i.test(override)) {
      return override.replace(/\/$/, "");
    }
    const path = override.startsWith("/") ? override : `/${override}`;
    return `${base}${path}`;
  }

  const path = input.canonicalPath ?? input.path ?? "";
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolveAbsoluteAssetUrl(
  origin: string,
  imagePath: string,
): string {
  if (imagePath.startsWith("http")) return imagePath;
  return resolveCanonicalUrl({ origin, path: imagePath });
}

/** Sync helper when settings origin is already known. */
export function siteOriginFromConfig(): string {
  return siteConfig.url.replace(/\/$/, "");
}
