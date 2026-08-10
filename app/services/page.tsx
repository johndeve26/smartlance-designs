import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FAQ } from "@/components/ui/faq";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { WebsiteSeoBridge } from "@/components/services/website-seo-bridge";
import { ServicesWorkCard } from "@/components/services/services-work-card";
import { PlatformCard } from "@/components/platforms/platform-card";
import { getPublishedPlatformBySlug } from "@/lib/repositories/platformsRepository";
import { listPublishedServices } from "@/lib/repositories/servicesRepository";
import { serviceGroupMeta, services as typedServices } from "@/data/services";
import { getPlatformBySlug } from "@/data/platforms";
import { seoServices } from "@/data/seo";
import { getProjectBySlug } from "@/data/portfolio";
import { servicesHubFaqs } from "@/data/testimonials";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structured-data";
import type { Service, ServiceGroupId } from "@/types";

export const metadata: Metadata = buildMetadata({
  title: "Expertise & Services",
  description:
    "Website strategy, design, development, SEO, performance, conversion, analytics and ongoing support from Smartlance Designs.",
  path: "/services",
});

const heroNav = [
  { label: "Websites", href: "#websites" },
  { label: "SEO & Growth", href: "#seo-growth" },
  { label: "Conversion", href: "#conversion-measurement" },
  { label: "Support", href: "#support" },
] as const;

const servicesWorkSlugs = [
  "the-coast",
  "zen-stays-rental",
  "gemini-corporate-relocations",
] as const;

const platformSlugs = ["wordpress", "shopify", "bigcommerce"] as const;

type HubLink = {
  title: string;
  href: string;
  summary: string;
};

function buildHubSections(published: Service[]) {
  const byGroup = (group: ServiceGroupId) =>
    published.filter((service) => service.group === group);

  return serviceGroupMeta.map((group) => {
    const serviceLinks: HubLink[] = byGroup(group.id).map((service) => ({
      title: service.shortTitle || service.title,
      href: service.href,
      summary: service.summary,
    }));

    let links = serviceLinks;

    if (group.id === "seo-growth") {
      const seoOverview: HubLink = {
        title: "SEO",
        href: "/seo",
        summary:
          "Search visibility built into structure, content and technical foundations.",
      };
      const seoLinks: HubLink[] = seoServices.map((service) => ({
        title: service.title,
        href: service.href,
        summary: service.summary,
      }));
      links = [seoOverview, ...seoLinks, ...serviceLinks];
    }

    return { ...group, links };
  });
}

export default async function ServicesPage() {
  const fromDb = await listPublishedServices();
  const published = fromDb.length > 0 ? fromDb : typedServices;
  const hubSections = buildHubSections(published);

  const projects = servicesWorkSlugs
    .map((slug) => getProjectBySlug(slug))
    .filter((project): project is NonNullable<typeof project> => Boolean(project));

  const platforms = (
    await Promise.all(
      platformSlugs.map(async (slug) => {
        const fromRepo = await getPublishedPlatformBySlug(slug);
        return fromRepo ?? getPlatformBySlug(slug) ?? null;
      }),
    )
  ).filter(
    (platform): platform is NonNullable<typeof platform> => Boolean(platform),
  );

  const [wordpress, ...otherPlatforms] = platforms;

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
          faqJsonLd(servicesHubFaqs),
        ]}
      />

      <Section className="!pt-10 !pb-8 sm:!pb-10">
        <Container>
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Services" }]}
          />
          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Expertise</p>
            <h1 className="heading-section mt-3 font-display font-semibold">
              Website, SEO &amp; Conversion Services
            </h1>
            <p className="mt-4 max-w-[40rem] text-base leading-[1.65] text-muted sm:text-[1.0625rem]">
              Strategy, design, development, search, performance and conversion
              expertise for businesses that need websites built to rank, convert
              and grow.
            </p>
            <nav
              className="-mx-5 mt-7 overflow-x-auto border-t border-border px-5 pt-5 sm:mx-0 sm:overflow-visible sm:px-0"
              aria-label="Service sections"
            >
              <ul className="flex min-w-max items-center gap-1 sm:min-w-0 sm:flex-wrap sm:gap-0">
                {heroNav.map((item, index) => (
                  <li key={item.href} className="inline-flex items-center">
                    <Link
                      href={item.href}
                      className="rounded-md px-2.5 py-2 text-[0.9375rem] font-semibold text-foreground transition-colors hover:bg-surface-muted hover:text-accent-text focus-visible:bg-surface-muted focus-visible:text-accent-text sm:text-base"
                    >
                      {item.label}
                    </Link>
                    {index < heroNav.length - 1 ? (
                      <span
                        className="mx-0.5 hidden text-border sm:inline"
                        aria-hidden
                      >
                        |
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </Container>
      </Section>

      {hubSections.map((section, sectionIndex) => (
        <Section
          key={section.id}
          id={section.id}
          tone={sectionIndex % 2 === 1 ? "muted" : "default"}
          className="!py-12 sm:!py-14 scroll-mt-28"
        >
          <Container>
            <SectionHeader
              eyebrow={
                section.id === "websites"
                  ? "01"
                  : section.id === "seo-growth"
                    ? "02"
                    : section.id === "conversion-measurement"
                      ? "03"
                      : "04"
              }
              title={section.title}
              description={section.description}
            />
            <ul className="mt-10 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {section.links.map((link) => (
                <li
                  key={`${section.id}-${link.href}-${link.title}`}
                  className="flex flex-col bg-surface px-5 py-6 sm:px-6 sm:py-7"
                >
                  <h2 className="font-display text-lg font-semibold sm:text-xl">
                    <Link
                      href={link.href}
                      className="hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {link.title}
                    </Link>
                  </h2>
                  <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                    {link.summary}
                  </p>
                  <Link
                    href={link.href}
                    className="group mt-4 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent-text hover:underline"
                  >
                    Explore {link.title}
                    <span
                      aria-hidden
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ))}

      <WebsiteSeoBridge />

      {projects.length > 0 ? (
        <Section className="!py-12 sm:!py-14 lg:!py-16">
          <Container>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                eyebrow="Work"
                title="Selected Work"
                description="Real website projects across hospitality, property and service businesses."
              />
              <Link
                href="/work"
                className="text-base font-semibold text-accent-text hover:underline"
              >
                View all work →
              </Link>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ServicesWorkCard key={project.slug} project={project} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {platforms.length > 0 ? (
        <Section tone="muted" className="!py-12 sm:!py-14 lg:!py-16">
          <Container>
            <SectionHeader
              eyebrow="Platforms"
              title="Built on the platforms teams can manage"
              description="WordPress, Shopify, BigCommerce and related platforms when they fit the business."
            />
            <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              {wordpress ? <PlatformCard platform={wordpress} featured /> : null}
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {otherPlatforms.map((platform) => (
                  <li key={platform.slug}>
                    <PlatformCard platform={platform} />
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>
      ) : null}

      <Section className="!py-12 sm:!py-14">
        <Container>
          <SectionHeader
            eyebrow="FAQ"
            title="Questions about our services"
            description="Clear answers about how Smartlance approaches website, SEO and conversion work."
          />
          <div className="mx-auto mt-8 max-w-3xl">
            <FAQ items={servicesHubFaqs} />
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-[0.9375rem] text-muted sm:text-base">
            Not sure which service you need?{" "}
            <Link
              href="/project-planner"
              className="font-semibold text-accent-text hover:underline"
            >
              Use the Project Planner →
            </Link>
            {" · "}
            <Link
              href="/pricing"
              className="font-semibold text-accent-text hover:underline"
            >
              How project pricing works →
            </Link>
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-muted">
            Need more than the website?{" "}
            <Link
              href="/ai-automation"
              className="font-semibold text-accent-text hover:underline"
            >
              Explore AI & Automation →
            </Link>
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-muted">
            Prefer to start from the business problem?{" "}
            <Link
              href="/solutions"
              className="font-semibold text-accent-text hover:underline"
            >
              Explore Solutions →
            </Link>
          </p>
        </Container>
      </Section>

      <CTASection
        title="Ready to talk about the work?"
        description="Tell us what you are trying to improve. We will recommend a practical next step — from strategy and design to SEO, performance or conversion."
        primaryLabel="Tell Us About Your Project"
        primaryHref="/contact"
        secondaryLabel="Plan Your Project"
        secondaryHref="/project-planner"
      />
    </>
  );
}
