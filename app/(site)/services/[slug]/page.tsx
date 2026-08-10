import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ServicePageTemplate } from "@/components/services/service-page-template";
import {
  getPublishedServiceBySlug,
  listPublishedServices,
} from "@/lib/public/cache";
import { findActiveRedirect } from "@/lib/repositories/redirectsRepository";
import { buildPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const services = await listPublishedServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublishedServiceBySlug(slug);
  if (!service) return {};
  return buildPageMetadata({
    title: service.metaTitle || service.title,
    description: service.metaDescription || service.summary,
    path: service.href,
    canonicalOverride: service.canonicalOverride,
    noIndex: service.noIndex,
    image: service.ogImagePath,
  });
}

export default async function ServiceSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getPublishedServiceBySlug(slug);

  if (!service) {
    const redirectRow = await findActiveRedirect(`/services/${slug}`);
    if (redirectRow?.destination) {
      redirect(redirectRow.destination);
    }
    notFound();
  }

  return <ServicePageTemplate service={service} />;
}
