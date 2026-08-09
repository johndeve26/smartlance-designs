import { getMediaPublicBaseUrl, resolveMediaUrl } from "@/lib/media/urls";

/** Approved site-relative public asset roots (under `public/`). */
export const APPROVED_PUBLIC_MEDIA_PREFIXES = ["/images/", "/og/"] as const;

const UNSAFE_SCHEME = /^(javascript|data|file|vbscript):/i;

export type MediaReferenceKind =
  | "static"
  | "managed"
  | "external"
  | "invalid";

export type MediaReferenceClassification =
  | "VALID_STATIC"
  | "VALID_MANAGED"
  | "EXTERNAL_URL"
  | "INVALID"
  | "UNKNOWN";

/**
 * Normalize a content-stored media reference to a stable site-relative path when possible.
 * Returns null for unsafe or unresolvable input.
 */
export function normalizePublicMediaPath(
  input: string | null | undefined,
): string | null {
  if (!input || typeof input !== "string") return null;
  let value = input.trim();
  if (!value) return null;

  if (UNSAFE_SCHEME.test(value)) return null;
  if (value.includes("..")) return null;

  const base = getMediaPublicBaseUrl();
  if (base && value.startsWith(`${base}/`)) {
    value = value.slice(base.length);
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return null;
    } catch {
      return null;
    }
  }

  if (!value.startsWith("/")) {
    if (value.startsWith("images/") || value.startsWith("og/")) {
      value = `/${value}`;
    } else {
      return null;
    }
  }

  value = value.replace(/\/+/g, "/");
  if (!APPROVED_PUBLIC_MEDIA_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    return null;
  }

  return value;
}

export function classifyMediaReference(
  ref: string | null | undefined,
): MediaReferenceClassification {
  if (!ref || typeof ref !== "string" || !ref.trim()) return "UNKNOWN";
  if (UNSAFE_SCHEME.test(ref.trim()) || ref.includes("..")) return "INVALID";

  const normalized = normalizePublicMediaPath(ref);
  if (normalized) return "VALID_STATIC";

  if (/^https?:\/\//i.test(ref.trim())) return "EXTERNAL_URL";

  if (ref.startsWith("/uploads/") || ref.includes("/uploads/")) {
    return "VALID_MANAGED";
  }

  const base = getMediaPublicBaseUrl();
  if (base && ref.startsWith(`${base}/`)) return "VALID_MANAGED";

  return "UNKNOWN";
}

export function mediaReferenceKind(ref: string): MediaReferenceKind {
  const classification = classifyMediaReference(ref);
  if (classification === "VALID_STATIC") return "static";
  if (classification === "VALID_MANAGED" || classification === "EXTERNAL_URL") {
    return classification === "EXTERNAL_URL" ? "external" : "managed";
  }
  return "invalid";
}

/** Resolve a stored reference to the public URL served to browsers. */
export function resolvePublicMediaReference(
  ref: string | null | undefined,
): string {
  if (!ref) return "";
  const normalized = normalizePublicMediaPath(ref);
  if (normalized) return resolveMediaUrl(normalized);
  if (/^https?:\/\//i.test(ref.trim())) return ref.trim();
  const base = getMediaPublicBaseUrl();
  if (base && ref.startsWith(`${base}/`)) return ref.trim();
  return ref.trim();
}

/** Compare a content reference to a MediaAsset publicUrl (handles CDN prefix variants). */
export function mediaReferencesMatch(
  contentRef: string | null | undefined,
  assetPublicUrl: string,
): boolean {
  if (!contentRef || !assetPublicUrl) return false;
  if (contentRef === assetPublicUrl) return true;

  const contentNorm = normalizePublicMediaPath(contentRef);
  const assetNorm = normalizePublicMediaPath(assetPublicUrl);
  if (contentNorm && assetNorm && contentNorm === assetNorm) return true;

  const base = getMediaPublicBaseUrl();
  if (base) {
    if (contentRef === `${base}${assetNorm}`) return true;
    if (assetPublicUrl === `${base}${contentNorm}`) return true;
  }

  return false;
}

export function staticStorageKey(publicPath: string): string {
  const normalized =
    normalizePublicMediaPath(publicPath) ??
    (publicPath.startsWith("/") ? publicPath : `/${publicPath}`);
  return `static:${normalized}`;
}
