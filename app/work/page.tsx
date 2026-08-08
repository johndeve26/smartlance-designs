import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { PortfolioFilters } from "@/components/work/portfolio-filters";
import { loadPublishedWork } from "@/lib/content/phase3-public";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Work",
  description:
    "Selected website design, development and SEO projects from Smartlance Designs.",
  path: "/work",
});

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string }>;
}) {
  const params = await searchParams;
  const projects = await loadPublishedWork();
  const projectCount = projects.length;

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
        ])}
      />

      <Section className="!pt-10 !pb-10 sm:!pb-12">
        <Container>
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Work" }]}
          />
          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Projects</p>
            <h1 className="heading-section mt-3 font-display font-semibold">
              Selected Work
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              Explore Smartlance work across hospitality, property, short-term
              rental and service businesses — from website design and
              development to SEO-focused improvements.
            </p>
            <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-subtle sm:text-base">
              Each project opens a case study with context, scope and related
              services.
            </p>
            {projectCount > 0 ? (
              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-[0.9375rem] text-muted sm:text-base">
                <li>
                  <span className="font-semibold text-foreground tabular-nums">
                    {projectCount}
                  </span>{" "}
                  published projects
                </li>
                <li className="hidden text-border sm:inline" aria-hidden>
                  |
                </li>
                <li>Hospitality, property &amp; service experience</li>
                <li className="hidden text-border sm:inline" aria-hidden>
                  |
                </li>
                <li>WordPress-led website work</li>
              </ul>
            ) : null}
          </div>
        </Container>
      </Section>

      <Section className="!pt-0 !pb-12 sm:!pb-14 lg:!pb-16">
        <Container>
          <PortfolioFilters initialPlatform={params.platform} />
        </Container>
      </Section>

      <Section tone="muted" className="!py-12 sm:!py-14">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Capability focus</p>
              <h2 className="heading-section mt-3 font-display font-semibold">
                What This Work Reflects
              </h2>
            </div>
            <div>
              <p className="text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
                Smartlance projects typically combine website design, development
                and SEO — often with platform-specific implementation,
                redesigns or performance improvements. The portfolio shows how
                those capabilities come together for real businesses.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Website Design",
                  "Website Development",
                  "SEO Foundations",
                  "Platform Implementation",
                  "Redesign & Performance",
                  "Conversion-Focused Structure",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 text-base text-foreground"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        className="!py-12 sm:!py-14 lg:!py-16"
        title="Planning a Similar Website Project?"
        description="If you’re planning a new website, redesign or SEO-led improvement, let’s talk about what your business needs."
        primaryLabel="Schedule a Free Call"
        primaryHref="/contact"
        secondaryLabel="Get a Free Website Review"
        secondaryHref="/free-website-review"
      />
    </>
  );
}
