import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/ui/structured-data";
import { CaseStudyPageBody } from "@/components/work/case-study/case-study-page-body";
import { PortfolioViewTracker } from "@/components/work/portfolio-view-tracker";
import {
  loadAdjacentWork,
  loadPublishedWork,
  loadRelatedWork,
  loadTestimonialForWork,
  loadWorkBySlug,
} from "@/lib/content/phase3-public";
import { buildPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const projects = await loadPublishedWork();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await loadWorkBySlug(slug);
  if (!project) return {};
  return buildPageMetadata({
    title: project.metaTitle || project.name,
    description: project.metaDescription || project.shortDescription || "",
    path: `/work/${project.slug}`,
    canonicalOverride: project.canonicalOverride,
    noIndex: project.noIndex || !project.published,
    image: project.ogImagePath || project.heroImage || project.image,
  });
}

export default async function CaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await loadWorkBySlug(slug);
  if (!project) notFound();

  const related = await loadRelatedWork(project, 2);
  const { previous, next } = await loadAdjacentWork(project.slug);

  const linkedTestimonial = await loadTestimonialForWork(project.slug);

  const feedback =
    linkedTestimonial && linkedTestimonial.quote.trim().length > 0
      ? {
          quote: linkedTestimonial.quote,
          name: linkedTestimonial.name,
          role: [linkedTestimonial.role, linkedTestimonial.company]
            .filter(Boolean)
            .join(", "),
        }
      : project.clientFeedback &&
          !project.clientFeedback.isPlaceholder &&
          project.clientFeedback.quote.trim().length > 0
        ? {
            quote: project.clientFeedback.quote,
            name: project.clientFeedback.name,
            role: project.clientFeedback.role,
          }
        : null;

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
          { name: project.name, path: `/work/${project.slug}` },
        ])}
      />

      <CaseStudyPageBody
        project={project}
        related={related}
        previous={previous}
        next={next}
        feedback={feedback}
      />

      <PortfolioViewTracker slug={project.slug} />
    </>
  );
}
