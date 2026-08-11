import { sanitizeSiteOrigin } from "@/lib/site";
import { siteOriginFromConfig } from "@/lib/seo/canonical";

/** Safe origin for email CTAs — strips accidental env concatenation. */
export function emailSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return sanitizeSiteOrigin(raw);
  return siteOriginFromConfig() || "http://localhost:3000";
}
