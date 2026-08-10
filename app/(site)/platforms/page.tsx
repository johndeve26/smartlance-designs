import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FAQ } from "@/components/ui/faq";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { PlatformCard } from "@/components/platforms/platform-card";
import { ProjectCard } from "@/components/ui/project-card";
import { platformGroupMeta, platforms as typedPlatforms } from "@/data/platforms";
import { listPublishedPlatforms } from "@/lib/public/cache";
import { getProjectBySlug } from "@/data/portfolio";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structured-data";
import type { Platform, PlatformGroupId } from "@/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Website Platforms We Work With",
  description:
    "WordPress, Shopify, WooCommerce, Webflow, BigCommerce, Wix Studio, Squarespace, Framer, HubSpot CMS, Salesforce and Clixlo — platforms Smartlance Designs can design, build and improve websites with.",
  path: "/platforms",
});

const heroNav = [
  { label: "Website", href: "#websites" },
  { label: "E-commerce", href: "#ecommerce" },
  { label: "Connected", href: "#connected" },
  { label: "How we choose", href: "#how-we-choose" },
] as const;

const decisionGuide = [
  {
    label: "Content-heavy / flexible",
    platforms: "WordPress",
    note: "Often a good fit when publishing, ownership and flexibility matter.",
  },
  {
    label: "Commerce",
    platforms: "Shopify · WooCommerce · BigCommerce",
    note: "Often a good fit when catalogues, product discovery and checkout are central.",
  },
  {
    label: "Visual marketing sites",
    platforms: "Webflow · Framer",
    note: "Often a good fit for polished marketing and product experiences.",
  },
  {
    label: "Simpler managed business sites",
    platforms: "Squarespace · Wix Studio",
    note: "Often a good fit when editing simplicity and managed hosting matter.",
  },
  {
    label: "Marketing + CRM",
    platforms: "HubSpot CMS",
    note: "Often a good fit when website and marketing operations need to connect.",
  },
  {
    label: "Connected CRM workflows",
    platforms: "Salesforce",
    note: "Useful when website lead capture needs to hand off into CRM journeys.",
  },
] as const;

const chooseFactors = [
  "Website goals",
  "Content needs",
  "E-commerce requirements",
  "Integrations",
  "Internal team and editing needs",
  "SEO requirements",
  "Performance",
  "Budget",
  "Future growth",
] as const;

const platformsFaqs = [
  {
    question: "Which platform is best?",
    answer:
      "There is no universally best platform. The right choice depends on goals, content, commerce, integrations, SEO needs and how your team will manage the site.",
  },
  {
    question: "Do you only work with WordPress?",
    answer:
      "No. WordPress is a strong capability with verified project experience, but Smartlance also works across commerce and marketing platforms when they fit the project.",
  },
  {
    question: "Can you migrate my website between platforms?",
    answer:
      "Yes, when migration is the right move. We also redesign within the current platform when that is more practical. See Website Migration for how risk is reduced.",
  },
  {
    question: "Do you claim vendor partner badges?",
    answer:
      "No. Platform pages describe what Smartlance can design, build and improve — without unsupported partnership or certification claims.",
  },
] as const;

const workSlugs = [
  "the-coast",
  "gemini-corporate-relocations",
  "overlook-cabin-rentals",
] as const;

const groupOrder: Record<string, string[]> = {
  websites: [
    "wordpress",
    "webflow",
    "wix-studio",
    "squarespace",
    "framer",
    "hubspot-cms",
  ],
  ecommerce: ["shopify", "woocommerce", "bigcommerce"],
  connected: ["salesforce", "clixlo"],
};

function sortGroup(platforms: Platform[], groupId: string) {
  const order = groupOrder[groupId] ?? [];
  return [...platforms].sort((a, b) => {
    const ai = order.indexOf(a.slug);
    const bi = order.indexOf(b.slug);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function platformsByGroup(published: Platform[], group: PlatformGroupId) {
  return published.filter((platform) => platform.group === group);
}

export default async function PlatformsPage() {
  const fromDb = await listPublishedPlatforms();
  const published = fromDb.length > 0 ? fromDb : typedPlatforms;
  const projects = workSlugs
    .map((slug) => getProjectBySlug(slug))
    .filter((project): project is NonNullable<typeof project> => Boolean(project));

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Platforms", path: "/platforms" },
          ]),
          faqJsonLd([...platformsFaqs]),
        ]}
      />

      <Section className="!pt-10 !pb-10 sm:!pb-12">
        <Container>
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Platforms" }]}
          />
          <div className="mt-8 max-w-3xl">
            <p className="eyebrow">Platforms</p>
            <h1 className="mt-3 font-display text-[clamp(2.25rem,4vw,3.75rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
              The Right Platform for the Website You Actually Need
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-[1.7] text-muted sm:text-lg">
              The right technology depends on what the business needs to build,
              connect or automate. We design, build and improve websites across
              established content, commerce and marketing platforms — choosing
              systems around the business rather than forcing every project into
              the same stack.
            </p>
            <nav
              className="-mx-5 mt-8 overflow-x-auto border-t border-border px-5 pt-5 sm:mx-0 sm:overflow-visible sm:px-0"
              aria-label="Platform sections"
            >
              <ul className="flex min-w-max items-center gap-1 sm:min-w-0 sm:flex-wrap">
                {heroNav.map((item, index) => (
                  <li key={item.href} className="inline-flex items-center">
                    <Link
                      href={item.href}
                      className="rounded-md px-2.5 py-2 text-[0.9375rem] font-semibold text-foreground hover:bg-surface-muted hover:text-accent-text sm:text-base"
                    >
                      {item.label}
                    </Link>
                    {index < heroNav.length - 1 ? (
                      <span className="mx-0.5 hidden text-border sm:inline" aria-hidden>
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

      {platformGroupMeta.map((group, index) => {
        const items = sortGroup(platformsByGroup(published, group.id), group.id);
        return (
          <Section
            key={group.id}
            id={group.id}
            tone={index % 2 === 1 ? "muted" : "default"}
            className="!py-12 sm:!py-14 scroll-mt-28"
          >
            <Container>
              <SectionHeader
                eyebrow={String(index + 1).padStart(2, "0")}
                title={group.title}
                description={group.description}
              />
              <ul
                className={cn(
                  "mt-10 grid gap-5",
                  group.id === "connected"
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2 lg:grid-cols-3",
                )}
              >
                {items.map((platform) => (
                  <li key={platform.slug}>
                    <PlatformCard
                      platform={platform}
                      className={cn(
                        platform.prominence === "high" &&
                          "border-accent/20 shadow-sm sm:p-7",
                        platform.prominence === "low" &&
                          "border-border/70 bg-surface/80",
                      )}
                    />
                  </li>
                ))}
              </ul>
            </Container>
          </Section>
        );
      })}

      <Section id="how-we-choose" className="!py-14 sm:!py-16 scroll-mt-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-16">
            <div>
              <p className="eyebrow">Decision</p>
              <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-tight sm:text-4xl">
                We Don&apos;t Choose the Platform First.
              </h2>
              <p className="mt-4 text-base leading-[1.7] text-muted sm:text-[1.0625rem]">
                Platform recommendations follow the website you need — not the
                other way around.
              </p>
              <p className="mt-5">
                <Link
                  href="/tools/website-platform-selector"
                  className="text-sm font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Not sure where to start? Try the Website Platform Selector
                </Link>
              </p>
            </div>
            <ul className="grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
              {chooseFactors.map((factor) => (
                <li
                  key={factor}
                  className="border-b border-r border-border px-5 py-5 text-[0.9375rem] font-medium text-foreground sm:text-base"
                >
                  {factor}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-14">
            <h3 className="font-display text-xl font-semibold sm:text-2xl">
              Directional guidance
            </h3>
            <p className="mt-2 max-w-2xl text-base text-muted">
              Useful starting points — not universal rules.
            </p>
            <ul className="mt-8 divide-y divide-border border-y border-border">
              {decisionGuide.map((item) => (
                <li
                  key={item.label}
                  className="grid gap-2 py-5 sm:grid-cols-[minmax(0,0.34fr)_minmax(0,0.28fr)_minmax(0,0.38fr)] sm:gap-6 sm:py-6"
                >
                  <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
                    {item.label}
                  </p>
                  <p className="font-display text-base font-semibold text-foreground sm:text-lg">
                    {item.platforms}
                  </p>
                  <p className="text-[0.9375rem] leading-snug text-muted sm:text-base">
                    {item.note}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {projects.length > 0 ? (
        <Section tone="muted" className="!py-12 sm:!py-14">
          <Container>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                eyebrow="Work"
                title="Selected Work"
                description="Verified Smartlance projects — currently WordPress-led portfolio work."
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
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <Section className="!py-12 sm:!py-14">
        <Container>
          <SectionHeader
            eyebrow="FAQ"
            title="Platform questions"
            description="Clear answers about how Smartlance approaches platform choice."
          />
          <div className="mx-auto mt-8 max-w-3xl">
            <FAQ items={[...platformsFaqs]} />
          </div>
        </Container>
      </Section>

      <CTASection
        title="Not Sure Which Platform Fits Your Project?"
        description="Use the Platform Selector to narrow options based on content, commerce, SEO and how your team will manage the site — or tell us what you need the website to do."
        primaryLabel="Use Website Platform Selector"
        primaryHref="/tools/website-platform-selector"
        secondaryLabel="Tell Us About Your Project"
        secondaryHref="/contact"
      />
    </>
  );
}
