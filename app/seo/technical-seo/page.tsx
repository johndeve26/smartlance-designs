import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoPageTemplate } from "@/components/seo/seo-page-template";
import { getSeoServiceBySlug } from "@/data/seo";
import { buildMetadata } from "@/lib/seo";

const slug = "technical-seo";

export const metadata: Metadata = (() => {
  const service = getSeoServiceBySlug(slug)!;
  return buildMetadata({
    title: service.metaTitle,
    description: service.metaDescription,
    path: service.href,
  });
})();

export default function Page() {
  const service = getSeoServiceBySlug(slug);
  if (!service) notFound();
  return <SeoPageTemplate service={service} />;
}
