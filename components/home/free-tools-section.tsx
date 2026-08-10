import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PUBLIC_CTAS } from "@/lib/public/cta-map";

const supportingTools = [
  {
    title: "Website Brief Builder",
    description:
      "Turn your ideas, goals and requirements into a structured website project brief.",
    href: PUBLIC_CTAS.websiteBrief.href,
    cta: PUBLIC_CTAS.buildMyBrief.label,
  },
  {
    title: "Project Planner",
    description:
      "Work through what type of project or support you need before you commit to a proposal.",
    href: PUBLIC_CTAS.projectPlanner.href,
    cta: PUBLIC_CTAS.projectPlanner.label,
  },
];

export function FreeToolsSection() {
  return (
    <section className="section-padding bg-[#FAF9F7]">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Free tools</p>
          <h2 className="heading-section mt-3 font-display font-semibold">
            Start With Something Useful
          </h2>
          <p className="section-deck mt-5">
            Not every project starts with a proposal. Use our free tools to
            understand your website, organize your ideas, or plan what comes
            next.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-8">
          <article className="rounded-lg border border-border bg-surface p-8 lg:p-10">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-accent-text">
              Featured
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold sm:text-[1.75rem]">
              Free Website Review
            </h3>
            <p className="body-copy mt-4 max-w-[42ch]">
              See what could be improved on your existing website and what to
              prioritize first — a practical starting point, not a sales pitch.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href={PUBLIC_CTAS.freeReview.href}>
                {PUBLIC_CTAS.reviewMyWebsite.label}
              </Link>
            </Button>
          </article>

          <div className="flex flex-col gap-6">
            {supportingTools.map((tool) => (
              <article
                key={tool.href}
                className="flex flex-1 flex-col rounded-lg border border-border bg-surface p-6"
              >
                <h3 className="font-display text-xl font-semibold">{tool.title}</h3>
                <p className="body-copy mt-2 flex-1">{tool.description}</p>
                <Link
                  href={tool.href}
                  className="link-action group mt-5 inline-flex items-center gap-1"
                >
                  {tool.cta}
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                    aria-hidden
                  />
                </Link>
              </article>
            ))}
          </div>
        </div>

        <p className="mt-8">
          <Link href={PUBLIC_CTAS.freeTools.href} className="link-action">
            View all free tools →
          </Link>
        </p>
      </Container>
    </section>
  );
}
