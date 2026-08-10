import type { MetadataRoute } from "next";
import { buildPublicSitemapEntries } from "@/lib/public/cache";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildPublicSitemapEntries();
}
