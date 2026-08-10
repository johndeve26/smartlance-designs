import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/ui/cta-section";
import { StructuredData } from "@/components/ui/structured-data";
import { buildPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { PUBLIC_CTAS } from "@/lib/public/cta-map";

const tools = [
  {
    title: "Free Website Review",
    description:
      "For an existing website — see what could be improved and what to prioritize first.",
    href: PUBLIC_CTAS.freeReview.href,
    cta: PUBLIC_CTAS.reviewMyWebsite.label,
    featured: true,
  },
  {
    title: "Website Brief Builder",
    description:
      "For a planned website — organize goals, pages and requirements into a structured brief.",
    href: PUBLIC_CTAS.websiteBrief.href,
    cta: PUBLIC_CTAS.buildMyBrief.label,
    featured: false,
  },
  {
    title: "Project Planner",
    description:
      "Not sure what you need yet? Work through the type of project or support that fits.",
    href: PUBLIC_CTAS.projectPlanner.href,
    cta: PUBLIC_CTAS.projectPlanner.label,
    featured: false,
  },
];

const chooser = [
  {
    situation: "I have an existing website",
    tool: "Free Website Review",
    href: PUBLIC_CTAS.freeReview.href,
  },
  {
    situation: "I am planning a new website",
    tool: "Website Brief Builder",
    href: PUBLIC_CTAS.websiteBrief.href,
  },
  {
    situation: "I am not sure what project I need",
    tool: "Project Planner",
    href: PUBLIC_CTAS.projectPlanner.href,
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Free Tools",
    description:
      "Free Smartlance tools for reviewing your current website, planning a new project brief, or working out what support you need next.",
    path: "/free-tools",
  });
}

export default function FreeToolsPage() {
  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free Tools", path: "/free-tools" },
        ])}
      />

      <section className="section-padding bg-surface">
        <Container>
          <div className="max-w-3xl">
            <p className="eyebrow">Free tools</p>
            <h1 className="heading-page mt-3 font-display font-semibold">
              Free Tools for Planning and Improving Your Website
            </h1>
            <p className="section-deck mt-6">
              Practical starting points before you commit to a proposal — review
              what you have, plan what you need, or work out the right type of
              project.
            </p>
          </div>
        </Container>
      </section>

      <section className="section-padding border-t border-border bg-[#FAF9F7]">
        <Container className="space-y-8">
          {tools.map((tool) => (
            <article
              key={tool.href}
              className={`rounded-lg border border-border bg-surface p-8 ${
                tool.featured ? "lg:p-10" : ""
              }`}
            >
              {tool.featured ? (
                <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
                  Most popular
                </p>
              ) : null}
              <h2 className="mt-2 font-display text-2xl font-semibold">{tool.title}</h2>
              <p className="body-copy mt-4 max-w-2xl">{tool.description}</p>
              <Button asChild size="lg" className="mt-6" variant={tool.featured ? "primary" : "outline"}>
                <Link href={tool.href}>{tool.cta}</Link>
              </Button>
            </article>
          ))}
        </Container>
      </section>

      <section className="section-padding bg-surface">
        <Container>
          <h2 className="heading-section font-display font-semibold">
            Which tool should I use?
          </h2>
          <ul className="mt-8 divide-y divide-border border-y border-border">
            {chooser.map((row) => (
              <li
                key={row.href}
                className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-foreground">{row.situation}</span>
                <Link href={row.href} className="link-action">
                  → {row.tool}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <CTASection
        title="Ready for the next step?"
        description="When you know what you need, tell us about the project and we will help figure out the right approach."
        primaryLabel={PUBLIC_CTAS.project.label}
        primaryHref={PUBLIC_CTAS.project.href}
        secondaryLabel={PUBLIC_CTAS.howWeWork.label}
        secondaryHref={PUBLIC_CTAS.howWeWork.href}
      />
    </>
  );
}
