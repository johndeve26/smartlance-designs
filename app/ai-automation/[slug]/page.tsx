import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AiAutomationDetailPage } from "@/components/ai-automation/ai-automation-detail";
import { getAiAutomationPage } from "@/lib/public/ai-automation-content";
import {
  aiAutomationSlugs,
  isAiAutomationSlug,
} from "@/lib/public/ai-automation-routes";
import { buildPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return aiAutomationSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isAiAutomationSlug(slug)) return {};
  const page = getAiAutomationPage(slug);
  if (!page) return {};
  return buildPageMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/ai-automation/${slug}`,
  });
}

export default async function AiAutomationChildPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isAiAutomationSlug(slug)) notFound();
  const page = getAiAutomationPage(slug);
  if (!page) notFound();
  return <AiAutomationDetailPage page={page} />;
}
