import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { IndustryPageTemplate } from "@/components/industries/industry-page-template";
import { loadIndustryBySlug, loadPublishedIndustries } from "@/lib/content/phase3-public";
import { findActiveRedirect } from "@/lib/repositories/redirectsRepository";
import { buildPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const industries = await loadPublishedIndustries();
  return industries.map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const industry = await loadIndustryBySlug(slug);
  if (!industry) return {};

  const fallbackTitle = `${industry.name} Websites & SEO | Smartlance Designs`;
  const fallbackDescription =
    industry.seoDescription?.trim() ||
    industry.description ||
    `Website design, development and SEO considerations for ${industry.name.toLowerCase()} businesses.`;

  return buildPageMetadata({
    title: industry.seoTitle?.trim() || fallbackTitle,
    description: fallbackDescription,
    path: `/industries/${industry.slug}`,
    canonicalOverride: industry.canonicalOverride,
    noIndex: industry.noIndex,
    image: industry.ogImagePath,
  });
}

export default async function IndustryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const industry = await loadIndustryBySlug(slug);

  if (!industry) {
    const redirectRow = await findActiveRedirect(`/industries/${slug}`);
    if (redirectRow?.destination) {
      redirect(redirectRow.destination);
    }
    notFound();
  }

  return <IndustryPageTemplate industry={industry} />;
}
