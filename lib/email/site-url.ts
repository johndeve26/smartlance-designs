import { siteOriginFromConfig } from "@/lib/seo/canonical";

/** Safe origin for email CTAs — strips accidental env concatenation. */
export function emailSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  const cleaned = raw.split(/DATABASE_URL=/i)[0]?.replace(/\/$/, "") ?? "";
  if (cleaned.startsWith("http")) return cleaned;
  return siteOriginFromConfig() || "http://localhost:3000";
}
