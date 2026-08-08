import type { Metadata } from "next";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { AboutHero } from "@/components/about/about-hero";
import {
  AboutDontOptimize,
  AboutExperience,
  AboutPhilosophy,
  AboutProcess,
  AboutSelectedWork,
  AboutTeam,
  AboutTestimonial,
  AboutValues,
  AboutWho,
  AboutWorkingWith,
} from "@/components/about/about-sections";
import {
  aboutFeaturedProjectSlugs,
  aboutTestimonialId,
} from "@/data/about";
import { getProjectBySlug, getVisibleProjects } from "@/data/portfolio";
import { getTestimonialById } from "@/data/testimonials";
import { buildManagedPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("about", {
    title: "About",
    description:
      "Learn how Smartlance Designs builds websites around clarity, SEO and conversion — with verified experience across hospitality, property and service businesses.",
    path: "/about",
  });
}

export default function AboutPage() {
  const featuredProjects = aboutFeaturedProjectSlugs
    .map((slug) => getProjectBySlug(slug))
    .filter((project): project is NonNullable<typeof project> => Boolean(project));

  const collageProjects =
    featuredProjects.length > 0
      ? featuredProjects
      : getVisibleProjects().slice(0, 3);

  const testimonial = getTestimonialById(aboutTestimonialId) ?? null;

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      <AboutHero projects={collageProjects} />

      <AboutWho />

      <AboutPhilosophy />

      <AboutValues />

      <AboutExperience />

      <AboutSelectedWork projects={featuredProjects} />

      <AboutWorkingWith />

      <AboutProcess />

      <AboutDontOptimize />

      <AboutTeam />

      <AboutTestimonial testimonial={testimonial} />

      <CTASection
        className="!py-14 sm:!py-16 lg:!py-[4.5rem]"
        title="Want to talk through your website?"
        description="Tell us what you’re trying to improve. We’ll help you identify the most useful next step."
        primaryLabel="Tell Us About Your Project"
        primaryHref="/contact"
        secondaryLabel="Explore Services"
        secondaryHref="/services"
      />
    </>
  );
}
