import type { MetadataRoute } from "next";
import { buildPublicSitemapEntries } from "@/lib/seo/sitemap-entries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildPublicSitemapEntries();
}
