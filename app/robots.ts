import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/seo/canonical";

/**
 * robots.txt policy
 *
 * Sources consulted (2026-08):
 * - Google Search Central robots.txt guidance
 * - OpenAI OAI-SearchBot publisher guidance (allow public content; do not block discovery)
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getSiteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
